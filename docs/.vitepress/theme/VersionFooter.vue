<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData, useRoute } from 'vitepress'
import { useSidebar } from 'vitepress/theme'
import type { DefaultTheme } from 'vitepress'

const { site, frontmatter } = useData()
const route = useRoute()
const { sidebarGroups } = useSidebar()
const base = site.value.base.replace(/\/$/, '')

const isEn = computed(() => route.path.replace(base, '').startsWith('/en/'))

// 言語ごとのバージョン一覧。英語版は言語切り替えの側に置き、日本語のバージョン一覧には混ぜない
const VERSIONS_JA = [
  { text: 'v5.0', note: '最新', link: '/code/' },
  { text: 'v4.3', link: '/archive/v4.3/' },
  { text: 'v3.3', link: '/archive/v3.3/' },
  { text: 'v2.2', link: '/archive/v2.2/' }
]
const VERSIONS_EN = [
  { text: 'v5.0', note: 'current', link: '/en/code/' },
  { text: 'v2.0', note: 'archived', link: '/en/archive/v2.0/' }
]
const versions = computed(() => (isEn.value ? VERSIONS_EN : VERSIONS_JA))

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

// スマホでは構成一覧が縦に長くなるので、折りたたんで表示する（PC では常に展開）
const isDesktop = ref(true)
const expanded = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(min-width: 768px)')
  const apply = () => { isDesktop.value = mq.matches }
  apply()
  mq.addEventListener('change', apply)
})

const current = computed(() => route.path.replace(base, '').replace(/\.html$/, ''))
const isCurrent = (link?: string) => !!link && current.value === link.replace(/\/$/, '') + (link.endsWith('/') ? '/' : '')
const href = (link?: string) => `${base}${link ?? ''}`
</script>

<template>
  <footer v-if="show" class="version-footer">
    <button v-if="!isDesktop" type="button" class="version-footer__toggle" :aria-expanded="expanded" @click="expanded = !expanded">
      <span>{{ isEn ? 'Contents of this version' : 'このバージョンの構成' }}</span>
      <span class="version-footer__chevron" :class="{ 'is-open': expanded }" aria-hidden="true">›</span>
    </button>
    <div v-show="isDesktop || expanded" class="version-footer__structure">
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
      <a v-for="v in versions" :key="v.link" :href="href(v.link)">
        {{ v.text }}<small v-if="v.note">（{{ v.note }}）</small>
      </a>
      <a :href="href(isEn ? '/en/' : '/archive/')" class="version-footer__more">{{ isEn ? 'English documentation' : '過去バージョンについて' }}</a>
    </div>
    <div class="version-footer__legal">
      <span>© 2020–2026 Project Sprint Org and contributors.</span>
      <span>Text licensed under <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Site code licensed under <a href="https://github.com/ProjectSprintOrg/projectsprint.org/blob/main/LICENSE-CODE.md">MIT</a>. · <a :href="href('/community/colophon')">About this site</a></span>
      <span>Originated and supported by <a href="https://copilot.jp/" target="_blank" rel="noopener">COPILOT Inc.</a></span>
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
.version-footer__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.version-footer__chevron { display: inline-block; font-size: 20px; line-height: 1; transition: transform .2s; }
.version-footer__chevron.is-open { transform: rotate(90deg); }
@media (max-width: 767px) {
  .version-footer__structure { margin-top: 8px; }
  .version-footer__versions { margin-top: 16px; }
  .version-footer__more { margin-left: 0; flex-basis: 100%; }
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
.version-footer__legal {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 20px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.version-footer__legal a { color: var(--vp-c-text-3); text-decoration: underline; }
.version-footer__legal a:hover { color: var(--vp-c-brand-1); }
.version-footer__versions small { color: var(--vp-c-text-3); font-size: 12px; }
.version-footer__more { margin-left: auto; }
</style>
