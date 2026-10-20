// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as privatus from '../src/index.js'

describe('SSR (no window/document)', () => {
  it('every browser function is a no-op', async () => {
    expect(typeof window).toBe('undefined')
    const client = privatus.init({ site: 'pa_1' })
    expect(client.isLoaded()).toBe(false)
    expect(() => {
      privatus.track('x', { a: 1 })
      privatus.pageview()
      privatus.props({ a: 1 })
      privatus.optOut()
      privatus.optIn()
      privatus.ready(() => {})
    }).not.toThrow()
    await expect(privatus.trackAsync('x')).resolves.toBeUndefined()
    expect(privatus.isOptedOut()).toBe(false)
    expect(privatus.hasTrackerScript()).toBe(false)
  })

  it('scriptAttributes / renderScriptTag work on the server', () => {
    expect(privatus.renderScriptTag({ site: 'pa_1', manual: true })).toContain('data-manual="true"')
  })
})
