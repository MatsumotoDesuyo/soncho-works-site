// Amazon アソシエイトのリンクをビルド時に一本化する Sätteri の hast プラグイン。
//
// 本文の Markdown には素の Amazon URL だけを書く。トラッキング ID の付与・rel 属性・
// 商品名の肉付けはすべてここで行うので、ID を変えても記事側は書き換えなくてよい。
// site.config.ts の amazon.tag が正本である。
//
//   - URL を https://www.amazon.co.jp/dp/<ASIN>?tag=<tag> の正規形に揃える
//   - rel="sponsored nofollow noopener" と target="_blank" を付ける
//     (rel="sponsored" は Google がアフィリエイトリンクに求めている表明)
//   - ASIN が amazon-products.json にあれば、商品名入りのカードに組み替える
//
// 商品画像と価格は出さない。表示にはアソシエイト運営規約上 Creators API 経由での
// 取得が必要で、その利用資格 (直近 30 日で適格販売 10 件) を満たしていないため。

import { site } from '../site.config.ts';
import products from '../data/amazon-products.json';

const TAG = site.amazon.tag;

/**
 * Amazon のリンクかどうかを判定し、商品ページなら ASIN を取り出す。
 *
 * @param {string} href リンクの href。相対 URL や #anchor なども来る。
 * @returns {{ asin: string | null } | null}
 *   Amazon のリンクでなければ null。Amazon のリンクなら、商品ページの場合は
 *   { asin: 'B01L8EOOY4' }、検索結果など商品ページ以外の場合は { asin: null }。
 */
function parseAmazonLink(href) {
  // href の大半は /category/xxx/ や #section といった相対リンクで、これは異常ではなく
  // 通常のケース。new URL() の例外に頼らず、通常の分岐として先に落とす。
  if (!/^https?:\/\//.test(href)) return null;

  const url = new URL(href);
  // 日本のアソシエイト ID は他国の Amazon では無効なので、co.jp 以外は対象にしない。
  // ここを絞りすぎて取りこぼしても、verify-build の「tag がある」検査が落ちて気づける。
  if (url.hostname !== 'www.amazon.co.jp' && url.hostname !== 'amazon.co.jp') return null;

  // 商品ページの現行形式と、旧サイト由来で出うる /gp/product/ の 2 つだけを見る。
  // 書籍は ISBN-10 由来で数字始まり・末尾 X もあるため、B 始まりには縛らない。
  // 取れなくても asin: null として tag は付くので、収益は落とさない。
  const asin = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$)/)?.[1];
  return { asin: asin ?? null };
}

/** 商品ページ以外の Amazon URL に、トラッキング ID だけを揃えて付ける。 */
function withTag(href) {
  const url = new URL(href);
  url.searchParams.set('tag', TAG);
  return url.toString();
}

/** 商品名カードの中身。リンクのテキストを丸ごとこれに差し替える。 */
function cardChildren(name) {
  const span = (className, value) => ({
    type: 'element',
    tagName: 'span',
    properties: { className: [className] },
    children: [{ type: 'text', value }],
  });
  return [span('amazon-card-name', name), span('amazon-card-cta', 'Amazon で見る')];
}

const anchor = (properties, children) => ({ type: 'element', tagName: 'a', properties, children });

/** @type {import('satteri').HastPluginDefinition} */
export default {
  name: 'amazon-links',
  element: {
    // タグの絞り込みは Rust 側で行われるので、JS には <a> しか渡ってこない。
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      const parsed = parseAmazonLink(href);
      if (!parsed) return;

      // アフィリエイトリンクである表明。Amazon 側で開くので noopener も付ける。
      const properties = {
        ...node.properties,
        rel: ['sponsored', 'nofollow', 'noopener'],
        target: '_blank',
      };

      if (!parsed.asin) {
        return anchor({ ...properties, href: withTag(href) }, node.children);
      }

      properties.href = `https://www.amazon.co.jp/dp/${parsed.asin}?tag=${TAG}`;

      const name = products[parsed.asin];
      if (!name) {
        // 名前がなければ素のリンクのまま。ASIN だけのカードは作らない。
        ctx.report({
          message: `Amazon 商品名が未登録: ${parsed.asin} — src/data/amazon-products.json に追記するとカード表示になります`,
          node,
          severity: 'warning',
        });
        return anchor(properties, node.children);
      }

      return anchor({ ...properties, className: ['amazon-card'] }, cardChildren(name));
    },
  },
};
