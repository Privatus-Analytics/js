import { describe, expect, it } from 'vitest'
import privatusModule, { applyToNuxtOptions, headScript, resolveSite } from '../src/index.js'
import { usePrivatus } from '../src/runtime.js'

describe('@privatus-analytics/nuxt', () => {
  it('builds the head script entry', () => {
    expect(headScript({ site: 'pa_n', spa: 'history', namespace: 'pa' })).toEqual({
      src: 'https://privatusstats.com/js/pa.js',
      defer: true,
      tagPosition: 'head',
      'data-site': 'pa_n',
      'data-spa': 'history',
      'data-namespace': 'pa',
    })
  })

  it('adds the script to nuxt options once', () => {
    const nuxtOptions = { app: { head: { script: [{ src: '/other.js' }] as unknown[] } } }
    applyToNuxtOptions(nuxtOptions, { site: 'pa_n' })
    applyToNuxtOptions(nuxtOptions, { site: 'pa_n' })
    expect(nuxtOptions.app.head.script).toHaveLength(2)
    expect((nuxtOptions.app.head.script[1] as any)['data-site']).toBe('pa_n')
  })

  it('resolves the site from options or env', () => {
    expect(resolveSite({ site: 'a' }, {})).toBe('a')
    expect(resolveSite({}, { NUXT_PUBLIC_PRIVATUS_SITE: 'b' })).toBe('b')
    expect(resolveSite({}, {})).toBeUndefined()
  })

  it('is a Nuxt module with the privatus config key', async () => {
    const meta = await privatusModule.getMeta!()
    expect(meta).toMatchObject({ name: '@privatus-analytics/nuxt', configKey: 'privatus' })
  })

  it('usePrivatus returns the tracker client', () => {
    const client = usePrivatus()
    client.track('x')
    expect((window as any).privatus.q).toEqual([['track', ['x', {}]]])
  })
})
