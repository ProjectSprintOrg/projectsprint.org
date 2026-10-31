<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'
import { useSidebar } from 'vitepress/theme'
import type { DefaultTheme } from 'vitepress'

const { site, frontmatter } = useData()
const route = useRoute()
const { sidebarGroups } = useSidebar()
const base = site.value.base.replace(/\/$/, '')

const isEn = computed(() => route.path.replace(base, '').startsWith('/en/'))

const VERSIONS = [
  { text: 'v5.0', note: '最新', link: '/code/' },
  { text: 'v4.3', link: '/archive/v4.3/' },
  { text: 'v3.3', link: '/archive/v3.3/' },
  { text: 'v2.2', link: '/archive/v2.2/' },
  { text: 'En v2.0', link: '/en/archive/v2.0/' }
]

// 「このバージョンの構成」：サイドバーのグループを列にする。
// 子項目を持つ項目（Theories / Practices / Tutorial など）は独立した列にして、縦に長くなりすぎないようにする。
type Col = { title: string; items: DefaultTheme.SidebarItem[] }
const columns = computed<Col[]>(() => {
  const cols: Col[] = []
  for (const g of sidebarGroups.value as DefaultTheme.SidebarItem[]) {
    // 見出しの無いグループ（「最新版 CODE v5.0」などの単独リンク）はバージョン行で代替するので省く
    if (!g.items?.length || !g.text) continue
    const leaves = g.items.filter(i => !i.items?.length)
    if (leaves.length) cols.push({ title: g.text ?? '', items: leaves })
    for (const i of g.items) {
      if (i.items?.length) cols.push({ title: i.text ?? '', items: i.items })
    }
  }
  return cols
})
const show = computed(() => frontmatter.value.layout !== 'home' && columns.value.length > 0)

const current = computed(() => route.path.replace(base, '').replace(/\.html$/, ''))
const isCurrent = (link?: string) => !!link && current.value === link.replace(/\/$/, '') + (link.endsWith('/') ? '/' : '')
const href = (link?: string) => `${base}${link ?? ''}`
</script>

<template>
  <footer v-if="show" class="version-footer">
    <div class="version-footer__structure">
      <div v-for="(col, i) in columns" :key="i" class="version-footer__group">
        <div v-if="col.title" class="version-footer__title">{{ col.title }}</div>
        <ul>
          <li v-for="item in col.items" :key="item.text">
            <a v-if="item.link" :href="href(item.link)" :class="{ 'is-current': isCurrent(item.link) }">{{ item.text }}</a>
            <span v-else class="version-footer__sub">{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </div>
    <div class="version-footer__versions">
      <span class="version-footer__label">{{ isEn ? 'Versions' : 'バージョン' }}</span>
      <a v-for="v in VERSIONS" :key="v.link" :href="href(v.link)">
        {{ v.text }}<small v-if="v.note">（{{ isEn ? 'current' : v.note }}）</small>
      </a>
      <a :href="href('/archive/')" class="version-footer__more">{{ isEn ? 'About archived versions' : '過去バージョンについて' }}</a>
    </div>
  </footer>
</template>

<style scoped>
.version-footer {
  margin-top: 64px;
  padding-top: 28px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
  line-height: 1.7;
}
.version-footer__structure {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 20px 28px;
}
.version-footer__title {
  margin-bottom: 6px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.version-footer ul { margin: 0; padding: 0; list-style: none; }
.version-footer a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}
.version-footer a:hover { color: var(--vp-c-brand-1); }
.version-footer a.is-current { color: var(--vp-c-brand-1); font-weight: 600; }
.version-footer__sub { color: var(--vp-c-text-3); }
.version-footer__versions {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 16px;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px dashed var(--vp-c-divider);
}
.version-footer__label { font-weight: 600; color: var(--vp-c-text-1); }
.version-footer__versions small { color: var(--vp-c-text-3); font-size: 12px; }
.version-footer__more { margin-left: auto; }
</style>
