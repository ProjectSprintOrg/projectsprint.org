import { defineConfig, type HeadConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'
import footnote from 'markdown-it-footnote'
import { fromIndex } from './sidebar'
import { writeRedirects } from './redirects'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages のプロジェクトサイト（https://projectsprintorg.github.io/projectsprint.org/）では
// サブパス配信になる。独自ドメインに切り替えるときは VITEPRESS_BASE=/ を渡す。
const base = process.env.VITEPRESS_BASE ?? '/projectsprint.org/'
const repo = 'https://github.com/ProjectSprintOrg/projectsprint.org'
// 本番の公開 URL。canonical・OGP・hreflang・サイトマップ・llms.txt はすべてこのドメインで出す
const site = 'https://www.projectsprint.org'
const OG_IMAGE = `${site}/pjs_og.png`

// 過去版は「内容の最終更新」としてそのバージョンのリリース日を表示する
const ARCHIVE_DATES: Record<string, string> = {
  'v4.3': '2024-01-11',
  'v3.3': '2022-10-04',
  'v2.2': '2021-09-28',
  'v2.0': '2021-07-15'
}

// md ファイルの git 上の最終コミット日時（ファイルの移動・改名を追跡する）
function contentUpdatedAt(file: string): number | undefined {
  try {
    const out = execSync(`git log -1 --follow --diff-filter=AM --format=%at -- "${file}"`, {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
    return out ? Number(out) * 1000 : undefined
  } catch {
    return undefined
  }
}

// 言語切り替えメニューの行き先をページごとに計算する。
// VitePress 標準は URL の先頭に /en/ を足す・外すだけで、相手側にページがあるかを見ないため。
// exact: 相手言語に内容の対応するページがあるか（false のときは相手言語の入口へ案内する）
type AltLang = { lang: 'en' | 'ja'; link: string; exact: boolean }
const DOCS_DIR = path.resolve(__dirname, '..')
const mdExists = (rel: string) => fs.existsSync(path.join(DOCS_DIR, rel))
const toLink = (rel: string) => '/' + rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')

function altLangOf(rel: string): AltLang {
  if (!rel.startsWith('en/')) {
    // 日本語 → 英語：同じパスの英語ページがあればそこへ。無ければ英語トップで「日本語のみ」と案内する
    const en = 'en/' + rel
    if (mdExists(en)) return { lang: 'en', link: toLink(en), exact: true }
    return { lang: 'en', link: `/en/?from=${toLink(rel)}`, exact: false }
  }
  const ja = rel.slice('en/'.length)
  // En v2.0 は日本語 v2.2 の英訳なので、v2.2 の同名ページ → その章の目次 → v2.2 の目次の順に探す
  const v2 = ja.match(/^archive\/v2\.0\/(.*)$/)
  if (v2) {
    const target = 'archive/v2.2/' + v2[1]
    if (mdExists(target)) return { lang: 'ja', link: toLink(target), exact: true }
    const section = v2[1].includes('/') ? `archive/v2.2/${v2[1].split('/')[0]}/index.md` : ''
    if (section && mdExists(section)) return { lang: 'ja', link: toLink(section), exact: false }
    return { lang: 'ja', link: '/archive/v2.2/', exact: false }
  }
  if (mdExists(ja)) return { lang: 'ja', link: toLink(ja), exact: true }
  return { lang: 'ja', link: '/', exact: false }
}

// ページの説明文（<meta name="description"> と OGP に使う）。
// frontmatter に description が無いページは、本文の最初の段落から自動で作る。
function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')                 // HTML タグ
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')      // 画像
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')   // リンク → テキスト
    .replace(/\[\^[^\]]+\]/g, '')              // 脚注参照
    .replace(/[*_`~]+/g, '')                   // 強調・コード
    .replace(/\s+/g, ' ')
    .trim()
}

function autoDescription(rel: string): string | undefined {
  let src: string
  try {
    src = fs.readFileSync(path.join(DOCS_DIR, rel), 'utf8')
  } catch {
    return undefined
  }
  // 他ファイルを読み込むだけのページは、読み込み元の本文を使う
  src = src.replace(/<!--@include:\s*([^\s{]+?)(?:\{[^}]*\})?\s*-->/g, (_m, inc: string) => {
    try {
      return fs.readFileSync(path.join(DOCS_DIR, path.dirname(rel), inc), 'utf8')
    } catch {
      return ''
    }
  })
  src = src.replace(/^---\n[\s\S]*?\n---\n/, '')
  const paragraphs = src.split(/\n\s*\n/)
  for (const para of paragraphs) {
    const line = para.trim()
    // 見出し・引用（NOTE 枠）・表・箇条書き・区切り線・HTML ブロックは飛ばし、最初の地の文を使う
    if (!line || /^(#|>|\||[-*+]\s|\d+\.\s|---|<|!\[|<!--)/.test(line)) continue
    const text = stripMarkdown(line)
    if (text.length < 20) continue
    const ja = !rel.startsWith('en/')
    const max = ja ? 120 : 160
    if (text.length <= max) return text
    // 上限内で文が終わるところで切る。無ければ単語（英語）・文字（日本語）で切って省略記号を付ける
    const head = text.slice(0, max)
    const end = ja ? head.lastIndexOf('。') : Math.max(head.lastIndexOf('. '), head.lastIndexOf('.'))
    if (end > max * 0.4) return head.slice(0, end + 1).trim()
    return (ja ? head : head.slice(0, head.lastIndexOf(' '))).trim() + '…'
  }
  return undefined
}

// クリーン URL でのページのパス（code/step0.md → /code/step0、code/index.md → /code/）
const pagePath = (rel: string) => '/' + rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')

// サイドバー。日本語・英語それぞれのナビに使い、llms.txt の目次の並び順にも使う
const SIDEBAR_JA = {
  '/code/': [
    {
      text: 'CODE v5.0（最新版）',
      items: [
        { text: 'CODE とは', link: '/code/' },
        { text: 'Introduction', link: '/code/introduction' },
        { text: 'Step0. 個人が世界を更新する', link: '/code/step0' },
        { text: 'Step1. 他者と世界の認識を分かち合う', link: '/code/step1' },
        { text: 'Key Terms', link: '/code/keyterms' }
      ]
    }
  ],
  '/practical-guide/': [
    {
      text: 'Practical Guide（CODE v4 準拠）',
      items: [
        { text: 'Practical Guide とは', link: '/practical-guide/' },
        { text: 'Project Sprint Minimum Guide', link: '/practical-guide/minimum-guide' },
        { text: 'ジョブとアクション', link: '/practical-guide/job-and-action' }
      ]
    }
  ],
  '/community/': [
    {
      text: 'Community',
      items: [
        { text: 'Community とは', link: '/community/' },
        { text: '質問・提案・貢献の方法', link: '/community/contributing' },
        { text: 'メンバー', link: '/community/maintainers' },
        { text: '関連サービス', link: '/community/ecosystem' },
        { text: 'コントリビューター行動規範', link: '/community/code-of-conduct' },
        { text: 'ライセンス', link: '/community/license' },
        { text: 'このサイトについて', link: '/community/colophon' }
      ]
    }
  ]
}

const SIDEBAR_EN_CODE = {
  text: 'CODE v5.0 (current)',
  items: [
    { text: 'About CODE', link: '/en/code/' },
    { text: 'Introduction', link: '/en/code/introduction' },
    { text: 'Step0. The Individual Updates the World', link: '/en/code/step0' },
    { text: 'Step1. Sharing Our Perception of the World with Others', link: '/en/code/step1' },
    { text: 'Key Terms', link: '/en/code/keyterms' }
  ]
}

// llms.txt の目次。現行文書 → 英語 → 過去バージョンの入口、の順に並べ、
// 過去バージョンの個々のページは目次に載せない（各ページの .md 自体は生成される）
const LLMS_SIDEBAR = [
  {
    text: 'Project Sprint（日本語・正本）',
    items: [
      { text: 'Workshop', link: '/workshop/' },
      ...SIDEBAR_JA['/code/'][0].items,
      ...SIDEBAR_JA['/practical-guide/'][0].items,
      ...SIDEBAR_JA['/community/'][0].items,
      { text: 'Release Notes', link: '/releases' }
    ]
  },
  {
    text: 'English (AI-assisted translation, community review wanted)',
    items: [{ text: 'English overview', link: '/en/' }, ...SIDEBAR_EN_CODE.items]
  },
  {
    text: 'Archive (older versions, no longer updated)',
    items: [
      { text: '過去バージョンについて', link: '/archive/' },
      { text: 'CODE v4.3', link: '/archive/v4.3/' },
      { text: 'CODE v3.3', link: '/archive/v3.3/' },
      { text: 'CODE v2.2', link: '/archive/v2.2/' },
      { text: 'CODE En v2.0', link: '/en/archive/v2.0/' }
    ]
  }
]

export default defineConfig({
  base,
  lang: 'ja',
  title: 'Project Sprint',
  description: '不確実な状況においてプロジェクトを前進させるためのオープンソースのフレームワーク',
  cleanUrls: true,
  lastUpdated: true,
  appearance: false,
  transformPageData(pageData) {
    const rel = pageData.relativePath
    const fm = pageData.frontmatter
    // 前後ナビは使わない（Project Sprint は前から順に読む文書ではない）。
    // 代わりに VersionFooter がそのバージョンの構成全体を表示する。
    fm.prev = false
    fm.next = false
    fm.altLang = altLangOf(rel)
    if (!fm.description && fm.layout !== 'home') {
      const d = autoDescription(rel)
      if (d) {
        fm.description = d
        pageData.description = d
      }
    }
    // Practical Guide は CODE v4 準拠なので、準拠バージョン（v4.3）のリリース日を表示する
    const archive = rel.match(/^(?:en\/)?archive\/(v[\d.]+)\//) ?? (rel.startsWith('practical-guide/') ? [rel, 'v4.3'] : null)
    let lastUpdated = archive
      ? Date.parse(ARCHIVE_DATES[archive[1]])
      : contentUpdatedAt(path.join('docs', rel))
    // 他のファイルを読み込んで表示しているページ（行動規範・貢献ガイドなど）は、
    // 薄いページ自身ではなく読み込み元ファイルの更新日を使う
    if (!archive) {
      const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8')
      const included = [...src.matchAll(/<!--@include:\s*([^\s{]+?)(?:\{[^}]*\})?\s*-->/g)]
        .map(m => contentUpdatedAt(path.normalize(path.join('docs', path.dirname(rel), m[1]))))
        .filter((t): t is number => !!t)
      if (included.length) lastUpdated = Math.max(...included)
    }
    // 英訳ページ：原文（日本語）の更新日と比べ、原文の方が新しければ「翻訳が古い」と表示する
    const tr = rel.match(/^en\/code\/(.+)\.md$/)
    if (tr) {
      const sourceRel = `code/${tr[1]}.md`
      const sourceAt = contentUpdatedAt(path.join('docs', sourceRel))
      const transAt = contentUpdatedAt(path.join('docs', rel))
      fm.translation = {
        source: '/' + sourceRel.replace(/index\.md$/, '').replace(/\.md$/, ''),
        sourceDate: sourceAt ? new Date(sourceAt).toISOString().slice(0, 10) : undefined,
        outdated: !!(sourceAt && transAt && sourceAt > transAt)
      }
    }
    return lastUpdated ? { lastUpdated } : {}
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `${base}pjs_logo.png` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}pjs_logo.png` }],
    ['meta', { name: 'theme-color', content: '#0f6e78' }],
    ['meta', { property: 'og:site_name', content: 'Project Sprint' }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    ['link', { rel: 'license', href: 'https://creativecommons.org/licenses/by-sa/4.0/' }]
  ],
  // ページごとの SEO・OGP・構造化データ。検索エンジンと AI クローラーの両方に向けたもの
  transformHead({ page, pageData, title, description }) {
    if (page === '404.md') return [['meta', { name: 'robots', content: 'noindex' }]]
    const rel = page
    const url = site + pagePath(rel)
    const en = rel.startsWith('en/')
    const home = pageData.frontmatter.layout === 'home'
    const archive = /^(en\/)?archive\//.test(rel)
    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: home ? 'website' : 'article' }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:locale', content: en ? 'en_US' : 'ja_JP' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    ]
    // 日英で内容が対応するページだけ hreflang を出す。x-default は正本の日本語
    const alt = pageData.frontmatter.altLang as AltLang | undefined
    if (alt?.exact) {
      const altUrl = site + alt.link
      const ja = en ? altUrl : url
      head.push(
        ['link', { rel: 'alternate', hreflang: 'ja', href: ja }],
        ['link', { rel: 'alternate', hreflang: 'en', href: en ? url : altUrl }],
        ['link', { rel: 'alternate', hreflang: 'x-default', href: ja }],
        ['meta', { property: 'og:locale:alternate', content: en ? 'ja_JP' : 'en_US' }]
      )
    }
    const org = {
      '@type': 'Organization',
      name: 'Project Sprint Org',
      url: site,
      logo: `${site}/pjs_logo.png`,
      sameAs: [repo]
    }
    const jsonLd = home
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            { ...org, '@id': `${site}/#organization` },
            {
              '@type': 'WebSite',
              '@id': `${site}/#website`,
              url: site,
              name: 'Project Sprint',
              description,
              inLanguage: en ? 'en' : 'ja',
              publisher: { '@id': `${site}/#organization` },
              license: 'https://creativecommons.org/licenses/by-sa/4.0/'
            }
          ]
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: pageData.title,
          description,
          url,
          inLanguage: en ? 'en' : 'ja',
          isPartOf: { '@type': 'WebSite', name: 'Project Sprint', url: site },
          author: org,
          publisher: org,
          license: 'https://creativecommons.org/licenses/by-sa/4.0/',
          isAccessibleForFree: true,
          ...(pageData.lastUpdated ? { dateModified: new Date(pageData.lastUpdated).toISOString().slice(0, 10) } : {}),
          ...(archive ? { creativeWorkStatus: 'Archived' } : {})
        }
    head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd)])
    return head
  },
  markdown: {
    image: { lazyLoading: true },
    headers: { level: [2, 3] },
    config(md) {
      md.use(footnote)
      // alt の無い画像（過去版に数枚ある）には、ファイル名から作った alt を付ける
      const image = md.renderer.rules.image!
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (!token.children?.length) {
          const name = (token.attrGet('src') ?? '').split('/').pop()?.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ')
          if (name) {
            const text = new (token.constructor as any)('text', '', 0)
            text.content = name
            token.children = [text]
          }
        }
        return image(tokens, idx, options, env, self)
      }
    }
  },
  vite: {
    plugins: [
      llmstxt({
        // 本番の URL で出す（プレビューのサブパス配信ではそのまま）
        ...(base === '/' ? { domain: site } : {}),
        sidebar: LLMS_SIDEBAR,
        customTemplateVariables: {
          title: 'Project Sprint',
          description: '不確実な状況においてプロジェクトを前進させるためのオープンソースのフレームワーク / An open-source framework for moving projects forward under uncertainty',
          details: [
            'Project Sprint は、プロジェクトを「あらかじめ定めた正解を実行する活動」ではなく「行動を通じて理解を更新し、価値を探索する活動」と捉え、探索と収束のリズムで前進させるフレームワークです。2020 年に株式会社コパイロツトが公開し、2025 年に Project Sprint Org へ移管されました。文書は CC BY-SA 4.0 で提供されています。',
            '',
            'The Japanese text is the authoritative version; the current release is CODE v5.0. English pages under /en/ are an AI-assisted translation under community review. Pages under /archive/ are older versions kept for reference and no longer updated.'
          ].join('\n')
        },
        // 過去バージョンは目次に入口だけ載せ、llms-full.txt からは外す（各ページの .md は生成される）
        ignoreFilesPerOutput: {
          llmsTxt: ['archive/*/**', 'en/archive/*/**', '!archive/*/index.md', '!en/archive/*/index.md'],
          llmsFullTxt: ['archive/**', 'en/archive/**']
        }
      })
    ],
    resolve: {
      // 標準の言語切り替え（PC のヘッダー・モバイルのメニュー）を、ページごとの行き先を使う自前の部品に差し替える
      alias: [
        { find: /^.*\/VPNavBarTranslations\.vue$/, replacement: path.resolve(__dirname, 'theme/NavBarTranslations.vue') },
        { find: /^.*\/VPNavScreenTranslations\.vue$/, replacement: path.resolve(__dirname, 'theme/NavScreenTranslations.vue') },
        // 768〜1279px でヘッダーがまとまる「⋯」メニュー。ここにも言語リンクがある
        { find: /^.*\/VPNavBarExtra\.vue$/, replacement: path.resolve(__dirname, 'theme/NavBarExtra.vue') }
      ]
    }
  },
  sitemap: {
    hostname: site,
    transformItems(items) {
      return items
        .filter(i => !/\/404$/.test(i.url))
        .map(i => {
          const p = '/' + i.url.replace(site, '').replace(/^\//, '')
          // 過去バージョンは検索結果での優先度を下げ、入口と現行文書を優先する
          const archive = /^\/(en\/)?archive\/v/.test(p)
          const top = p === '/' || p === '/en/' || /^\/(code|practical-guide|workshop|community)\/$/.test(p)
          return { ...i, priority: archive ? 0.3 : top ? 1.0 : 0.7 }
        })
    }
  },
  buildEnd(siteConfig) {
    // 旧 GitBook の URL から新 URL へ転送するページを生成する
    const n = writeRedirects(siteConfig.outDir, siteConfig.site.base)
    console.log(`redirects: ${n} files written`)
  },

  locales: {
    root: {
      label: '日本語',
      lang: 'ja',
      themeConfig: {
        nav: [
          { text: 'Workshop', link: '/workshop/' },
          { text: 'CODE v5.0', link: '/code/', activeMatch: '^/code/' },
          { text: 'Practical Guide', link: '/practical-guide/', activeMatch: '^/practical-guide/' },
          { text: 'Community', link: '/community/', activeMatch: '^/community/' },
          {
            text: 'Versions',
            activeMatch: '^/(archive/|releases)',
            items: [
              {
                text: 'CODE',
                items: [
                  { text: 'v5.0（最新）', link: '/code/' },
                  { text: 'v4.3', link: '/archive/v4.3/' },
                  { text: 'v3.3', link: '/archive/v3.3/' },
                  { text: 'v2.2', link: '/archive/v2.2/' }
                ]
              },
              {
                items: [
                  { text: 'Release Notes', link: '/releases' },
                  { text: '過去バージョンについて', link: '/archive/' }
                ]
              }
            ]
          }
        ],
        sidebar: {
          ...SIDEBAR_JA,
          '/archive/v4.3/': [
            { text: '最新版 CODE v5.0', link: '/code/' },
            { text: 'v4.3（アーカイブ）', items: [{ text: '文書構成', link: '/archive/v4.3/' }, ...fromIndex('archive/v4.3/index.md')] }
          ],
          '/archive/v3.3/': [
            { text: '最新版 CODE v5.0', link: '/code/' },
            {
              text: 'v3.3（アーカイブ）',
              items: [
                { text: 'CODE とは', link: '/archive/v3.3/' },
                { text: 'Theories and Practices', link: '/archive/v3.3/theories_and_practices' },
                { text: 'Theories', collapsed: false, items: fromIndex('archive/v3.3/theories_and_practices.md').filter(i => i.link!.includes('/theories/')) },
                { text: 'Practices', collapsed: false, items: fromIndex('archive/v3.3/theories_and_practices.md').filter(i => i.link!.includes('/practices/')) },
                { text: 'Essentials', link: '/archive/v3.3/essentials' },
                { text: 'Reference', link: '/archive/v3.3/reference' }
              ]
            }
          ],
          '/archive/v2.2/': [
            { text: '最新版 CODE v5.0', link: '/code/' },
            { text: 'v2.2（アーカイブ）', items: [{ text: 'CODE とは', link: '/archive/v2.2/' }, ...fromIndex('archive/v2.2/index.md', { recurse: true })] }
          ],
          '/archive/': [
            { text: '過去バージョン', items: [
              { text: '過去バージョンについて', link: '/archive/' },
              { text: 'v4.3', link: '/archive/v4.3/' },
              { text: 'v3.3', link: '/archive/v3.3/' },
              { text: 'v2.2', link: '/archive/v2.2/' }
            ] }
          ]
        },
        outline: { level: [2, 3], label: 'このページの内容' },
        lastUpdated: { text: '内容の最終更新', formatOptions: { dateStyle: 'long', forceLocale: true } },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'GitHub でこのページを編集' },
        returnToTopLabel: 'ページの先頭へ',
        sidebarMenuLabel: 'メニュー',
        langMenuLabel: '言語'
      }
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      title: 'Project Sprint',
      description: 'An open-source framework for moving projects forward under uncertainty',
      themeConfig: {
        nav: [
          { text: 'CODE v5.0', link: '/en/code/', activeMatch: '^/en/code/' },
          { text: 'Community (Japanese)', link: '/community/' },
          {
            text: 'Versions',
            activeMatch: '^/en/archive/',
            items: [
              {
                text: 'CODE',
                items: [
                  { text: 'v5.0 (current)', link: '/en/code/' },
                  { text: 'v2.0 (archived)', link: '/en/archive/v2.0/' }
                ]
              },
              {
                items: [
                  { text: 'Release Notes (Japanese)', link: '/releases' },
                  { text: 'Older versions (Japanese)', link: '/archive/' }
                ]
              }
            ]
          }
        ],
        sidebar: {
          '/en/code/': [
            SIDEBAR_EN_CODE,
            { text: 'Japanese original', link: '/code/' },
            { text: 'Archive: En v2.0', link: '/en/archive/v2.0/' }
          ],
          '/en/archive/v2.0/': [
            { text: 'Current version: CODE v5.0', link: '/en/code/' },
            { text: 'En v2.0 (archived)', items: [{ text: 'What is CODE?', link: '/en/archive/v2.0/' }, ...fromIndex('en/archive/v2.0/index.md', { recurse: true })] }
          ],
          '/en/': [
            { text: 'English', items: [
              { text: 'Overview', link: '/en/' },
              { text: 'CODE v5.0', link: '/en/code/' },
              { text: 'Archive: En v2.0', link: '/en/archive/v2.0/' }
            ] }
          ]
        },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
        lastUpdated: { text: 'Content last updated', formatOptions: { dateStyle: 'long', forceLocale: true } }
      }
    }
  },

  themeConfig: {
    logo: '/pjs_logo.png',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repo }],
    footer: {
      message: '© 2020–2026 Project Sprint Org and contributors.<br>Text licensed under <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Site code licensed under <a href="https://github.com/ProjectSprintOrg/projectsprint.org/blob/main/LICENSE-CODE.md">MIT</a>. · <a href="' + base + 'community/colophon">About this site</a>',
      copyright: 'Originated and supported by <a href="https://copilot.jp/" target="_blank" rel="noopener">COPILOT Inc.</a>'
    }
  }
})
