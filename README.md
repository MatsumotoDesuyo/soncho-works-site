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
| `npm run import` | 旧 WordPress から記事・画像を取り込み直す |
| `npx wrangler dev` | `dist/` を Cloudflare の挙動 (リダイレクト・404) つきで配信する |

`_redirects` と 404 の実挙動は `npm run verify` では見られないので、`npx wrangler dev` で確認する。

## 構成

```
scripts/import-wp.mjs    旧 WordPress から取り込む (何度でも再実行できる)
scripts/slug-map.json    日本語 slug -> ASCII slug の対応表。人が確認する成果物
scripts/verify-build.mjs dist/ の検証
src/site.config.ts       サイト名・URL・AdSense・Google タグ・privacy URL
src/content/posts/       記事 57 件 (import-wp.mjs が生成)
src/content/pages/       固定ページ 4 件 (同上)
src/data/categories.json カテゴリー slug と日本語名 (同上)
public/wp-content/uploads/ 旧サイトの画像。URL のパスを維持している
public/_redirects        旧 permalink からの 301 (同上)
```

`src/content/`、`src/data/categories.json`、`public/wp-content/uploads/`、`public/_redirects` は
`npm run import` の生成物なので直接編集しない。URL を変えたいときは `scripts/slug-map.json` を直して
取り込み直す。

## 移行で踏んだ落とし穴

作業中に判明した、直すと壊れる箇所。

- **`astro` はバージョンを固定している (7.2.10)。** 7.3.0 は `astro/_internal/logger` を
  exports に含めておらず、ビルドが落ちる。上げるときはビルドを通してから。
- **`_redirects` のパスは大文字のパーセントエンコードで書く。** 照合は大文字小文字を区別し、
  WordPress の permalink は小文字 (`%e3%83%ab`)、ブラウザが送るのは大文字 (`%E3%83%AB`) なので、
  そのまま書くと日本語 slug の記事 43 件が 1 件も当たらない。素の UTF-8 で書くのも不可
  (全角スペースが区切りと解釈されて行ごと無効になる)。`npm run verify` が検査している。
- **一覧 API は本文込みだと 500 を返す。** `posts?per_page=N&page=M` に `content` を含めると
  特定の記事を含むページで落ちるので、一覧では id だけを取り本文は 1 件ずつ取得している。
  移行元は 1GB メモリの古い VPS なので、画像も並列で取らず 200ms 間隔で 1 件ずつ落とす。
- **画像は `srcset` のサイズ違いも配置する。** turndown が `srcset` を落とすので生成物の HTML には
  出てこないが、D3 の「外部からの直リンクも切れない」は**旧サイトが公開していた URL 空間**が基準。
  `src` だけを見ると 221 件のサイズ違いが抜ける。`npm run import` は本文が参照する画像が
  1 枚でも取得できなければ**失敗する**。`dist/` を見る `npm run verify` では検出できないため。
- **Search Console の検証ファイルは 200 リライトで返している。** Workers Static Assets は既定で
  `*.html` を拡張子なしの URL へ 307 で飛ばすため、そのままだと確認 URL が 200 を返さない。
