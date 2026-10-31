<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useData } from 'vitepress'

const route = useRoute()
const { site } = useData()
const base = site.value.base.replace(/\/$/, '')

const info = computed(() => {
  const p = route.path.replace(base, '')
  const m = p.match(/^\/(?:en\/)?archive\/(v[\d.]+)\//)
  if (!m) return null
  return { version: m[1], en: p.startsWith('/en/') }
})
</script>

<template>
  <div v-if="info" class="archive-notice">
    <template v-if="info.en">
      <strong>Archived version ({{ info.version }}).</strong>
      This page is kept for reference and is no longer updated. The current version is in Japanese:
      <a :href="`${base}/code/`">CODE v5.0</a>.
    </template>
    <template v-else>
      <strong>アーカイブ版（{{ info.version }}）です。</strong>
      このページは参照用に残しているもので、更新されません。最新版は
      <a :href="`${base}/code/`">CODE v5.0</a> をご覧ください。
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
</style>
