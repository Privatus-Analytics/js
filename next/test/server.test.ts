// @vitest-environment node
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PrivatusAnalyticsTag, QUEUE_STUB, clickData, eventData, type PrivatusAnalyticsTagProps } from '../src/server.js'

const SNIPPET = '<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'

afterEach(() => vi.unstubAllEnvs())

function render(props: PrivatusAnalyticsTagProps): string {
  vi.stubEnv('PRIVATUS_SCRIPT_HOST', '')
  return renderToStaticMarkup(createElement(PrivatusAnalyticsTag, props))
}

describe('<PrivatusAnalyticsTag />', () => {
  it('prints the tag in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(render({ siteId: 'pa_TEST123456' })).toBe(SNIPPET)
  })

  it('prints nothing outside production by default, or without a site id', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(render({ siteId: 'pa_TEST123456' })).toBe('')
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(render({ enabled: true })).toBe('')
  })

  it('enabled forces it on, and reads the site id and host from the environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('PRIVATUS_SITE_ID', 'pa_ENV')
    vi.stubEnv('PRIVATUS_SCRIPT_HOST', 'https://cdn.example.com/')
    expect(renderToStaticMarkup(createElement(PrivatusAnalyticsTag, { enabled: true }))).toBe(
      '<script defer="" src="https://cdn.example.com/js/pa.js" data-site="pa_ENV"></script>',
    )
  })

  it('prints the queue stub and page props first, all with the nonce, and the tracker options', () => {
    const html = render({ siteId: 'pa_TEST123456', enabled: true, queueStub: true, nonce: 'n1', props: { plan: 'pro', seats: 3 }, modules: ['engage', 'auto'], spa: 'history' })
    const parts = html.split('</script>')
    expect(parts[0]).toBe(`<script nonce="n1">${QUEUE_STUB}`)
    expect(parts[1]).toBe('<script nonce="n1">window.privatusPageProps=function(){return {"plan":"pro","seats":3}}')
    expect(parts[2]).toBe(
      '<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456" data-modules="engage,auto" data-spa="history" nonce="n1" data-props="privatusPageProps">',
    )
    expect(parts).toHaveLength(4)
  })

  it('keeps page props safe inside the script', () => {
    const html = render({ siteId: 'pa_TEST123456', enabled: true, props: { note: '</script><script>alert(1)</script>\u2028' } })
    expect(html).not.toContain('<script>alert(1)')
    expect(html).toContain('"note":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e\\u2028"')
  })

  it('when off with the queue stub on, prints only the stub, with the nonce', () => {
    expect(render({ siteId: 'pa_TEST123456', enabled: false, queueStub: true, nonce: 'n1', props: { plan: 'pro' } })).toBe(
      `<script nonce="n1">${QUEUE_STUB}</script>`,
    )
    vi.stubEnv('NODE_ENV', 'development')
    expect(render({ siteId: 'pa_TEST123456', queueStub: true, props: { plan: 'pro' } })).toBe(`<script>${QUEUE_STUB}</script>`)
  })

  it('when off with the queue stub off, prints nothing at all', () => {
    expect(render({ siteId: 'pa_TEST123456', enabled: false, nonce: 'n1', props: { plan: 'pro' } })).toBe('')
  })

  it('without a site id and the queue stub on, prints only the stub', () => {
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(render({ enabled: true, queueStub: true, props: { plan: 'pro' } })).toBe(`<script>${QUEUE_STUB}</script>`)
  })
})

describe('eventData and clickData', () => {
  it('give attributes to spread on an element, escaped by React', () => {
    expect(eventData('Report exported', { format: 'csv', 'Source Name': 'toolbar', gone: null })).toEqual({
      'data-privatus-event': 'Report exported',
      'data-privatus-prop-format': 'csv',
      'data-privatus-prop-source_name': 'toolbar',
    })
    const html = renderToStaticMarkup(
      createElement(Fragment, null, createElement('button', { type: 'button', ...eventData('Say "hi"', { note: '<b>&' }) }, 'Hi')),
    )
    expect(html).toBe('<button type="button" data-privatus-event="Say &quot;hi&quot;" data-privatus-prop-note="&lt;b&gt;&amp;">Hi</button>')
    expect(eventData('  ')).toEqual({})
  })

  it('clickData gives the name, or nothing and a warning outside production', () => {
    expect(clickData('pricing.cta')).toEqual({ 'data-privatus-click': 'pricing.cta' })
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(clickData('not ok')).toEqual({})
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"not ok" is not valid'))
    warn.mockRestore()
  })
})
