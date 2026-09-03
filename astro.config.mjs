import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { site } from './src/site.config.ts';

export default defineConfig({
  site: site.url,
  // 旧 WordPress の URL は末尾スラッシュ付きだったので揃える。
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    // 本文には旧サイト由来の生 HTML (表・YouTube・details) が混ざる。
    shikiConfig: { theme: 'github-light', wrap: true },
  },
});
