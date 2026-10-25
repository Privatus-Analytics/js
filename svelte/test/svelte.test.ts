import { afterEach, describe, expect, it } from 'vitest'
import { initPrivatus, privatus, privatusHandle } from '../src/index.js'

afterEach(() => {
  document.head.innerHTML = ''
  delete (window as any).privatus
})

describe('@privatus-analytics/svelte', () => {
  it('action tracks on click, updates and cleans up', () => {
    initPrivatus({ site: 'pa_s' })
    expect(document.querySelectorAll('script[data-site="pa_s"]')).toHaveLength(1)
    const button = document.createElement('button')
    const action = privatus(button, { name: 'a', props: { x: 1 } })
    button.click()
    action.update({ name: 'b', on: 'focus' })
    button.click()
    button.dispatchEvent(new Event('focus'))
    action.destroy()
    button.dispatchEvent(new Event('focus'))
    expect((window as any).privatus.q).toEqual([
      ['track', ['a', { x: 1 }]],
      ['track', ['b', {}]],
    ])
  })

  it('handle hook injects the script into <head>', async () => {
    const handle = privatusHandle({ site: 'pa_s', api: 'https://privatusanalytics.test' })
    let transformed = ''
    await handle({
      event: {},
      resolve: async (_event, opts) => {
        transformed = (await opts!.transformPageChunk!({
          html: '<html><head><title>x</title></head><body></body></html>',
          done: true,
        }))!
        return new Response(transformed)
      },
    })
    expect(transformed).toBe(
      '<html><head><title>x</title><script src="https://privatusanalytics.test/js/pa.js" defer data-site="pa_s" data-api="https://privatusanalytics.test"></script></head><body></body></html>',
    )
  })
})
