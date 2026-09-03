// dist/ を Issue #1 の受け入れ条件に照らして検証する。
// wrangler を起動しなくても通る範囲 (生成物の中身と静的な整合性) をここで見る。
// _redirects と 404 の実際の挙動は `npx wrangler dev` で別に確認する。
//
//   npm run build && npm run verify

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/site.config.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const CF_MAX_FILES = 20_000;
const CF_MAX_FILE_BYTES = 25 * 1024 * 1024;

const results = [];
const check = (ok, label, detail = '') => results.push({ ok, label, detail });

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

/** dist の中で、ある URL パスが配信されるか。 */
function servedBy(files, urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const candidates = clean.endsWith('/')
    ? [`${clean}index.html`]
    : [clean, `${clean}/index.html`, `${clean}.html`];
  return candidates.some((c) => files.has(c.replace(/^\//, '')));
}

const main = async () => {
  const absFiles = await walk(DIST);
  const files = new Set(absFiles.map((f) => relative(DIST, f).split('\\').join('/')));
  const html = absFiles.filter((f) => f.endsWith('.html'));

  // --- 1. 組織の公開物が同じ URL で出ていること
  for (const path of ['ads.txt', 'privacy/index.html', 'google07299d5f1a873207.html']) {
    check(files.has(path), `組織の公開物が dist にある: /${path}`);
  }
  const adsTxt = await readFile(join(DIST, 'ads.txt'), 'utf8').catch(() => '');
  const adsSrc = await readFile(join(ROOT, 'public', 'ads.txt'), 'utf8').catch(() => 'x');
  check(adsTxt === adsSrc, 'ads.txt が public/ の内容と一致 (改変していない)');

  // --- 2. sitemap と RSS
  check(files.has('sitemap-index.xml'), '/sitemap-index.xml がある');
  check(files.has('rss.xml'), '/rss.xml がある');
  const rss = await readFile(join(DIST, 'rss.xml'), 'utf8').catch(() => '');
  const rssItems = (rss.match(/<item>/g) ?? []).length;
  check(rssItems === 57, `RSS に記事 57 件が入っている`, `${rssItems} 件`);
  check(rss.startsWith('<?xml'), 'RSS が XML として妥当な書き出し');

  // --- 3. 404 ページ (not_found_handling: 404-page が返す実体)
  check(files.has('404.html'), '/404.html がある');

  // --- 4. 広告と計測のスニペット
  const home = await readFile(join(DIST, 'index.html'), 'utf8');
  const post = await readFile(join(DIST, 'posts', 'my-ahk', 'index.html'), 'utf8');
  for (const [label, body] of [['トップ', home], ['記事', post]]) {
    check(body.includes(site.adsense.client), `${label}ページに AdSense (${site.adsense.client})`);
    check(body.includes(site.googleTag.id), `${label}ページに Google タグ (${site.googleTag.id})`);
    check(body.includes(site.privacyUrl), `${label}ページにプライバシーポリシーへのリンク`);
  }

  // --- 5. 本文が参照するローカル資産がすべて存在すること (画像のリンク切れ 0)
  const broken = new Map();
  for (const file of html) {
    const body = await readFile(file, 'utf8');
    const refs = [...body.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (ref.startsWith('//')) continue;
      if (servedBy(files, ref)) continue;
      if (!broken.has(ref)) broken.set(ref, []);
      broken.get(ref).push(relative(DIST, file));
    }
  }
  const brokenImages = [...broken.keys()].filter((r) => r.startsWith('/wp-content/uploads/'));
  check(brokenImages.length === 0, '本文の画像にリンク切れがない', brokenImages.join(', '));
  const brokenOther = [...broken.keys()].filter((r) => !r.startsWith('/wp-content/uploads/'));
  check(brokenOther.length === 0, 'その他のサイト内リンクが切れていない', brokenOther.map((r) => `${r} (${broken.get(r)[0]})`).join(', '));

  // --- 6. 旧 permalink のリダイレクト
  const redirects = await readFile(join(DIST, '_redirects'), 'utf8');
  const rules = redirects
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.trim().split(/\s+/));
  const postRules = rules.filter(([from]) => /^\/\d{4}\/\d{2}\/\d{2}\//.test(from));
  check(postRules.length === 57, '旧 permalink 57 件のリダイレクトがある', `${postRules.length} 件`);
  const notRedirect = rules.filter(([, , code]) => code !== '301');
  check(
    notRedirect.length === 1 && notRedirect[0][0] === '/google07299d5f1a873207.html' && notRedirect[0][2] === '200',
    'リダイレクトは 301 のみ (例外は Search Console 検証ファイルの 200 リライトだけ)',
    notRedirect.map((r) => r.join(' ')).join(', '),
  );
  const badTargets = rules.filter(([, to]) => !servedBy(files, to) && !to.endsWith('.xml'));
  check(badTargets.length === 0, 'リダイレクト先がすべて存在する', badTargets.map((r) => r.join(' ')).join(', '));

  // Cloudflare の照合は大文字小文字を区別するので、小文字のパーセントエンコード
  // (WordPress の link がこの形) が残っていると日本語 slug の記事が当たらない。
  const lowercaseEncoded = postRules.filter(([from]) =>
    (from.match(/%[0-9A-Fa-f]{2}/g) ?? []).some((esc) => /[a-f]/.test(esc)),
  );
  check(lowercaseEncoded.length === 0, 'リダイレクト元が大文字のパーセントエンコードである', `${lowercaseEncoded.length} 件が小文字`);
  // 行は空白区切りで解釈されるため、全角スペースなどが素で入っていると行ごと無効になる。
  const rawWhitespace = rules.filter(([from]) => /[\s　]/.test(from));
  check(rawWhitespace.length === 0, 'リダイレクト元に素の空白文字がない', `${rawWhitespace.length} 件`);
  const undecodable = rules.filter(([from]) => {
    try {
      return encodeURI(decodeURIComponent(from)) !== from;
    } catch {
      return true;
    }
  });
  check(undecodable.length === 0, 'リダイレクト元が encodeURI 正規形である', undecodable.map((r) => r[0]).join(', ').slice(0, 200));
  for (const [from, to] of [['/feed/', '/rss.xml'], ['/profile/', '/profiel/']]) {
    check(rules.some((r) => r[0] === from && r[1] === to), `${from} -> ${to} のリダイレクトがある`);
  }

  // --- 7. 旧 URL の frontmatter と _redirects の突き合わせ
  const fromSet = new Set(postRules.map(([from]) => from));
  const posts = await readdir(join(ROOT, 'src', 'content', 'posts'));
  let missingOld = 0;
  for (const name of posts) {
    const md = await readFile(join(ROOT, 'src', 'content', 'posts', name), 'utf8');
    const oldUrl = md.match(/^oldUrl: "([^"]+)"/m)?.[1];
    if (!oldUrl || !fromSet.has(oldUrl)) missingOld++;
  }
  check(missingOld === 0, '全記事の旧 URL が _redirects に載っている', `不足 ${missingOld} 件`);

  // --- 8. Cloudflare Workers Static Assets の上限
  check(absFiles.length <= CF_MAX_FILES, `ファイル数が上限 ${CF_MAX_FILES} 以内`, `${absFiles.length} 件`);
  const sizes = await Promise.all(absFiles.map(async (f) => ({ f, size: (await stat(f)).size })));
  const largest = sizes.reduce((a, b) => (a.size > b.size ? a : b));
  check(
    largest.size <= CF_MAX_FILE_BYTES,
    `最大ファイルが上限 25 MiB 以内`,
    `${relative(DIST, largest.f)} ${(largest.size / 1024 / 1024).toFixed(1)} MiB`,
  );
  const total = sizes.reduce((n, s) => n + s.size, 0);
  console.log(`dist: ${absFiles.length} ファイル / ${(total / 1024 / 1024).toFixed(1)} MiB\n`);

  // --- 出力
  for (const r of results) {
    console.log(`${r.ok ? '  OK  ' : '  NG  '} ${r.label}${r.detail ? `  [${r.detail}]` : ''}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} 件 OK`);
  if (failed.length) process.exit(1);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
