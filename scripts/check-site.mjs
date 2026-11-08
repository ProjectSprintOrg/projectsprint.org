#!/usr/bin/env node
// サイトの運用ルールが守られているかを機械的に確認する。
//
// 使い方: npm run docs:check   （本番と同じ base でビルドしてからこのスクリプトを実行する）
// PR の CI（.github/workflows/check.yml）と、git push 前のフック（.claude/settings.json）から呼ばれる。
//
// ここで確認する規則は CLAUDE.md の「守ること」に対応している。規則を足したら両方を更新すること。

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { contentUpdatedAt } from '../docs/.vitepress/content-date.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs')
const DIST = path.join(DOCS, '.vitepress/dist')
const SITE = 'https://www.projectsprint.org'

const failures = []
const fail = (rule, detail) => failures.push(`[${rule}] ${detail}`)
const read = (f) => fs.readFileSync(f, 'utf8')
const walk = (dir, ext) => {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.vitepress') continue
      out.push(...walk(p, ext))
    } else if (p.endsWith(ext)) out.push(p)
  }
  return out
}
const frontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/)
  return m ? m[1] : ''
}
const fmValue = (fm, key) => {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"(.*)"$/, '$1') : undefined
}

// ---------------------------------------------------------------------------
// 1. Markdown ソースの規則
// ---------------------------------------------------------------------------
const allMd = walk(DOCS, '.md').map((f) => path.relative(DOCS, f).replace(/\\/g, '/'))
const currentMd = allMd.filter((f) => !/^(en\/)?archive\//.test(f))

for (const rel of currentMd) {
  const src = read(path.join(DOCS, rel))
  const fm = frontmatter(src)
  const desc = fmValue(fm, 'description')
  // 現行の全ページに、検索結果・OGP・llms.txt に使う説明文を書く
  if (!desc || desc.length < 30) fail('description', `${rel}: frontmatter に 30 字以上の description を書いてください`)
  // 本文に <style> / <script> を書かない（CSS は docs/.vitepress/theme/custom.css へ）
  if (/<(style|script)[\s>]/i.test(src)) fail('markdown', `${rel}: <style> や <script> は Markdown に書かず custom.css / テーマに置いてください`)
  // alt の無い画像を書かない
  if (/!\[\]\(/.test(src)) fail('markdown', `${rel}: 画像に alt を付けてください`)
  // 大文字の <BR> は Vue が解釈できずビルドが壊れる
  if (/<BR\s*\/?>/.test(src)) fail('markdown', `${rel}: <BR> は <br> にしてください`)
}

// 日本語版と英語版の CODE は同じファイル構成にする（片方にだけページがあると言語切り替えと hreflang が崩れる）
const jaCode = currentMd.filter((f) => f.startsWith('code/')).map((f) => f.slice('code/'.length)).filter((f) => f.endsWith('.md'))
const enCode = currentMd.filter((f) => f.startsWith('en/code/')).map((f) => f.slice('en/code/'.length))
for (const f of jaCode) if (!enCode.includes(f)) fail('translation', `docs/en/code/${f} がありません（日本語版にはあります）。英訳を追加するか、追加予定を Issue にしてください`)
for (const f of enCode) if (!jaCode.includes(f)) fail('translation', `docs/code/${f} がありません（英語版にだけあります）`)

// 過去版（アーカイブ）の本文は変更しない。alt などの表示処理は VitePress 側で行う
// （直近のコミットで archive/ 配下の .md が変わっていたら知らせる。意図的な変更なら PR で説明する）
try {
  const changed = execSync('git diff --name-only HEAD~1 HEAD -- docs/archive docs/en/archive', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim().split('\n').filter(Boolean).filter((f) => f.endsWith('.md') && !f.endsWith('/index.md'))
  if (changed.length) console.warn(`注意: 過去版の本文が変更されています（意図した変更なら問題ありません）:\n  ${changed.join('\n  ')}`)
} catch { /* 履歴が無い（shallow clone など）ときは飛ばす */ }

// ---------------------------------------------------------------------------
// 2. 「内容の最終更新」の規則（本文が変わったときだけ動く）を、使い捨ての git リポジトリで確かめる
// ---------------------------------------------------------------------------
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'content-date-'))
  const git = (cmd, env = {}) => execSync(`git ${cmd}`, {
    cwd: tmp, stdio: ['ignore', 'pipe', 'ignore'],
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com', ...env }
  })
  const commitAt = (iso, msg) => git(`commit -q -m "${msg}"`, { GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso })
  git('init -q')
  fs.mkdirSync(path.join(tmp, 'docs/code'), { recursive: true })
  fs.writeFileSync(path.join(tmp, 'docs/code/a.md'), '# 見出し\n\n本文です。\n')
  git('add -A'); commitAt('2026-01-10T00:00:00Z', 'body')
  fs.writeFileSync(path.join(tmp, 'docs/code/a.md'), '---\ntitle: T\ndescription: "説明"\n---\n# 見出し\n\n本文です。\n')
  git('add -A'); commitAt('2026-02-10T00:00:00Z', 'frontmatter only')
  const t1 = contentUpdatedAt(tmp, 'docs/code/a.md')
  if (t1 !== Date.parse('2026-01-10T00:00:00Z')) fail('last-updated', `frontmatter だけの変更で「内容の最終更新」が動いています（${t1 && new Date(t1).toISOString()}）`)
  git('mv docs/code/a.md docs/code/b.md'); commitAt('2026-03-10T00:00:00Z', 'rename')
  const t2 = contentUpdatedAt(tmp, 'docs/code/b.md')
  if (t2 !== Date.parse('2026-01-10T00:00:00Z')) fail('last-updated', `ファイルの改名で「内容の最終更新」が動いています（${t2 && new Date(t2).toISOString()}）`)
  fs.writeFileSync(path.join(tmp, 'docs/code/b.md'), '---\ntitle: T\ndescription: "説明"\n---\n# 見出し\n\n本文を直しました。\n')
  git('add -A'); commitAt('2026-04-10T00:00:00Z', 'body change')
  const t3 = contentUpdatedAt(tmp, 'docs/code/b.md')
  if (t3 !== Date.parse('2026-04-10T00:00:00Z')) fail('last-updated', `本文の変更が「内容の最終更新」に反映されていません（${t3 && new Date(t3).toISOString()}）`)
  fs.rmSync(tmp, { recursive: true, force: true })
}

// ---------------------------------------------------------------------------
// 3. ビルド結果（本番と同じ base=/ でビルドしたもの）の規則
// ---------------------------------------------------------------------------
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  fail('build', 'docs/.vitepress/dist がありません。VITEPRESS_BASE=/ npm run docs:build のあとに実行してください（npm run docs:check でまとめて実行できます）')
} else {
  const htmlFiles = walk(DIST, '.html').map((f) => path.relative(DIST, f).replace(/\\/g, '/'))
  const isStub = (html) => html.includes('http-equiv="refresh"')
  const pages = []   // 実ページ
  const stubs = []   // 旧 URL からの転送ページ
  for (const f of htmlFiles) {
    const html = read(path.join(DIST, f))
    ;(isStub(html) ? stubs : pages).push({ f, html })
  }
  const urlOf = (f) => '/' + f.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '')
  const pageUrls = new Set(pages.map((p) => urlOf(p.f)))
  const attr = (html, re) => { const m = html.match(re); return m ? m[1] : undefined }

  if (!/<base href="\/"|href="\/pjs_logo\.png"/.test(pages[0].html)) fail('build', 'base が / ではありません。VITEPRESS_BASE=/ を付けてビルドしてください')

  for (const { f, html } of pages) {
    const url = urlOf(f)
    if (f === '404.html') {
      if (!/<meta name="robots" content="noindex"/.test(html)) fail('seo', '404.html に noindex がありません')
      continue
    }
    const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/)
    if (canonical !== SITE + url) fail('seo', `${url}: canonical が ${canonical} になっています（期待: ${SITE + url}）`)
    const desc = attr(html, /<meta name="description" content="([^"]*)"/)
    if (!desc || desc.length < 20) fail('seo', `${url}: meta description がありません`)
    if (!/<meta property="og:image" content="https:\/\/www\.projectsprint\.org\//.test(html)) fail('seo', `${url}: og:image が絶対 URL ではありません`)
    if (!/<meta property="og:url" content="/.test(html)) fail('seo', `${url}: og:url がありません`)
    if (!/<script type="application\/ld\+json">/.test(html)) fail('seo', `${url}: JSON-LD がありません`)
    // hreflang は相互に張られていること
    const alts = [...html.matchAll(/<link rel="alternate" hreflang="(ja|en)" href="([^"]+)"/g)]
    for (const [, lang, href] of alts) {
      const target = href.replace(SITE, '')
      if (target === url) continue
      if (!pageUrls.has(target)) { fail('hreflang', `${url}: hreflang=${lang} の先 ${target} がありません`); continue }
      const other = pages.find((p) => urlOf(p.f) === target).html
      if (!other.includes(`hreflang="${lang === 'ja' ? 'en' : 'ja'}" href="${SITE + url}"`)) fail('hreflang', `${target} から ${url} への hreflang が返っていません`)
    }
    // 現行文書と過去版のページは、左サイドバーに自分の項目があること（メニューに載せ忘れていないか）
    const aside = (html.match(/<aside class="VPSidebar[\s\S]*?<\/aside>/) || [''])[0]
    if (/^\/(en\/)?(code|practical-guide|community|archive\/v[\d.]+)\//.test(url) && !aside.includes(`href="${url}"`)) {
      fail('sidebar', `${url}: サイドバーにこのページがありません（docs/.vitepress/config.ts の sidebar に追加してください）`)
    }
  }

  // 転送ページの行き先は実ページであること（転送の連鎖や行き先の消滅を防ぐ）
  for (const { f, html } of stubs) {
    const target = attr(html, /content="0; url=([^"]+)"/)
    if (!target || !pageUrls.has(target)) fail('redirect', `転送ページ ${f} の行き先 ${target} が実ページではありません`)
  }

  // サイトマップ：実ページを全部含み、転送ページを含まない
  const sitemap = read(path.join(DIST, 'sitemap.xml'))
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '')))
  for (const url of pageUrls) if (url !== '/404' && !locs.has(url)) fail('sitemap', `${url} が sitemap.xml にありません`)
  for (const { f } of stubs) if (locs.has(urlOf(f))) fail('sitemap', `転送ページ ${urlOf(f)} が sitemap.xml に入っています`)
  if (!/<priority>/.test(sitemap)) fail('sitemap', 'sitemap.xml に priority がありません')

  // llms.txt：日本語（正本）→ 英語 → 過去版の入口の順。載せ忘れ（### Other）が無いこと
  const llms = read(path.join(DIST, 'llms.txt'))
  const order = ['### Project Sprint（日本語・正本）', '### English', '### Archive']
  let pos = -1
  for (const h of order) {
    const i = llms.indexOf(h)
    if (i < 0 || i < pos) fail('llms', `llms.txt の節「${h}」が無いか、順番が違います`)
    pos = i
  }
  if (llms.includes('### Other')) fail('llms', 'llms.txt に「### Other」があります。新しいページを docs/.vitepress/config.ts の LLMS_SIDEBAR に追加してください')
  if (!llms.includes('The Japanese text is the authoritative version')) fail('llms', 'llms.txt の概要から「日本語が正本」の説明が消えています')
  const full = read(path.join(DIST, 'llms-full.txt'))
  if (/^url: .*\/archive\/v/m.test(full)) fail('llms', 'llms-full.txt に過去版のページが入っています')
  for (const rel of currentMd) {
    if (rel === 'index.md') continue // トップページは llms.txt 自体が代わりになる
    const mdOut = path.join(DIST, rel.replace(/(^|\/)index\.md$/, '$1').replace(/\/$/, '') + '.md')
    const alt = path.join(DIST, rel)
    if (!fs.existsSync(mdOut) && !fs.existsSync(alt)) fail('llms', `${rel} の Markdown 版（AI 向け .md）が生成されていません`)
  }

  // ヘッダー：日本語トップのメニューは Workshop / CODE v5.0 / Practical Guide / Community / Versions
  const home = pages.find((p) => p.f === 'index.html').html
  const nav = (home.match(/VPNavBarMenu[\s\S]*?<\/nav>/) || [''])[0].replace(/<[^>]+>/g, '|').replace(/\|+/g, '|')
  for (const item of ['Workshop', 'CODE v5.0', 'Practical Guide', 'Community', 'Versions', 'Release Notes']) {
    if (!nav.includes(`|${item}|`)) fail('header', `ヘッダーのメニューに「${item}」がありません（現在: ${nav}）`)
  }
  if (/\|Releases\|/.test(nav)) fail('header', 'ヘッダーに「Releases」が単独で出ています。Release Notes は Versions の中に置く決まりです')

  // フッター：英語 3 行（© / ライセンス / COPILOT のクレジット）が全ページにあること
  for (const { f, html } of pages) {
    if (f === '404.html') continue
    for (const s of ['© 2020–2026 Project Sprint Org and contributors', 'CC BY-SA 4.0', 'Originated and supported by']) {
      if (!html.includes(s)) { fail('footer', `${urlOf(f)}: フッターに「${s}」がありません`); break }
    }
  }
  // ダークモードは使わない
  if (/class="[^"]*\bdark\b/.test(home) || /VPSwitchAppearance/.test(home)) fail('theme', 'ダークモードの切り替えが表示されています（appearance: false の決まり）')

  console.log(`確認したページ: ${pages.length}（転送ページ ${stubs.length}）`)
}

// ---------------------------------------------------------------------------
if (failures.length) {
  console.error(`\n運用ルールに合っていない点が ${failures.length} 件あります:\n`)
  for (const f of failures) console.error('  ✗ ' + f)
  console.error('\n規則の説明は CLAUDE.md にあります。')
  process.exit(1)
}
console.log('✓ サイトの運用ルールの確認: すべて OK')
