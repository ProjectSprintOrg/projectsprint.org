import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ArchiveNotice from './ArchiveNotice.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => h(ArchiveNotice)
    })
  }
}
