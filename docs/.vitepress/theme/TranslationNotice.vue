<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { frontmatter, site } = useData()
const base = site.value.base.replace(/\/$/, '')
const t = computed(() => frontmatter.value.translation as
  | { source: string; sourceDate?: string; outdated?: boolean }
  | undefined)
</script>

<template>
  <div v-if="t" class="translation-notice">
    <p>
      <strong>AI-assisted translation.</strong>
      This page was translated from the Japanese original (CODE v5.0) with the help of AI and reviewed by the Project Sprint community.
      The <a :href="`${base}${t.source}`">Japanese text</a> is the authoritative version.
      If a passage reads wrongly, use "Edit this page on GitHub" below or
      <a href="https://github.com/ProjectSprintOrg/projectsprint.org/issues/new" target="_blank" rel="noopener">open an issue</a>.
    </p>
    <p v-if="t.outdated" class="translation-notice__outdated">
      <strong>The Japanese original was updated on {{ t.sourceDate }}</strong>, after this translation was last revised. This page may be behind the original.
    </p>
  </div>
</template>

<style scoped>
.translation-notice {
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  font-size: 14px;
  line-height: 1.7;
}
.translation-notice p { margin: 0; }
.translation-notice__outdated {
  margin-top: 8px !important;
  padding-top: 8px;
  border-top: 1px dashed var(--vp-c-divider);
  color: var(--vp-c-warning-1);
}
</style>
