import { computed } from 'vue'
import { useData } from 'vitepress'

/**
 * 言語切り替えメニューの項目。VitePress 標準の useLangs と同じ形を返す。
 * ページの frontmatter.altLang（config.ts の transformPageData でビルド時に計算）があればその行き先を使い、
 * 無ければ（404 ページなど）標準と同じく、今の URL の先頭の言語部分を入れ替える。
 */
export type AltLang = { lang: 'en' | 'ja'; link: string; exact: boolean }

export function useAltLangLinks() {
  const { site, localeIndex, page, theme, hash, frontmatter } = useData()

  const currentLang = computed(() => ({
    label: site.value.locales[localeIndex.value]?.label,
    link: site.value.locales[localeIndex.value]?.link ||
      (localeIndex.value === 'root' ? '/' : `/${localeIndex.value}/`)
  }))

  const localeLinks = computed(() => {
    const alt = frontmatter.value.altLang as AltLang | undefined
    return Object.entries(site.value.locales).flatMap(([key, value]) => {
      if (currentLang.value.label === value.label) return []
      const localeLink = value.link || (key === 'root' ? '/' : `/${key}/`)
      const lang = key === 'root' ? 'ja' : key
      if (alt && alt.lang === lang) {
        // 見出しのアンカーは言語で異なるが、対応ページがあるときは標準どおり # を引き継ぐ
        return { text: value.label, link: alt.link + (alt.exact ? hash.value : '') }
      }
      // 標準と同じ挙動（i18nRouting）
      const rel = page.value.relativePath.slice(currentLang.value.link.length - 1)
      const link = theme.value.i18nRouting !== false && rel
        ? localeLink.replace(/\/$/, '') + '/' + rel
          .replace(/^\//, '')
          .replace(/(^|\/)index\.md$/, '$1')
          .replace(/\.md$/, site.value.cleanUrls ? '' : '.html')
        : localeLink
      return { text: value.label, link: link + hash.value }
    })
  })

  return { localeLinks, currentLang }
}
