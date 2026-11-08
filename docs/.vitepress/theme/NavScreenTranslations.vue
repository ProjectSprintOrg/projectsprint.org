<script setup lang="ts">
// VitePress 標準の VPNavScreenTranslations（モバイルのメニュー内の言語切り替え）の差し替え。
// 見た目は標準と同じで、行き先だけページごとに計算した altLang を使う。
import { ref } from 'vue'
import VPLink from 'vitepress/dist/client/theme-default/components/VPLink.vue'
import { useAltLangLinks } from './altLang'

const { localeLinks, currentLang } = useAltLangLinks()
const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div
    v-if="localeLinks.length && currentLang.label"
    class="VPNavScreenTranslations"
    :class="{ open: isOpen }"
  >
    <button class="title" @click="toggle">
      <span class="vpi-languages icon lang" />
      {{ currentLang.label }}
      <span class="vpi-chevron-down icon chevron" />
    </button>

    <ul class="list">
      <li v-for="locale in localeLinks" :key="locale.link" class="item">
        <VPLink class="link" :href="locale.link">{{ locale.text }}</VPLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.VPNavScreenTranslations {
  height: 24px;
  overflow: hidden;
}

.VPNavScreenTranslations.open {
  height: auto;
}

.title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.icon {
  font-size: 16px;
}

.icon.lang {
  margin-right: 8px;
}

.icon.chevron {
  margin-left: 4px;
}

.list {
  padding: 4px 0 0 24px;
}

.link {
  line-height: 32px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}
</style>
