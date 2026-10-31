<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { site, page } = useData()
const base = site.value.base.replace(/\/$/, '')

const SECTIONS: Record<string, { label: string; chapters: { text: string; link: string }[] }> = {
  '/code/': {
    label: 'CODE v5.0',
    chapters: [
      { text: 'Introduction', link: '/code/introduction' },
      { text: 'Step0', link: '/code/step0' },
      { text: 'Step1', link: '/code/step1' },
      { text: 'Key Terms', link: '/code/keyterms' }
    ]
  },
  '/practical-guide/': {
    label: 'Practical Guide',
    chapters: [
      { text: 'Minimum Guide', link: '/practical-guide/minimum_guide' },
      { text: 'ジョブとアクション', link: '/practical-guide/job_and_action' },
      { text: 'フラッグの要素', link: '/practical-guide/elements_of_flag' }
    ]
  }
}

const current = computed(() => route.path.replace(base, '').replace(/\.html$/, ''))
const section = computed(() => {
  const key = Object.keys(SECTIONS).find(k => current.value.startsWith(k))
  return key ? { key, ...SECTIONS[key] } : null
})
// 章のページ本文に h2 / h3 が 4 つ以上あれば、冒頭に折りたたみの目次を出す
type H = { level: number; title: string; slug: string; children?: H[] }
const flatten = (hs: H[]): H[] => hs.flatMap(h => [h, ...flatten(h.children ?? [])])
const toc = computed(() => {
  if (!section.value || current.value === section.value.key) return []
  return flatten((page.value.headers ?? []) as H[]).filter(h => h.level <= 3)
})
</script>

<template>
  <nav v-if="section" class="chapter-nav" aria-label="章">
    <a class="chapter-nav__section" :href="`${base}${section.key}`">{{ section.label }}</a>
    <ol class="chapter-nav__list">
      <li v-for="c in section.chapters" :key="c.link">
        <a :href="`${base}${c.link}`" :class="{ 'is-current': current === c.link }" :aria-current="current === c.link ? 'page' : undefined">{{ c.text }}</a>
      </li>
    </ol>
  </nav>
  <details v-if="toc.length >= 4" class="chapter-toc">
    <summary>この章の内容</summary>
    <ul>
      <li v-for="h in toc" :key="h.slug" :class="`lv${h.level}`"><a :href="`#${h.slug}`">{{ h.title }}</a></li>
    </ul>
  </details>
</template>

<style scoped>
.chapter-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  margin-bottom: 28px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 14px;
}
.chapter-nav__section {
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-decoration: none;
}
.chapter-nav__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: ch;
}
.chapter-nav__list li { counter-increment: ch; }
.chapter-nav__list a {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 14px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  line-height: 1.5;
}
.chapter-nav__list a::before { content: counter(ch) ". "; opacity: .6; }
.chapter-nav__list a:hover { background: var(--vp-c-default-soft); color: var(--vp-c-text-1); }
.chapter-nav__list a.is-current { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 600; }
.chapter-toc {
  margin: 0 0 28px;
  padding: 10px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-size: 14px;
}
.chapter-toc summary { cursor: pointer; font-weight: 600; color: var(--vp-c-text-2); }
.chapter-toc ul { margin: 8px 0 4px; padding-left: 4px; list-style: none; }
.chapter-toc li { line-height: 1.9; }
.chapter-toc li.lv3 { padding-left: 1.4em; }
.chapter-toc a { color: var(--vp-c-text-1); text-decoration: none; }
.chapter-toc a:hover { color: var(--vp-c-brand-1); }
</style>
