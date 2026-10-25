import { readFileSync } from 'node:fs'
import Joi from 'joi'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement, Fragment, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QUEUE_STUB } from '@privatus-analytics/html-core'
import { pluginOptionsSchema } from '../src/gatsby-node.js'
import { onRenderBody, type PrivatusGatsbyOptions } from '../src/gatsby-ssr.js'

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
