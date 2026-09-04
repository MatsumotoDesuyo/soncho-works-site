// WordPress (soncho-works.com) から Astro の content collection へ移行する。
//
// 何度でも再実行できる。実行するたびに src/content/{posts,pages}/*.md、
// public/wp-content/uploads/**、public/_redirects、src/data/categories.json を作り直す。
// slug の対応は scripts/slug-map.json が正で、このスクリプトは既存の newSlug を上書きしない。
//
//   node scripts/import-wp.mjs            通常実行 (画像は未取得のものだけ落とす)
//   node scripts/import-wp.mjs --no-media 画像を取得せず本文だけ作り直す
//
// 注意: 一覧 API (posts?per_page=N&page=M) は本文を含めると 500 を返す記事があるため、
// 一覧では id だけを取り、本文は 1 件ずつ /posts/<id> で取得している。

import { mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WP = 'https://soncho-works.com/wp-json/wp/v2';

// 旧サイトが本文中で使っている自サイトのホスト表記。どちらも同じサイトを指す。
const OLD_HOSTS = [/https?:\/\/160\.251\.77\.216/gi, /https?:\/\/soncho-works\.com/gi];
const AMAZON_TAG = 'soncho00-22';
const UA = 'soncho-works-site-import';

const SLUG_MAP_PATH = join(ROOT, 'scripts', 'slug-map.json');
const EXTERNAL_MAP_PATH = join(ROOT, 'scripts', 'external-images.json');
const REPORT_PATH = join(ROOT, 'scripts', 'import-report.json');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const PAGES_DIR = join(ROOT, 'src', 'content', 'pages');
const UPLOADS_DIR = join(ROOT, 'public', 'wp-content', 'uploads');

/** 他サイトから引き取った画像の置き場。旧サイトの URL 空間 (wp-content) とは分ける。 */
const EXTERNAL_DIR = join(ROOT, 'public', 'images', 'external');
const EXTERNAL_URL_BASE = '/images/external/';

const skipMedia = process.argv.includes('--no-media');

// ---------------------------------------------------------------- 取得

async function getJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (res.ok) return res.json();
    if (i === tries) throw new Error(`GET ${url} -> ${res.status}`);
    await new Promise((r) => setTimeout(r, 500 * i));
  }
}

// ページ数は X-WP-TotalPages で決める。1 ページの件数が per_page に満たないことが
// あるので (WordPress 側が一部の行を落とす)、件数で打ち切ってはいけない。
async function getPaged(path, fields) {
  const out = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page++) {
    const url = `${WP}/${path}?per_page=50&page=${page}&orderby=id&order=asc&_fields=${fields}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    if (page === 1) totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1);
    out.push(...(await res.json()));
  }
  return out;
}

async function fetchPosts() {
  const index = await getJson(`${WP}/posts?per_page=100&_fields=id`);
  const fields = 'id,slug,link,date,modified,title,excerpt,content,categories,tags,featured_media';
  const posts = [];
  for (const { id } of index) {
    posts.push(await getJson(`${WP}/posts/${id}?_fields=${fields}`));
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------- URL

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** 旧サイトの絶対 URL を、自サイト内なら絶対パスに落とす。 */
function stripHost(html) {
  return OLD_HOSTS.reduce((acc, re) => acc.replace(re, ''), html);
}

/**
 * WordPress が本文に残す HTML 実体参照のうち、URL の中で邪魔になるものだけ戻す。
 * 旧エディタが href の末尾に紛れ込ませた "(新しいタブで開く)" もここで落とす。
 */
const unescapeUrl = (u) =>
  u
    .replace(/&#0?38;|&amp;/g, '&')
    .replace(/&#8217;|&#8221;/g, '')
    .replace(/\(新しいタブで開く\)$/, '');

// ---------------------------------------------------------------- 本文の前処理
//
// turndown に渡す前に、Markdown へ落とすと壊れる WordPress 固有のブロックを
// 意味の変わらない素の HTML に置き換えておく。

/**
 * srcset が指すサイズ違いの画像を配信対象に加える。
 *
 * turndown は img を Markdown 画像にするので srcset は生成物から消えるが、D3 の
 * 「外部からの直リンクも切れない」は旧サイトが公開していた URL 空間が基準なので、
 * 参照されていたサイズ違いも同じパスで置く必要がある。
 * stripHost 済みの HTML に対して呼ぶこと (自サイトの URL だけが相対パスになっている)。
 */
function collectSrcsetPaths(html, report) {
  for (const attr of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of attr[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/wp-content/uploads/')) report.uploadPaths.add(decode(url));
    }
  }
}

/**
 * 他サイトの画像のホットリンクをやめる。scripts/external-images.json の指示に従い、
 * action: host なら自サイトに取り込んだファイルを指し、action: remove なら参照ごと落とす。
 * 表に無い URL は勝手に判断せずそのまま残し、報告に出す (人が表に足す)。
 * stripHost 済みの HTML に対して呼ぶこと (自サイトの画像は相対パスなので対象外になる)。
 */
function rehostExternalImages(html, externalMap, report, slug) {
  let out = html.replace(/<img[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*>/g, (tag, rawUrl) => {
    const url = unescapeUrl(rawUrl);
    const entry = externalMap[url];
    if (!entry) {
      report.unknownExternalImages.push({ slug, url });
      return tag;
    }
    if (entry.action === 'remove') {
      report.removedExternalImages.push({ slug, url, reason: entry.reason });
      return '';
    }
    report.hostedExternalImages.push({ slug, url, file: entry.file });
    return tag.replace(rawUrl, `${EXTERNAL_URL_BASE}${entry.file}`);
  });

  // 画像を落とした結果、中身が空になった入れ物を片づける。
  // figure > a > img の入れ子があるので数回まわす。
  for (let i = 0; i < 3; i++) {
    out = out
      .replace(/<a[^>]*>\s*<\/a>/g, '')
      .replace(/<figure[^>]*>\s*<\/figure>/g, '')
      .replace(/<p>\s*<\/p>/g, '');
  }
  return out;
}

/** Easy Table of Contents がレンダリング時に差し込む目次。Astro 側で作り直すので捨てる。 */
function stripEzToc(html) {
  return html
    .replace(/<div id="ez-toc-container"[\s\S]*?<\/nav><\/div>/g, '')
    .replace(/<span class="ez-toc-section(?:-end)?"[^>]*><\/span>/g, '');
}

/** WordPress の oEmbed (自サイト・他サイトの記事カード)。iframe は死んでいるのでリンクにする。 */
function embedsToLinks(html, ctx) {
  return html.replace(
    /<figure class="wp-block-embed[^"]*"[^>]*>[\s\S]*?<\/figure>/g,
    (figure) => {
      const caption = figure.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? '';
      // YouTube などの動画埋め込みは iframe が生きているのでそのまま残す。
      const iframe = figure.match(/<iframe[\s\S]*?<\/iframe>/)?.[0];
      if (iframe && !/\/embed\/#\?secret=/.test(iframe)) {
        return `<p>${iframe}</p>` + (caption ? `<p>${caption}</p>` : '');
      }
      // wp-embed: blockquote の中に正規の URL とタイトルの anchor がある。
      const anchor = figure.match(/<blockquote[^>]*>\s*(<a [\s\S]*?<\/a>)/)?.[1];
      if (anchor) return `<p>${anchor}</p>` + (caption ? `<p>${caption}</p>` : '');
      // 素の URL が置いてあるだけの埋め込み。自サイトの記事ならタイトルをリンク文言にする。
      const bare = figure.match(/<div class="wp-block-embed__wrapper">\s*([^<\s]+)\s*<\/div>/)?.[1];
      if (bare) {
        const title = ctx.pathToTitle.get(decode(bare).replace(/\/?$/, '/')) ?? bare;
        return `<p><a href="${bare}">${title}</a></p>` + (caption ? `<p>${caption}</p>` : '');
      }
      return caption ? `<p>${caption}</p>` : '';
    },
  );
}

/**
 * Amazon アソシエイトの商品ウィジェット iframe。
 * 埋め込み先 rcm-fe.amazon-adsystem.com は 2026-09 時点で名前解決すらできず、
 * 空の枠が残るだけなので、ASIN から通常の商品リンクに置き換える。
 */
function amazonIframesToLinks(html, report) {
  return html.replace(/<iframe[^>]*amazon-adsystem[^>]*><\/iframe>/g, (iframe) => {
    const src = unescapeUrl(iframe.match(/src="([^"]+)"/)?.[1] ?? '');
    const asin = new URLSearchParams(src.split('?')[1] ?? '').get('asins');
    const tag = new URLSearchParams(src.split('?')[1] ?? '').get('t') ?? AMAZON_TAG;
    if (!asin) {
      report.amazonWithoutAsin.push(src);
      return '';
    }
    report.amazonConverted.push(asin);
    return `<p><a href="https://www.amazon.co.jp/dp/${asin}?tag=${tag}">Amazon で見る (${asin})</a></p>`;
  });
}

/** Shortcodes Ultimate のアコーディオン。中身は本文なので details/summary に移す。 */
function accordionsToDetails(html) {
  if (!html.includes('[su_spoiler')) return html;
  return html
    .replace(/\[\/?su_accordion\]/g, '')
    .replace(
      /\[su_spoiler title=(?:&#8221;|"|&#8220;)([\s\S]*?)(?:&#8221;|"|&#8220;)[^\]]*\]([\s\S]*?)\[\/su_spoiler\]/g,
      (_m, title, body) => `<details><summary>${title.trim()}</summary>${body.trim()}</details>`,
    );
}

/** ギャラリー。リスト構造のままだと Markdown が箇条書きになるので画像の並びに開く。 */
function galleriesToImages(html) {
  return html.replace(/<figure class="wp-block-gallery[^"]*"[\s\S]*?<\/figure>\s*(?=<[^/]|$)/g, (fig) => {
    const imgs = [...fig.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/g)].map(
      (m) => `<p><img src="${m[1]}" alt=""></p>`,
    );
    return imgs.join('');
  });
}

/** ファイルブロック。同じ URL の anchor が 2 本並ぶので、名前側の 1 本だけ残す。 */
function fileBlocksToLinks(html) {
  return html.replace(/<div class="wp-block-file">([\s\S]*?)<\/div>/g, (_m, inner) => {
    const first = inner.match(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    return first ? `<p><a href="${first[1]}">${first[2]}</a></p>` : '';
  });
}

/** 残ってしまった未展開のショートコード。中身を復元できないので落とし、報告に残す。 */
function dropDeadShortcodes(html, report, slug) {
  return html.replace(/\[(metaslider|su_[a-z_]+)[^\]]*\]/g, (m) => {
    report.droppedShortcodes.push({ slug, shortcode: m.slice(0, 60) });
    return '';
  });
}

// ---------------------------------------------------------------- URL の張り替え

/** 旧 permalink とアップロードのパスを、新しいサイトの URL に直す。 */
function rewriteLinks(html, ctx, report, slug) {
  const { postPathToNew, idToNew, categoryPathToNew } = ctx;

  return html.replace(/(href|src)="([^"]+)"/g, (_whole, attr, rawUrl) => {
    const url = unescapeUrl(rawUrl);
    if (!url.startsWith('/')) return `${attr}="${url}"`; // 外部 URL はそのまま

    // 記事内アンカー付きのリンク (旧目次が使っていた形) も拾えるよう、
    // クエリとフラグメントを外してからパスを引く。
    const [beforeHash, ...hashRest] = url.split('#');
    const fragment = hashRest.length ? `#${hashRest.join('#')}` : '';
    const [pathPart, query] = beforeHash.split('?');
    const suffix = `${query ? `?${query}` : ''}${fragment}`;
    const path = decode(pathPart);

    if (path.startsWith('/wp-content/uploads/')) {
      report.uploadPaths.add(path);
      return `${attr}="${path}${suffix}"`;
    }
    if (!pathPart && query) {
      const id = new URLSearchParams(query).get('p');
      const to = id && idToNew.get(Number(id));
      if (to) return `${attr}="${to}${fragment}"`;
    }
    const post = postPathToNew.get(path.replace(/\/?$/, '/'));
    if (post) return `${attr}="${post}${fragment}"`;

    const category = categoryPathToNew.get(path.replace(/\/?$/, '/'));
    if (category) return `${attr}="${category}${fragment}"`;

    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) {
      report.unresolvedInternalLinks.push({ slug, path });
    }
    return `${attr}="${path}${suffix}"`;
  });
}

// ---------------------------------------------------------------- Markdown 化

function makeTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });
  // 表と iframe (YouTube)、details は Markdown に等価な書き方がないので HTML のまま残す。
  td.keep(['table', 'iframe', 'details', 'summary']);
  td.remove(['script', 'style']);
  return td;
}

// ---------------------------------------------------------------- frontmatter

/** YAML のスカラーは JSON のスカラーの上位互換なので、JSON.stringify で安全に引用できる。 */
const yamlValue = (v) => (Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : JSON.stringify(v));

function frontmatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${yamlValue(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** 実体参照を戻す。&amp; を最後に戻さないと二重デコードになる。 */
const decodeEntities = (s) =>
  s
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** タイトル・抜粋を素のテキストにする (frontmatter と meta description 用)。 */
const stripTags = (html) =>
  decodeEntities(html.replace(/<[^>]*>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------- 画像

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 移行元は 1GB メモリの古い VPS で同時アクセスに弱い (platform の実地調査)。
 * 並列で叩かず、1 件ずつ間隔を空けて取る。取得済みのものは待たずに飛ばす。
 */
const FETCH_INTERVAL_MS = 200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 他サイトから引き取る画像。相手のサーバーなので同じく 1 件ずつ間隔を空ける。 */
async function downloadExternalImages(externalMap, report) {
  let downloaded = 0;
  let cached = 0;
  for (const [url, entry] of Object.entries(externalMap)) {
    if (entry.action !== 'host') continue;
    const dest = join(EXTERNAL_DIR, entry.file);
    if (await exists(dest)) {
      cached++;
      continue;
    }
    const res = await fetch(url, { headers: { 'user-agent': UA } }).catch((e) => ({
      ok: false,
      status: e.code ?? 'ERR',
    }));
    if (res.ok) {
      await mkdir(EXTERNAL_DIR, { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      downloaded++;
    } else {
      report.missingExternalImages.push({ url, file: entry.file, status: res.status });
    }
    await sleep(FETCH_INTERVAL_MS);
  }
  return { downloaded, cached };
}

async function downloadUploads(paths, report) {
  let downloaded = 0;
  let cached = 0;
  for (const path of paths) {
    const dest = join(UPLOADS_DIR, path.replace('/wp-content/uploads/', ''));
    if (await exists(dest)) {
      cached++;
      continue;
    }
    const res = await fetch(`https://soncho-works.com${encodeURI(path)}`).catch((e) => ({
      ok: false,
      status: e.code ?? 'ERR',
    }));
    if (res.ok) {
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      downloaded++;
    } else {
      report.missingUploads.push({ path, status: res.status });
    }
    await sleep(FETCH_INTERVAL_MS);
  }
  return { downloaded, cached };
}

// ---------------------------------------------------------------- 本体

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    uploadPaths: new Set(),
    missingUploads: [],
    droppedShortcodes: [],
    amazonConverted: [],
    amazonWithoutAsin: [],
    unresolvedInternalLinks: [],
    slugMapAdditions: [],
    hostedExternalImages: [],
    removedExternalImages: [],
    unknownExternalImages: [],
    missingExternalImages: [],
  };

  console.log('WordPress から取得中...');
  const [posts, pages, categories, tags, media] = await Promise.all([
    fetchPosts(),
    getJson(`${WP}/pages?per_page=100&_fields=id,slug,link,date,modified,title,excerpt,content`),
    getPaged('categories', 'id,slug,name,count'),
    getPaged('tags', 'id,slug,name,count'),
    getPaged('media', 'id,source_url,mime_type'),
  ]);
  console.log(`  posts ${posts.length} / pages ${pages.length} / categories ${categories.length} / tags ${tags.length} / media ${media.length}`);

  // --- slug 対応表。人が編集した newSlug が正なので、足りない分だけ足す。
  const externalMap = JSON.parse(await readFile(EXTERNAL_MAP_PATH, 'utf8')).images;
  const slugMap = JSON.parse(await readFile(SLUG_MAP_PATH, 'utf8'));
  const fallbackSlug = (wp) => `post-${wp.id}`;
  for (const post of posts) {
    if (slugMap.posts[post.id]) continue;
    slugMap.posts[post.id] = {
      date: post.date.slice(0, 10),
      title: stripTags(post.title.rendered),
      oldSlug: decode(post.slug),
      newSlug: fallbackSlug(post),
      status: 'generated',
    };
    report.slugMapAdditions.push(post.id);
  }
  for (const cat of categories.filter((c) => c.count > 0)) {
    if (slugMap.categories[cat.id]) continue;
    slugMap.categories[cat.id] = {
      name: cat.name,
      oldSlug: decode(cat.slug),
      newSlug: /^[a-z0-9-]+$/.test(cat.slug) ? cat.slug : `category-${cat.id}`,
      status: 'generated',
    };
    report.slugMapAdditions.push(`category-${cat.id}`);
  }
  if (report.slugMapAdditions.length) {
    await writeFile(SLUG_MAP_PATH, JSON.stringify(slugMap, null, 2) + '\n');
    console.log(`  ⚠ slug-map.json に ${report.slugMapAdditions.length} 件を自動追加した。目視で直すこと: ${report.slugMapAdditions.join(', ')}`);
  }

  const newSlugOf = (id) => slugMap.posts[id]?.newSlug;
  const catSlugOf = (id) => slugMap.categories[id]?.newSlug;

  // --- 旧 URL → 新 URL の索引
  const postPathToNew = new Map();
  const idToNew = new Map();
  const pathToTitle = new Map();
  for (const post of posts) {
    const oldPath = decode(new URL(post.link).pathname);
    const to = `/posts/${newSlugOf(post.id)}/`;
    postPathToNew.set(oldPath, to);
    idToNew.set(post.id, to);
    pathToTitle.set(oldPath, stripTags(post.title.rendered));
  }
  const categoryPathToNew = new Map(
    categories
      .filter((c) => c.count > 0)
      .map((c) => [`/category/${decode(c.slug)}/`, `/category/${catSlugOf(c.id)}/`]),
  );
  const ctx = { postPathToNew, idToNew, categoryPathToNew, pathToTitle };

  // --- 本文を Markdown に
  const td = makeTurndown();
  const mediaById = new Map(media.map((m) => [m.id, m]));
  const tagNameById = new Map(tags.map((t) => [t.id, t.name]));

  const toMarkdown = (html, slug) => {
    let out = stripHost(html);
    collectSrcsetPaths(out, report); // turndown が落とす前に拾う
    out = rehostExternalImages(out, externalMap, report, slug);
    out = stripEzToc(out);
    out = accordionsToDetails(out);
    out = amazonIframesToLinks(out, report);
    out = embedsToLinks(out, ctx);
    out = galleriesToImages(out);
    out = fileBlocksToLinks(out);
    out = dropDeadShortcodes(out, report, slug);
    out = rewriteLinks(out, ctx, report, slug);
    return td.turndown(out).replace(/\n{3,}/g, '\n\n').trim();
  };

  await rm(POSTS_DIR, { recursive: true, force: true });
  await rm(PAGES_DIR, { recursive: true, force: true });
  await mkdir(POSTS_DIR, { recursive: true });
  await mkdir(PAGES_DIR, { recursive: true });

  for (const post of posts) {
    const slug = newSlugOf(post.id);
    const hero = mediaById.get(post.featured_media)?.source_url;
    const heroPath = hero ? decode(new URL(hero).pathname) : undefined;
    if (heroPath) report.uploadPaths.add(heroPath);

    const body = toMarkdown(post.content.rendered, slug);
    const fm = frontmatter({
      title: stripTags(post.title.rendered),
      description: stripTags(post.excerpt.rendered).slice(0, 200),
      pubDate: `${post.date}+09:00`,
      updatedDate: post.modified !== post.date ? `${post.modified}+09:00` : undefined,
      categories: post.categories.map(catSlugOf).filter(Boolean),
      tags: post.tags.map((t) => tagNameById.get(t)).filter(Boolean),
      heroImage: heroPath,
      wpId: post.id,
      // _redirects と同じ正規形 (大文字のパーセントエンコード) で持つ。
      oldUrl: encodeURI(decode(new URL(post.link).pathname)),
    });
    await writeFile(join(POSTS_DIR, `${slug}.md`), `${fm}\n${body}\n`);
  }

  for (const page of pages) {
    const body = toMarkdown(page.content.rendered, page.slug);
    const fm = frontmatter({
      title: stripTags(page.title.rendered),
      description: stripTags(page.excerpt.rendered).slice(0, 200),
      pubDate: `${page.date}+09:00`,
      updatedDate: page.modified !== page.date ? `${page.modified}+09:00` : undefined,
      wpId: page.id,
      oldUrl: encodeURI(decode(new URL(page.link).pathname)),
    });
    await writeFile(join(PAGES_DIR, `${page.slug}.md`), `${fm}\n${body}\n`);
  }
  console.log(`  記事 ${posts.length} 件、固定ページ ${pages.length} 件を書き出した`);

  // --- カテゴリの名前引き (テーマ側で slug から日本語名を出すのに使う)
  const categoryData = categories
    .filter((c) => c.count > 0)
    .map((c) => ({ slug: catSlugOf(c.id), name: c.name, count: c.count }))
    .sort((a, b) => b.count - a.count);
  await mkdir(join(ROOT, 'src', 'data'), { recursive: true });
  await writeFile(join(ROOT, 'src', 'data', 'categories.json'), JSON.stringify(categoryData, null, 2) + '\n');

  // --- 画像。本文が参照するものに加えて、原本 (media) も全部置く。
  //     D3 の「外部からの直リンクも切れない」を満たすため。
  for (const m of media) report.uploadPaths.add(decode(new URL(m.source_url).pathname));
  const uploadPaths = [...report.uploadPaths].sort();
  if (skipMedia) {
    console.log(`  --no-media: 画像 ${uploadPaths.length} 件の取得をとばした`);
  } else {
    console.log(`  画像 ${uploadPaths.length} 件を確認中...`);
    const { downloaded, cached } = await downloadUploads(uploadPaths, report);
    console.log(`  取得 ${downloaded} 件 / 既存 ${cached} 件 / 取得できず ${report.missingUploads.length} 件`);

    const host = Object.values(externalMap).filter((e) => e.action === 'host').length;
    console.log(`  他サイトから引き取る画像 ${host} 件を確認中...`);
    const ext = await downloadExternalImages(externalMap, report);
    console.log(`  取得 ${ext.downloaded} 件 / 既存 ${ext.cached} 件 / 取得できず ${report.missingExternalImages.length} 件`);
  }

  // --- リダイレクト
  // _redirects の照合は大文字小文字を区別する。WordPress の link は小文字の
  // パーセントエンコード (%e3%83%ab) だが、ブラウザが送るのは大文字 (%E3%83%AB) なので
  // そのまま書くと日本語 slug の記事が 1 件も当たらない。encodeURI で必ず大文字に揃える。
  // 素の UTF-8 のまま書くのも避ける: 全角スペース (U+3000) が区切りと解釈されて行が壊れる。
  const rule = (from, to) => `${encodeURI(decode(from))}  ${to}  301`;

  const lines = [
    '# 旧 WordPress の URL を引き継ぐ。scripts/import-wp.mjs が生成するので直接編集しない。',
    '',
    `# 記事 ${posts.length} 件: /YYYY/MM/DD/<旧 slug>/ -> /posts/<新 slug>/`,
    ...posts.map((p) => rule(new URL(p.link).pathname, idToNew.get(p.id))),
    '',
    '# カテゴリーアーカイブ (日本語 slug のものだけ URL が変わる)',
    ...[...categoryPathToNew.entries()]
      .filter(([from, to]) => from !== to)
      .map(([from, to]) => rule(from, to)),
    '',
    '# フィードとサイトマップ、旧サイトの綴り違い',
    '/feed/  /rss.xml  301',
    '/sitemap.xml  /sitemap-index.xml  301',
    '/profile/  /profiel/  301',
    '',
    '# Search Console の所有権確認ファイル。Workers Static Assets は既定で',
    '# *.html を拡張子なしの URL へ 307 で飛ばすため、そのままだと確認 URL が',
    '# 200 を返さない。200 のリライトで、その URL のまま中身を返す。',
    '/google07299d5f1a873207.html  /google07299d5f1a873207  200',
    '',
  ];
  await writeFile(join(ROOT, 'public', '_redirects'), lines.join('\n'));
  console.log(`  _redirects を生成した`);

  // --- 報告
  const serialisable = { ...report, uploadPaths: uploadPaths.length };
  await writeFile(REPORT_PATH, JSON.stringify(serialisable, null, 2) + '\n');
  console.log('\n--- 要確認 ---');
  console.log(`取得できなかった画像: ${report.missingUploads.length} 件`);
  for (const m of report.missingUploads) console.log(`  ${m.status} ${m.path}`);
  console.log(`落としたショートコード: ${report.droppedShortcodes.length} 件`);
  for (const s of report.droppedShortcodes) console.log(`  ${s.slug}: ${s.shortcode}`);
  console.log(`Amazon リンクに変換: ${report.amazonConverted.length} 件 (ASIN 不明 ${report.amazonWithoutAsin.length} 件)`);
  console.log(`他サイトの画像: 自サイトに配置 ${report.hostedExternalImages.length} 件 / 本文から削除 ${report.removedExternalImages.length} 件`);
  if (report.unknownExternalImages.length) {
    console.log(`  ⚠ 対応表に無い外部画像 ${report.unknownExternalImages.length} 件 (そのまま残した)。external-images.json に追記すること:`);
    for (const u of report.unknownExternalImages) console.log(`    ${u.slug}: ${u.url}`);
  }
  console.log(`解決できなかった内部リンク: ${report.unresolvedInternalLinks.length} 件`);
  for (const l of report.unresolvedInternalLinks) console.log(`  ${l.slug}: ${l.path}`);
  console.log(`\n詳細は ${REPORT_PATH}`);

  // 本文が参照している画像が 1 枚でも欠けたら失敗させる。生成物 (dist) の HTML だけを
  // 見ていると srcset のサイズ違いは検出できないので、関門はここに置く。
  if (report.missingUploads.length > 0) {
    console.error(`\n本文が参照する画像 ${report.missingUploads.length} 件を取得できなかった。`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
