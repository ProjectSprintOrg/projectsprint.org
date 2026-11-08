<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'

/**
 * 賢い 404 ページ。
 * 転送表に無い旧 URL でも、パスの形から新サイトの候補を推測し、実在するものがあればそこへ転送する。
 * 候補が無ければ、主要な入口と「このパスを報告する」リンクを示す。
 */
const { site } = useData()
const base = site.value.base.replace(/\/$/, '')
const path = ref('')
const checking = ref(true)
const isEn = ref(false)

const LATEST: Record<string, string> = { '4': 'v4.3', '3': 'v3.3', '2': 'v2.2', '1': 'v2.2', '0': 'v2.2' }

function candidates(p: string): string[] {
  p = p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '')
  const out: string[] = []
  const push = (...xs: string[]) => xs.forEach(x => { if (!out.includes(x)) out.push(x) })

  // ja/v4.1/framework, ja/v3/ja-v3.1/tutorial/..., ja-v3.0.0/..., ja/v4.0-alpha/..., readme/ja/v4.0
  const m = p.match(/^(?:readme\/)?(ja|en)(?:\/v\d)?[\/-](?:ja-|en-)?v(\d)\.(\d)(?:\.\d)?(?:-alpha)?(?:\/(.*))?$/)
  if (m) {
    const [, lang, major, , rest] = m
    const root = lang === 'en' ? '/en/archive/v2.0/' : `/archive/${LATEST[major] ?? 'v' + major}/`
    if (rest) {
      push(root + rest, root + rest + '/')
      if (major === '3' && /^(theories|practices)$/.test(rest)) push(root + 'theories_and_practices')
      const section = rest.split('/')[0]
      if (section !== rest) push(root + section + '/')
    }
    push(root)
    return out
  }
  // /archive/v2.0/...（En v2.0 で標準の言語切り替えを使うと飛んでくる）は、内容の対応する日本語 v2.2 へ
  const v2 = p.match(/^archive\/v2\.0(?:\/(.*))?$/)
  if (v2) {
    const rest = v2[1]
    if (rest) {
      push('/archive/v2.2/' + rest, '/archive/v2.2/' + rest + '/')
      const section = rest.split('/')[0]
      if (section !== rest) push('/archive/v2.2/' + section + '/')
    }
    push('/archive/v2.2/')
    return out
  }
  // 最新版の構成を指す URL（/code/..., /practical-guide/..., /en/code/...）は目次へ
  const s = p.match(/^(en\/)?(code|practical-guide|community|archive)(?:\/(.*))?$/)
  if (s) { push(`/${s[1] ?? ''}${s[2]}/`); return out }
  if (/^en(\/|$)/.test(p)) push('/en/')
  return out
}

// /en/<path> が無くても日本語の /<path> があるなら、英語トップへ飛ばして「日本語のみ」と案内する
// （JapaneseOnlyNotice が from を読んで注記を出す）。言語メニューのルール 2 と同じ着地。
async function japaneseOnly(rel: string): Promise<string | null> {
  const m = rel.match(/^en\/(.+)$/)
  if (!m || /^en(\/|$)/.test(m[1])) return null
  const ja = '/' + m[1].replace(/\.html$/, '').replace(/\/index$/, '/')
  try {
    const res = await fetch(base + ja, { method: 'HEAD' })
    if (!res.ok) return null
    // 転送（/community → /community/ など）があれば、最終的な URL を元のページとして使う
    const final = new URL(res.url || location.origin + base + ja).pathname
    return final.startsWith(base + '/') ? final.slice(base.length) : ja
  } catch {
    return null
  }
}

onMounted(async () => {
  const full = decodeURIComponent(location.pathname)
  const rel = full.startsWith(base + '/') ? full.slice(base.length + 1) : full.replace(/^\//, '')
  path.value = '/' + rel
  isEn.value = rel.startsWith('en/') || rel.startsWith('en-')
  const ja = await japaneseOnly(rel)
  if (ja) { location.replace(`${base}/en/?from=${encodeURIComponent(ja).replace(/%2F/g, '/')}`); return }
  for (const c of candidates(rel)) {
    try {
      const res = await fetch(base + c, { method: 'HEAD' })
      if (res.ok) { location.replace(base + c + location.hash); return }
    } catch {}
  }
  checking.value = false
})

// broken-link.yml の Issue テンプレートを開き、タイトルと URL 欄を埋めておく
const issueUrl = () =>
  `https://github.com/ProjectSprintOrg/projectsprint.org/issues/new?template=broken-link.yml&title=${encodeURIComponent('リンク切れ: ' + path.value)}&url=${encodeURIComponent(location.href)}`
</script>

<template>
  <div class="nf">
    <template v-if="checking">
      <p class="nf__code">404</p>
      <p class="nf__lead">{{ isEn ? 'Looking for the page…' : 'ページを探しています…' }}</p>
    </template>
    <template v-else-if="isEn">
      <p class="nf__code">404</p>
      <h1 class="nf__title">Page not found</h1>
      <p class="nf__path"><code>{{ path }}</code></p>
      <p>This page may have moved when the site was rebuilt. Try one of these:</p>
      <ul class="nf__links">
        <li><a :href="`${base}/en/code/`">CODE v5.0 (English)</a></li>
        <li><a :href="`${base}/en/archive/v2.0/`">Archived English version (v2.0)</a></li>
        <li><a :href="`${base}/`">Home (Japanese)</a></li>
      </ul>
      <p class="nf__report"><a :href="issueUrl()" target="_blank" rel="noopener">Report this broken link</a></p>
    </template>
    <template v-else>
      <p class="nf__code">404</p>
      <h1 class="nf__title">ページが見つかりません</h1>
      <p class="nf__path"><code>{{ path }}</code></p>
      <p>サイトの作り直しに伴って移動したページかもしれません。次のいずれかからお探しください。</p>
      <ul class="nf__links">
        <li><a :href="`${base}/code/`">CODE v5.0（最新版）</a></li>
        <li><a :href="`${base}/practical-guide/`">Practical Guide</a></li>
        <li><a :href="`${base}/archive/`">過去バージョン（v4.3 / v3.3 / v2.2）</a></li>
        <li><a :href="`${base}/releases`">Release Notes</a></li>
        <li><a :href="`${base}/`">ホーム</a></li>
      </ul>
      <p class="nf__hint">右上の検索から、ページ名や用語でも探せます。</p>
      <p class="nf__report"><a :href="issueUrl()" target="_blank" rel="noopener">このリンク切れを報告する</a></p>
    </template>
  </div>
</template>

<style scoped>
.nf { max-width: 640px; margin: 0 auto; padding: 64px 24px 96px; text-align: center; }
.nf__code { font-size: 64px; font-weight: 600; line-height: 1; color: var(--vp-c-brand-1); margin: 0 0 8px; }
.nf__title { font-size: 22px; font-weight: 600; margin: 0 0 12px; }
.nf__lead { color: var(--vp-c-text-2); }
.nf__path { margin: 0 0 20px; color: var(--vp-c-text-2); word-break: break-all; }
.nf__links { list-style: none; margin: 16px 0; padding: 0; }
.nf__links li { margin: 6px 0; }
.nf__links a { color: var(--vp-c-brand-1); font-weight: 500; }
.nf__hint { font-size: 14px; color: var(--vp-c-text-2); }
.nf__report { margin-top: 24px; font-size: 14px; }
.nf__report a { color: var(--vp-c-text-2); text-decoration: underline; }
</style>
