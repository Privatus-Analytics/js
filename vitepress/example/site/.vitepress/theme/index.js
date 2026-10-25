// A bare theme: just the page content, so the example has as little as possible in it.
import { h } from 'vue'
import { Content } from 'vitepress'

export default {
  Layout: () => h('main', [h(Content)]),
}
