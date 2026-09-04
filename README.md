# soncho-works-site

soncho-works.com (apex) の静的サイト。Astro でビルドし、Cloudflare Workers Static Assets で配信する。
組織資産と app ↔ platform 契約は my-server が同期する複製なので、`DEPLOYMENT.md` / `ORGANIZATION.md` /
`public/ads.txt` / `public/privacy/` / Search Console の検証 HTML はこの repo では編集しない
(変更したい場合は my-server の Issue に `to-org` / `to-platform` ラベルで起票する)。

## コマンド

| | |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | `dist/` を作る |
| `npm run verify` | `dist/` を受け入れ条件に照らして検証する |
| `npx wrangler dev` | `dist/` を Cloudflare の挙動 (リダイレクト・404) つきで配信する |

`_redirects` と 404 の実挙動は `npm run verify` では見られないので、`npx wrangler dev` で確認する。
Cloudflare へのデプロイは platform (my-server) の担当で、`main` への merge が本番デプロイになる。

## 構成

```
src/content/posts/           記事
src/content/pages/           固定ページ (/works/ /my-mission/ /profiel/ /for-olc/)
src/data/categories.json     カテゴリー slug と日本語名
src/site.config.ts           サイト名・URL・AdSense・Google タグ・privacy URL
public/wp-content/uploads/   旧 WordPress の画像。URL のパスを維持している
public/images/external/      他サイトから引き取った画像
public/_redirects            旧 permalink からの 301
scripts/verify-build.mjs     dist/ の検証
scripts/external-images.json 引き取った画像の出典の記録
```

記事を足すときは `src/content/posts/` に Markdown を置く。frontmatter は `src/content.config.ts` の
スキーマに従う。`oldUrl` は WordPress から移してきた記事だけが持つもので、新しい記事には要らない。

他サイトの画像はホットリンクしない。自分で用意するか、`public/images/external/` に置いて
`scripts/external-images.json` に出典を記録する。

## 気をつけること

WordPress からの移行 (#1) で踏んだ落とし穴のうち、いま触ると壊れるもの。

- **`astro` はバージョンを固定している (7.2.10)。** 7.3.0 は `astro/_internal/logger` を
  exports に含めておらず、ビルドが落ちる。上げるときはビルドを通してから。
- **`public/_redirects` のパスは大文字のパーセントエンコードで書く。** 照合は大文字小文字を
  区別するので、小文字 (`%e3%83%ab`) で書くと日本語 slug の旧 URL 43 件が当たらない。
  素の UTF-8 で書くのも不可 (全角スペースが区切りと解釈されて行ごと無効になる)。
  `npm run verify` が検査している。
- **旧 permalink 57 件を減らさない。** 過去の事実なので増減しない値として `verify` が見張っている。
  減らすと旧 URL の被リンクと検索順位を落とす。
- **Search Console の検証ファイルは 200 リライトで返している。** Workers Static Assets は既定で
  `*.html` を拡張子なしの URL へ 307 で飛ばすため、そのままだと確認 URL が 200 を返さない。
- **`public/wp-content/uploads/` は旧サイトの URL 空間の再現。** サイズ違い (`-1024x683.png` など)
  も含めて置いてあるのは、外部からの直リンクを切らないため。新しい画像はここに混ぜない。

移行に使ったツール (`scripts/import-wp.mjs`、`scripts/slug-map.json`) は撤収した。
移行元の WordPress は切替とともに消えており、再実行はできない。
