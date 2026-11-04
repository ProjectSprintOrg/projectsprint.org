<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { site } = useData()
const base = site.value.base.replace(/\/$/, '')

const info = computed(() => {
  const p = route.path.replace(base, '')
  const m = p.match(/^(\/(?:en\/)?archive\/(v[\d.]+)\/)/)
  if (!m) return null
  return { root: m[1], version: m[2], en: p.startsWith('/en/'), isIndex: p === m[1] }
})
</script>

<template>
  <div v-if="info" class="archive-notice">
    <template v-if="info.en">
      <strong>Archived version ({{ info.version }}).</strong>
      This page is kept for reference and is no longer updated.
      <a v-if="!info.isIndex" :href="`${base}${info.root}`">Contents of {{ info.version }}</a>
      <span v-if="!info.isIndex"> · </span>
      <a :href="`${base}/code/`">Current version (CODE v5.0, Japanese)</a>
    </template>
    <template v-else>
      <strong>アーカイブ版（{{ info.version }}）です。</strong>
      参照用に残しているページで、更新されません。
      <a v-if="!info.isIndex" :href="`${base}${info.root}`">{{ info.version }} の目次</a>
      <span v-if="!info.isIndex"> · </span>
      <a :href="`${base}/code/`">最新版（CODE v5.0）</a>
    </template>
  </div>
</template>

<style scoped>
.archive-notice {
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-warning-2);
  background: var(--vp-c-warning-soft);
  font-size: 14px;
  line-height: 1.7;
}
.archive-notice a { margin-left: 2px; }
</style>
