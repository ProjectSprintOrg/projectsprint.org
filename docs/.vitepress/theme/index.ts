import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ArchiveNotice from './ArchiveNotice.vue'
import ChapterNav from './ChapterNav.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-before': () => [h(ArchiveNotice), h(ChapterNav)]
    })
  }
}
