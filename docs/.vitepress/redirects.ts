import fs from 'node:fs'
import path from 'node:path'

/**
 * 旧サイトの URL から新サイトへのリダイレクト。
 * old-urls.txt は、GitBook 時代の llms.txt と Wayback Machine の記録から集めた
 * 「このドメインにかつて存在した全ページ」のパス一覧（Jekyll 時代 2020〜2021 年を含む）。
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

const LATEST: Record<string, string> = { '4': 'v4.3', '3': 'v3.3', '2': 'v2.2', '1': 'v2.2', '0': 'v2.2' }

/** 版のルートの下の相対パス rest を、その版に実在するページへ寄せる（無ければ版の目次） */
function inVersion(root: string, rest: string | undefined, major: string): string {
  if (!rest) return root
  const candidates = [root + rest, root + rest + '/']
  if (major === '3' && (rest === 'theories' || rest === 'practices')) candidates.unshift(root + 'theories_and_practices')
  for (const c of candidates) if (exists(c)) return c
  // 同名ページが無ければ、その区分（tips / tutorial など）の目次へ。それも無ければ版の目次へ
  const section = rest.split('/')[0]
  if (section !== rest && exists(root + section + '/')) return root + section + '/'
  return root
}

/** 旧パス（先頭スラッシュなし、拡張子なし）→ 新パス（先頭スラッシュあり） */
export function mapOldPath(old: string): string {
  old = old.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '')
  const fixed: Record<string, string> = {
    '': '/',
    index: '/',
    readme: '/',
    ja: '/code/',
    en: '/en/',
    license: '/community/license',
    LICENCE: '/community/license',
    'readme/license': '/community/license',
    codeofconduct: '/community/code-of-conduct',
    contributing: '/community/contributing',
    releasenotes: '/releases',
    releasemanagement: '/releases',
    'practical-guide': '/practical-guide/',
    'practical-guide/task_and_action': '/practical-guide/job_and_action',
    oldversions: '/archive/',
    'oldversions/v2_2_0': '/archive/v2.2/',
    'ja/v3.3/theories/ibento': '/archive/v3.3/theories/restrictions'
  }
  if (fixed[old] !== undefined) return fixed[old]

  // Jekyll 時代（2020〜2021）: /ja/code/..., /ja/manual/..., /en/code/..., /oldversions/v2_2_0/...
  const jk = old.match(/^(?:oldversions\/v2_2_0\/)?(ja|en)(?:\/(code|manual))?(?:\/(.*))?$/)
  if (jk && !/^v\d/.test(jk[3] ?? '')) {
    const [, lang, , rest = ''] = jk
    const root = lang === 'en' ? '/en/archive/v2.0/' : '/archive/v2.2/'
    if (!rest) return old.startsWith('oldversions') ? root : (lang === 'en' ? '/en/' : '/code/')
    const [section, ...tail] = rest.split('/')
    if (section === 'tips') return inVersion(root, tail.length ? 'tips/' + tail.join('/') : 'tips', '2')
    if (section === 'tutorial') return lang === 'ja' && tail.length ? '/archive/v3.3/' : inVersion(root, tail.length ? 'tutorial/' + tail.join('/') : 'tutorial', '2')
    if (section === 'essentials' || section === 'reference') return lang === 'ja' ? `/archive/v3.3/${section}` : `${root}${section}`
    if (section === 'advance') return `${root}advance`
    return '/archive/'   // theory / practice / plug-in など v1 時代の構成
  }

  // GitBook 時代の各種表記: ja/v4.3/x, ja/v4.0-alpha/x, ja/v3/ja-v3.1/x, ja-v3.0.0/x, en/v2/en-v2.0.1/x, readme/ja/v4.0
  const m = old.match(/^(?:readme\/)?(ja|en)(?:\/v\d)?[\/-](?:ja-|en-)?v(\d)\.(\d)(?:\.\d)?(?:-alpha)?(?:\/(.*))?$/)
  if (!m) return '/'
  const [, lang, major, , rest] = m
  const root = lang === 'en' ? '/en/archive/v2.0/' : `/archive/${LATEST[major] ?? 'v' + major}/`
  return inVersion(root, rest, major)
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
    // 実ページ（x.html または x/index.html）が存在する旧パスには転送ページを作らない
    const isReal = (f: string) => fs.existsSync(f) && !fs.readFileSync(f, 'utf8').includes('http-equiv="refresh"')
    if (isReal(path.join(outDir, `${old}.html`)) || isReal(path.join(outDir, old, 'index.html'))) continue
    for (const file of [`${old}.html`, `${old}/index.html`]) {
      const abs = path.join(outDir, file)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, html)
      count++
    }
  }
  return count
}
