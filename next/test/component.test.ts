import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivatusAnalytics, resolveOptions, usePrivatus } from '../src/index.js'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  document.head.innerHTML = ''
  delete (window as any).privatus
})

describe('<PrivatusAnalytics />', () => {
  it('loads pa.js from privatusstats.com', async () => {
    let client: ReturnType<typeof usePrivatus> | undefined
    function Probe() {
      client = usePrivatus()
      return null
    }
    const root = createRoot(document.createElement('div'))
    await act(async () => {
      root.render(createElement('div', null, createElement(PrivatusAnalytics, { site: 'pa_1' }), createElement(Probe)))
    })
    const script = document.querySelector('script[data-site="pa_1"]')!
    expect(script.getAttribute('src')).toBe('https://privatusstats.com/js/pa.js')
    expect(script.hasAttribute('data-api')).toBe(false)
    client!.track('x')
    expect((window as any).privatus.q).toEqual([['track', ['x', {}]]])
    await act(async () => root.unmount())
  })

  it('passes tracker options through unchanged', () => {
    expect(resolveOptions({ site: 'a' })).toEqual({ site: 'a' })
    expect(resolveOptions({ site: 'a', spa: 'hash' })).toEqual({ site: 'a', spa: 'hash' })
  })
})
