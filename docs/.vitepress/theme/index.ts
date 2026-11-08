import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ArchiveNotice from './ArchiveNotice.vue'
import VersionFooter from './VersionFooter.vue'
import TranslationNotice from './TranslationNotice.vue'
import NotFound from './NotFound.vue'
import JapaneseOnlyNotice from './JapaneseOnlyNotice.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => [h(JapaneseOnlyNotice), h(ArchiveNotice), h(TranslationNotice)],
      // 英語トップをホームレイアウトにした場合にも注記が出るように
      'home-hero-before': () => h(JapaneseOnlyNotice),
      'doc-after': () => h(VersionFooter),
      'not-found': () => h(NotFound)
    })
  }
}
