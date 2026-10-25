import type { HtmlTagObject, LoadContext, Plugin } from '@docusaurus/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import privatusPlugin, { headTags, validateOptions } from '../src/index.js'

const context = { siteDir: '/site', baseUrl: '/' } as unknown as LoadContext

afterEach(() => vi.unstubAllEnvs())

describe('docusaurus-plugin-privatus', () => {
  it('is a Docusaurus plugin that adds the script in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const plugin: Plugin = privatusPlugin(context, { siteId: 'pa_DOCS' })
    expect(plugin.name).toBe('docusaurus-plugin-privatus')
    const result = plugin.injectHtmlTags!({ content: undefined })
    const tags = (result as { headTags: HtmlTagObject[] }).headTags
    expect(tags).toEqual([
      { tagName: 'script', attributes: { defer: true, src: 'https://privatusstats.com/js/pa.js', 'data-site': 'pa_DOCS' } },
    ])
  })

  it('adds nothing during docusaurus start (development)', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(privatusPlugin(context, { siteId: 'pa_DOCS' }).injectHtmlTags()).toEqual({})
  })

  it('adds nothing without a site id, and reads PRIVATUS_SITE_ID', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(headTags({})).toEqual([])
    vi.stubEnv('PRIVATUS_SITE_ID', 'pa_ENV')
    expect(headTags({})[0].attributes!['data-site']).toBe('pa_ENV')
  })

  it('page props and the queue stub become inline scripts before the tracker', () => {
    const tags = headTags({ siteId: 'pa_DOCS', enabled: true, props: { section: 'docs' }, queueStub: true, nonce: 'n1', modules: ['engage', 'auto'], spa: 'history' })
    expect(tags).toHaveLength(3)
    expect(tags[0]).toEqual({ tagName: 'script', attributes: { nonce: 'n1' }, innerHTML: expect.stringContaining("window.privatus=window.privatus||{q:[]}") })
    expect(tags[1].innerHTML).toBe('window.privatusPageProps=function(){return {"section":"docs"}}')
    expect(tags[2].attributes).toMatchObject({ 'data-props': 'privatusPageProps', 'data-modules': 'engage,auto', 'data-spa': 'history', nonce: 'n1' })
  })

  it('validateOptions accepts good options and rejects typos', () => {
    expect(validateOptions({ options: { siteId: 'pa_DOCS', id: 'default', modules: ['engage'] } })).toEqual({ siteId: 'pa_DOCS', id: 'default', modules: ['engage'] })
    expect(() => validateOptions({ options: { siteID: 'pa_DOCS' } })).toThrow('unknown option "siteID"')
    expect(() => validateOptions({ options: { spa: 'yes' } })).toThrow('"spa" must be')
    expect(() => validateOptions({ options: { enabled: 'true' } })).toThrow('"enabled" must be true or false')
    expect(() => validateOptions({ options: { props: ['plan'] } })).toThrow('"props" must be an object')
  })
})
