import DefaultTheme from 'vitepress/theme'
import HomeToc from './HomeToc.vue'
import Lightbox from './Lightbox.vue'
import Comment from './Comment.vue'
import { h } from 'vue'
import { useRoute } from 'vitepress'
import type { Theme } from 'vitepress'

export default {
  extends: DefaultTheme,
  Layout() {
    const route = useRoute()
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(Lightbox),
      'doc-after': () => route.path !== '/' ? h(Comment) : null,
    })
  },
  enhanceApp({ app }) {
    app.component('HomeToc', HomeToc)
  },
} satisfies Theme
