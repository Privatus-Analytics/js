import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { PrivatusAnalytics, usePrivatus } from '../src/index.js'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete (window as any).privatus
})

function Button() {
  const privatus = usePrivatus()
  return createElement('button', { onClick: () => privatus.track('clicked', { where: 'test' }) }, 'Go')
}

describe('@privatus-analytics/react', () => {
  it('injects the tracker once and queues events from the hook', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
      root.render(
        createElement('div', null, createElement(PrivatusAnalytics, { site: 'pa_1', spa: 'history' }), createElement(Button)),
      )
    })
    await act(async () => {
      root.render(
        createElement('div', null, createElement(PrivatusAnalytics, { site: 'pa_1', spa: 'history' }), createElement(Button)),
      )
    })
    const scripts = document.querySelectorAll('script[data-site="pa_1"]')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('data-spa')).toBe('history')
    await act(async () => {
      container.querySelector('button')!.click()
    })
    expect((window as any).privatus.q).toEqual([['track', ['clicked', { where: 'test' }]]])
    await act(async () => root.unmount())
  })

  it('renders nothing on the server', () => {
    expect(renderToString(createElement(PrivatusAnalytics, { site: 'pa_1' }))).toBe('')
  })
})
