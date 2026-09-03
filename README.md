# soncho-works-site

soncho-works.com (apex) の静的サイト。Astro でビルドし、Cloudflare Workers Static Assets で配信する。
組織資産と app ↔ platform 契約は my-server が同期する複製なので、`DEPLOYMENT.md` / `ORGANIZATION.md` /
`public/ads.txt` / `public/privacy/` / Search Console の検証 HTML はこの repo では編集しない
(変更したい場合は my-server の Issue に `to-org` / `to-platform` ラベルで起票する)。
