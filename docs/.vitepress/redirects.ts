import fs from 'node:fs'
import path from 'node:path'

/**
 * 旧サイト（GitBook）の URL から新サイトへのリダイレクト。
 * old-urls.txt は旧サイトの llms.txt から抜き出した全ページのパス一覧。
 * GitHub Pages はサーバー側のリダイレクトを持たないので、
 * 旧パスごとに meta refresh で転送する小さな HTML を生成する。
 */
const DOCS = path.resolve(__dirname, '..')

function exists(newPath: string): boolean {
  // '/archive/v3.3/theories/101' -> docs/archive/v3.3/theories/101.md
  // '/archive/v3.3/'             -> docs/archive/v3.3/index.md
  const rel = newPath.endsWith('/') ? newPath + 'index.md' : newPath + '.md'
  return fs.existsSync(path.join(DOCS, rel))
}

/** 旧パス（先頭スラッシュなし、拡張子なし）→ 新パス（先頭スラッシュあり） */
export function mapOldPath(old: string): string {
  const fixed: Record<string, string> = {
    readme: '/',
    ja: '/code/',
    en: '/en/',
    license: '/community/license',
    releasenotes: '/releases',
    'practical-guide': '/practical-guide/',
    'practical-guide/task_and_action': '/practical-guide/job_and_action'
  }
  if (fixed[old]) return fixed[old]

  const m = old.match(/^(ja|en)\/v(\d)\.(\d)(?:\/(.*))?$/)
  if (!m) return '/'
  const [, lang, major, , rest] = m
  const latest: Record<string, string> = { '4': 'v4.3', '3': 'v3.3', '2': 'v2.2' }
  const root = lang === 'en' ? '/en/archive/v2.0/' : `/archive/${latest[major] ?? 'v' + major}/`
  if (!rest) return root

  // index ページ（tutorial / tips / theories / practices）は末尾スラッシュ付きで探す
  const candidates = [root + rest, root + rest + '/']
  if (lang === 'ja' && major === '3' && (rest === 'theories' || rest === 'practices')) {
    candidates.unshift(root + 'theories_and_practices')
  }
  for (const c of candidates) if (exists(c)) return c
  return root
}

export function writeRedirects(outDir: string, base: string) {
  const list = fs.readFileSync(path.join(__dirname, 'old-urls.txt'), 'utf8')
    .split('\n').map(l => l.trim()).filter(Boolean)
  const prefix = base.replace(/\/$/, '')
  let count = 0
  for (const old of list) {
    const target = prefix + mapOldPath(old)
    const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex">
<title>Project Sprint</title></head>
<body><p>このページは移動しました。<a href="${target}">${target}</a></p>
<script>location.replace(${JSON.stringify(target)})</script></body></html>
`
    for (const file of [`${old}.html`, `${old}/index.html`]) {
      const abs = path.join(outDir, file)
      if (fs.existsSync(abs) && !fs.readFileSync(abs, 'utf8').includes('http-equiv="refresh"')) continue // 実ページを上書きしない
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, html)
      count++
    }
  }
  return count
}
