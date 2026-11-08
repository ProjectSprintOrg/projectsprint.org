<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useData } from 'vitepress'

/**
 * 日本語にしかないページで English に切り替えたときの注記。
 * 言語メニューは /en/?from=/community/ のように元のページを付けて英語トップへ飛ばすので、
 * from を読んで 1 回だけ表示し、元の日本語ページへのリンクを添える。
 * 表示したらクエリは URL から消す（再読み込みでは出ない）。
 */
const route = useRoute()
const { site, localeIndex } = useData()
const base = site.value.base.replace(/\/$/, '')
const from = ref('')

// サイト内のパスだけを受け付ける（//example.com のような外部 URL や javascript: は弾く）
const SAFE_PATH = /^\/(?!\/)[\w\-./%]*$/

function read() {
  const q = new URLSearchParams(location.search).get('from')
  if (!q || localeIndex.value !== 'en' || !SAFE_PATH.test(q) || q.startsWith('/en/')) {
    from.value = ''
    return
  }
  from.value = q
  const url = new URL(location.href)
  url.searchParams.delete('from')
  history.replaceState(history.state, '', url.pathname + url.search + url.hash)
}

onMounted(() => {
  read()
  watch(() => route.path, read)
})
</script>

<template>
  <div v-if="from" class="ja-only-notice" role="status">
    <strong>The page you were reading is available in Japanese only.</strong>
    You were reading <code>{{ from }}</code>, which has no English version yet.
    This page lists what exists in English.
    <a :href="`${base}${from}`" lang="ja">Open the Japanese page</a>
  </div>
</template>

<style scoped>
.ja-only-notice {
  margin-bottom: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-tip-2, var(--vp-c-brand-2));
  background: var(--vp-c-tip-soft, var(--vp-c-brand-soft));
  font-size: 14px;
  line-height: 1.7;
}
.ja-only-notice a { margin-left: 2px; font-weight: 500; color: var(--vp-c-brand-1); text-decoration: underline; text-underline-offset: 2px; }
.ja-only-notice code { font-size: 13px; }
</style>
