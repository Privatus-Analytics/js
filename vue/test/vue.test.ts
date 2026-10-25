import { afterEach, describe, expect, it } from 'vitest'
import { createApp, defineComponent, h, nextTick, resolveDirective, withDirectives } from 'vue'
import { createPrivatus, usePrivatus } from '../src/index.js'

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete (window as any).privatus
})

describe('@privatus-analytics/vue', () => {
  it('installs the tracker, provides the client and tracks via the directive', async () => {
    let fromHook: ReturnType<typeof usePrivatus> | undefined
    const App = defineComponent({
      setup() {
        fromHook = usePrivatus()
        return () =>
          withDirectives(h('button', { id: 'b' }, 'Go'), [
            [resolveDirective('privatus-event')!, { name: 'signup', props: { plan: 'pro' } }],
          ])
      },
    })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const plugin = createPrivatus({ site: 'pa_vue', manual: true })
    const app = createApp(App).use(plugin)
    app.mount(el)
    await nextTick()
    const script = document.querySelector('script[data-site="pa_vue"]')!
    expect(script.getAttribute('data-manual')).toBe('true')
    expect(fromHook).toBe(plugin.client)
    expect(app.config.globalProperties.$privatus).toBe(plugin.client)
    ;(document.getElementById('b') as HTMLButtonElement).click()
    fromHook!.pageview()
    expect((window as any).privatus.q).toEqual([
      ['track', ['signup', { plan: 'pro' }]],
      ['pageview', []],
    ])
    app.unmount()
  })
})
