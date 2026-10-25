import { readFileSync } from 'node:fs'
import Joi from 'joi'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, Fragment, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QUEUE_STUB } from '@privatus-analytics/html-core'
import { pluginOptionsSchema } from '../src/gatsby-node.js'
import { headComponents, onRenderBody, type PrivatusGatsbyOptions } from '../src/gatsby-ssr.js'

afterEach(() => vi.unstubAllEnvs())

function render(options: PrivatusGatsbyOptions): string | null {
  let head: ReactNode[] | null = null
  onRenderBody({ setHeadComponents: (components) => (head = components), pathname: '/' }, { plugins: [], ...options })
  return head ? renderToStaticMarkup(createElement(Fragment, null, ...(head as ReactNode[]))) : null
}

describe('gatsby-plugin-privatus onRenderBody', () => {
  it('adds the script to the head in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(render({ siteId: 'pa_GATSBY' })).toBe(
      '<script defer="" src="https://privatusstats.com/js/pa.js" data-site="pa_GATSBY"></script>',
    )
  })

  it('adds nothing in gatsby develop or without a site id', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(render({ siteId: 'pa_GATSBY' })).toBeNull()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(render({})).toBeNull()
  })

  it('page props, the queue stub and options become safe scripts', () => {
    const html = render({ siteId: 'pa_GATSBY', enabled: true, props: { plan: '</script>' }, queueStub: true, nonce: 'n1', excludedPaths: ['/admin/*'] })!
    const parts = html.split('</script>')
    expect(parts[0]).toMatch(/^<script nonce="n1">window\.privatus=window\.privatus\|\|\{q:\[\]\}/)
    expect(parts[1]).toBe('<script nonce="n1">window.privatusPageProps=function(){return {"plan":"\\u003c/script\\u003e"}}')
    expect(parts[2]).toContain('data-exclude="/admin/*"')
    expect(parts[2]).toContain('data-props="privatusPageProps"')
    expect(parts).toHaveLength(4)
  })
})

describe('when the tag is off', () => {
  it('adds only the queue stub (when it is on), never the tracker or page props', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(render({ siteId: 'pa_GATSBY', queueStub: true, props: { plan: 'pro' } })).toBe(`<script>${QUEUE_STUB}</script>`)
    expect(render({ siteId: 'pa_GATSBY', props: { plan: 'pro' } })).toBeNull()
    vi.stubEnv('NODE_ENV', 'production')
    expect(render({ siteId: 'pa_GATSBY', enabled: false, queueStub: true, nonce: 'n1' })).toBe(`<script nonce="n1">${QUEUE_STUB}</script>`)
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(render({ queueStub: true })).toBe(`<script>${QUEUE_STUB}</script>`)
  })
})

describe('when the tag is off, on every page', () => {
  const count = (html: string, part: string) => html.split(part).length - 1

  it('onRenderBody adds exactly one stub and nothing else, with or without a nonce', () => {
    vi.stubEnv('NODE_ENV', 'development')
    for (const pathname of ['/', '/docs/', '/404/']) {
      let head: ReactNode[] = []
      onRenderBody({ setHeadComponents: (c) => (head = c), pathname }, { plugins: [], siteId: 'pa_GATSBY', queueStub: true, props: { plan: 'pro' } })
      const html = renderToStaticMarkup(createElement(Fragment, null, ...head))
      expect(count(html, 'window.privatus=window.privatus'), pathname).toBe(1)
      expect(html, pathname).not.toContain('pa.js')
      expect(html, pathname).not.toContain('privatusPageProps')
    }
  })

  it('onRenderBody adds nothing with the queue stub off', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(render({ siteId: 'pa_GATSBY', enabled: false, props: { plan: 'pro' } })).toBeNull()
  })

  it('a page that also uses headComponents (the README swap) still gets one stub', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const options = { siteId: 'pa_GATSBY', queueStub: true }
    let head: ReactNode[] = []
    onRenderBody({ setHeadComponents: (c) => (head = [...head, ...c]), pathname: '/docs/' }, { plugins: [], ...options })
    // The README's onPreRenderHTML: drop the plugin's scripts, add headComponents(...) instead.
    const ours = (c: any) => typeof c?.key === 'string' && c.key.startsWith('privatus-analytics-')
    const swapped = [...head.filter((c) => !ours(c)), ...headComponents({ ...options, props: { site: 'docs' } })]
    const html = renderToStaticMarkup(createElement(Fragment, null, ...swapped))
    expect(count(html, 'window.privatus=window.privatus')).toBe(1)
    expect(html).not.toContain('pa.js')
  })
})

describe('pluginOptionsSchema', () => {
  const schema = pluginOptionsSchema({ Joi }) as Joi.ObjectSchema

  it('accepts good options', () => {
    expect(schema.validate({ siteId: 'pa_GATSBY', modules: ['engage'], spa: 'hash', props: { plan: 'pro' } }).error).toBeUndefined()
  })

  it('rejects typos and bad values', () => {
    expect(schema.validate({ siteID: 'pa_GATSBY' }).error?.message).toContain('"siteID" is not allowed')
    expect(schema.validate({ spa: 'yes' }).error?.message).toContain('"spa" must be one of')
  })
})

describe('the files Gatsby loads', () => {
  // Gatsby finds a plugin's gatsby-ssr.js APIs by reading the file (it parses it and
  // looks for named exports), not by running it. A file that only does
  // `module.exports = require(...)` names no API, so Gatsby never calls onRenderBody.
  const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

  it('gatsby-ssr.js names onRenderBody as an export Gatsby can see without running it', () => {
    expect(read('gatsby-ssr.js')).toMatch(/^exports\.onRenderBody = /m)
  })

  it('gatsby-node.js names pluginOptionsSchema the same way', () => {
    expect(read('gatsby-node.js')).toMatch(/^exports\.pluginOptionsSchema = /m)
  })
})
