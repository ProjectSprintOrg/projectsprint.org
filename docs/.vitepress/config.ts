import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'
import footnote from 'markdown-it-footnote'
import { fromIndex } from './sidebar'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// GitHub Pages のプロジェクトサイト（https://projectsprintorg.github.io/projectsprint.org/）では
// サブパス配信になる。独自ドメインに切り替えるときは VITEPRESS_BASE=/ を渡す。
const base = process.env.VITEPRESS_BASE ?? '/projectsprint.org/'
const repo = 'https://github.com/ProjectSprintOrg/projectsprint.org'

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
    const archive = rel.match(/^(?:en\/)?archive\/(v[\d.]+)\//)
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
    return lastUpdated ? { lastUpdated } : {}
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `${base}pjs_logo.png` }],
    ['meta', { property: 'og:image', content: `${base}pjs_og.png` }],
    ['meta', { property: 'og:type', content: 'website' }]
  ],
  markdown: {
    image: { lazyLoading: true },
    headers: { level: [2, 3] },
    config(md) {
      md.use(footnote)
    }
  },
  vite: {
    plugins: [llmstxt()]
  },
  sitemap: { hostname: 'https://www.projectsprint.org' },

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
          { text: 'Releases', link: '/releases' },
          {
            text: 'バージョン',
            items: [
              { text: 'v5.0（最新）', link: '/code/' },
              { text: 'v4.3', link: '/archive/v4.3/' },
              { text: 'v3.3', link: '/archive/v3.3/' },
              { text: 'v2.2', link: '/archive/v2.2/' },
              { text: '過去バージョンについて', link: '/archive/' }
            ]
          }
        ],
        sidebar: {
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
            },
            { text: 'Practical Guide', link: '/practical-guide/' },
            { text: '過去バージョン', link: '/archive/' }
          ],
          '/practical-guide/': [
            {
              text: 'Practical Guide（CODE v4 準拠）',
              items: [
                { text: 'Practical Guide とは', link: '/practical-guide/' },
                { text: 'Minimum Guide', link: '/practical-guide/minimum_guide' },
                { text: 'ジョブとアクション', link: '/practical-guide/job_and_action' },
                { text: 'フラッグの要素', link: '/practical-guide/elements_of_flag' }
              ]
            },
            { text: 'CODE v5.0', link: '/code/' }
          ],
          '/community/': [
            {
              text: 'Community',
              items: [
                { text: 'Project Sprint づくりに参加する', link: '/community/' },
                { text: '質問・提案・貢献の方法', link: '/community/contributing' },
                { text: 'メンバー', link: '/community/maintainers' },
                { text: '関連サービス', link: '/community/ecosystem' },
                { text: '行動規範', link: '/community/code-of-conduct' },
                { text: 'ライセンス', link: '/community/license' }
              ]
            }
          ],
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
              { text: '一覧', link: '/archive/' },
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
          { text: 'Archive (v2.0)', link: '/en/archive/v2.0/' },
          { text: 'Community', link: '/community/' },
          { text: '日本語版', link: '/' }
        ],
        sidebar: {
          '/en/archive/v2.0/': [
            { text: 'Current version: CODE v5.0 (Japanese)', link: '/code/' },
            { text: 'En v2.0 (archived)', items: [{ text: 'What is CODE?', link: '/en/archive/v2.0/' }, ...fromIndex('en/archive/v2.0/index.md', { recurse: true })] }
          ],
          '/en/': [
            { text: 'English', items: [
              { text: 'Overview', link: '/en/' },
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
      message: 'Project Sprint is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ja">CC BY-SA 4.0</a>.',
      copyright: 'Project Sprint Org'
    }
  }
})
