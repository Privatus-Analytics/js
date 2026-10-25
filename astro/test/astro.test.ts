import { describe, expect, it } from 'vitest'
import privatus, { track } from '../src/index.js'

describe('@privatus-analytics/astro', () => {
  it('injects a head-inline loader that adds pa.js once', () => {
    const integration = privatus({ site: 'pa_astro', modules: ['engage', 'vitals'] })
    expect(integration.name).toBe('@privatus-analytics/astro')
    const injected: [string, string][] = []
    integration.hooks['astro:config:setup']({ injectScript: (stage, content) => injected.push([stage, content]) })
    expect(injected).toHaveLength(1)
    expect(injected[0][0]).toBe('head-inline')
    new Function(injected[0][1])()
    new Function(injected[0][1])()
    const scripts = document.querySelectorAll('script[data-site="pa_astro"]')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('data-modules')).toBe('engage,vitals')
    track('clicked')
    expect((window as any).privatus.q).toEqual([['track', ['clicked', {}]]])
  })
})
