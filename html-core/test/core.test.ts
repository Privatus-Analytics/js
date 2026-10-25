import { describe, expect, it, vi } from 'vitest'
import {
  QUEUE_STUB,
  attributesToHtml,
  clickAttr,
  clickData,
  contextTag,
  eventAttrs,
  eventData,
  injectTag,
  pagePropsJson,
  renderTag,
  shouldInject,
  tagElements,
} from '../src/index.js'

const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const on = { siteId: 'pa_TEST123456', enabled: true, env: {} }

describe('event attributes', () => {
  it('turns an event into data attributes', () => {
    expect(eventData('Export CSV', { format: 'csv', source: 'toolbar' })).toEqual({
      'data-privatus-event': 'Export CSV',
      'data-privatus-prop-format': 'csv',
      'data-privatus-prop-source': 'toolbar',
    })
    expect(eventAttrs('Export CSV', { format: 'csv', source: 'toolbar' })).toBe(
      'data-privatus-event="Export CSV" data-privatus-prop-format="csv" data-privatus-prop-source="toolbar"',
    )
  })

  it('trims the name and cuts it to 120 characters', () => {
    expect(eventData('  Export CSV  ')['data-privatus-event']).toBe('Export CSV')
    expect(eventData('a'.repeat(200))['data-privatus-event']).toBe('a'.repeat(120))
  })

  it('gives nothing for an empty name', () => {
    expect(eventData('   ', { format: 'csv' })).toEqual({})
    expect(eventData(null)).toEqual({})
    expect(eventAttrs(undefined)).toBe('')
  })

  it('lowercases, cleans and cuts prop keys', () => {
    const attrs = eventData('Saved', { 'Report Type': 'a', 'x-y': 'b', ['K'.repeat(80)]: 'c' })
    expect(attrs['data-privatus-prop-report_type']).toBe('a')
    expect(attrs['data-privatus-prop-x_y']).toBe('b')
    expect(attrs[`data-privatus-prop-${'k'.repeat(64)}`]).toBe('c')
  })

  it('turns values into strings and drops null values', () => {
    const attrs = eventData('Saved', { on: true, off: false, count: 3, ratio: 1.5, tags: ['a', 'b'], gone: null, nope: undefined })
    expect(['on', 'off', 'count', 'ratio', 'tags'].map((key) => attrs[`data-privatus-prop-${key}`])).toEqual([
      'true', 'false', '3', '1.5', 'a,b',
    ])
    expect('data-privatus-prop-gone' in attrs).toBe(false)
    expect('data-privatus-prop-nope' in attrs).toBe(false)
  })

  it('cuts values to 500 characters and keeps at most 30 props', () => {
    const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`p${i + 1}`, 'v']))
    expect(Object.keys(eventData('Saved', many))).toHaveLength(31)
    expect(eventData('Saved', { long: 'x'.repeat(900) })['data-privatus-prop-long']).toHaveLength(500)
  })

  it('escapes every value', () => {
    expect(attributesToHtml(eventData('Say "hi" <now>', { note: "a&b'" }))).toBe(
      'data-privatus-event="Say &quot;hi&quot; &lt;now&gt;" data-privatus-prop-note="a&amp;b&#39;"',
    )
  })
})

describe('click names', () => {
  it('accepts valid names', () => {
    expect(clickData('pricing.cta')).toEqual({ 'data-privatus-click': 'pricing.cta' })
    expect(clickAttr('a-b_c:d.1')).toBe('data-privatus-click="a-b_c:d.1"')
  })

  it('gives nothing for invalid names and can warn', () => {
    for (const name of ['', 'has space', 'x'.repeat(101), '<b>', null, 'ok\n']) expect(clickData(name)).toEqual({})
    const warn = vi.fn()
    expect(clickAttr('bad name', warn)).toBe('')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"bad name" is not valid'))
  })
})

describe('page props', () => {
  it('makes a JSON object', () => {
    expect(pagePropsJson({ plan: 'pro', role: 'admin' })).toBe('{"plan":"pro","role":"admin"}')
  })

  it('gives null for empty props', () => {
    expect(pagePropsJson({})).toBeNull()
    expect(pagePropsJson(null)).toBeNull()
    expect(pagePropsJson({ gone: null })).toBeNull()
  })

  it('keeps numbers, booleans and lists', () => {
    expect(pagePropsJson({ seats: 5, ratio: 1.5, beta: true, old: false, flags: ['a', null, 'b', 3] })).toBe(
      '{"seats":5,"ratio":1.5,"beta":true,"old":false,"flags":["a","b",3]}',
    )
    expect(pagePropsJson({ bad: Number.NaN })).toBeNull()
  })

  it('cleans keys like event props and keeps their order', () => {
    expect(pagePropsJson({ 'App Version': '2.1' })).toBe('{"app_version":"2.1"}')
  })

  it('limits props, list items and value length', () => {
    const many = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`p${i + 1}`, i]))
    expect(Object.keys(JSON.parse(pagePropsJson(many)!))).toHaveLength(30)
    expect(JSON.parse(pagePropsJson({ list: Array.from({ length: 50 }, String) })!).list).toHaveLength(30)
    expect(JSON.parse(pagePropsJson({ long: 'x'.repeat(900) })!).long).toHaveLength(500)
  })

  it('is safe inside a script tag', () => {
    const json = pagePropsJson({ note: '</script><b>&\u2028\u2029' })!
    expect(json).toBe('{"note":"\\u003c/script\\u003e\\u003cb\\u003e\\u0026\\u2028\\u2029"}')
    expect(json).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(json).note).toBe('</script><b>&\u2028\u2029')
  })
})

describe('the tag', () => {
  it('prints the basic snippet', () => {
    expect(renderTag(on)).toBe(SNIPPET)
  })

  it('prints nothing without a site id or when off', () => {
    expect(renderTag({ enabled: true, env: {} })).toBe('')
    expect(renderTag({ ...on, enabled: false })).toBe('')
  })

  it('reads the site id and host from the environment and drops a trailing slash', () => {
    expect(renderTag({ enabled: true, env: { PRIVATUS_SITE_ID: 'pa_ENV', PRIVATUS_SCRIPT_HOST: 'https://cdn.example.com/' } })).toBe(
      '<script defer src="https://cdn.example.com/js/pa.js" data-site="pa_ENV"></script>',
    )
  })

  it('adds modules, exclusions, domains, spa and manual', () => {
    const tag = renderTag({ ...on, modules: ['engage', 'auto'], excludedPaths: ['/admin/*', '/preview/*'], domains: 'example.com, www.example.com', spa: 'hash', manual: true })
    expect(tag).toContain('data-modules="engage,auto"')
    expect(tag).toContain('data-exclude="/admin/*,/preview/*"')
    expect(tag).toContain('data-domains="example.com,www.example.com"')
    expect(tag).toContain('data-spa="hash"')
    expect(tag).toContain('data-manual="true"')
  })

  it('an empty modules list loads none, empty exclusions print nothing', () => {
    expect(renderTag({ ...on, modules: [], excludedPaths: [] })).toBe(SNIPPET.replace('"></script>', '" data-modules=""></script>'))
  })

  it('ignores an unknown spa mode and the auto default', () => {
    expect(renderTag({ ...on, spa: 'bogus' as never })).not.toContain('data-spa')
    expect(renderTag({ ...on, spa: 'auto' })).not.toContain('data-spa')
  })

  it('escapes values and adds extra attributes and a nonce', () => {
    const tag = renderTag({ ...on, excludedPaths: ['/a"b'], extraAttributes: { 'data-mask': '/orders/*->/orders/:id', 'data-gone': null }, nonce: 'abc123' })
    expect(tag).toContain('data-exclude="/a&quot;b"')
    expect(tag).toContain('data-mask="/orders/*-&gt;/orders/:id"')
    expect(tag).not.toContain('data-gone')
    expect(tag).toContain('nonce="abc123"')
  })

  it('page props print an inline script first and data-props on the tag', () => {
    expect(renderTag({ ...on, props: { plan: 'pro', role: 'admin' } })).toBe(
      '<script>window.privatusPageProps=function(){return {"plan":"pro","role":"admin"}}</script>\n' +
        '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456" data-props="privatusPageProps"></script>',
    )
    expect(renderTag({ ...on, props: { plan: null } })).toBe(SNIPPET)
  })

  it('the queue stub is the official one and comes first, all with the nonce', () => {
    expect(QUEUE_STUB).toBe(
      "window.privatus=window.privatus||{q:[]};['track','pageview','props','optOut','optIn','ready'].forEach(function(m){window.privatus[m]=window.privatus[m]||function(){window.privatus.q.push([m,Array.prototype.slice.call(arguments)])}})",
    )
    const parts = renderTag({ ...on, queueStub: true, nonce: 'abc', props: { plan: 'pro' } }).split('\n')
    expect(parts[0]).toBe(`<script nonce="abc">${QUEUE_STUB}</script>`)
    expect(parts[1]).toMatch(/^<script nonce="abc">window.privatusPageProps=/)
    expect(parts[2]).toContain('/js/pa.js')
  })

  it('gives script elements for tools that want objects', () => {
    expect(tagElements({ ...on, props: { plan: 'pro' } })).toEqual([
      { attributes: {}, code: 'window.privatusPageProps=function(){return {"plan":"pro"}}' },
      { attributes: { defer: true, src: 'https://privatusstats.com/js/pa.js', 'data-site': 'pa_TEST123456', 'data-props': 'privatusPageProps' } },
    ])
  })
})

describe('context glue', () => {
  const runtime = { defaultEnabled: true, env: {} }

  it('calls the props function with the context and merges overrides, null removes', () => {
    const tag = contextTag({ siteId: 'pa_X', props: (ctx: { plan: string }) => ({ plan: ctx.plan, role: 'admin' }) }, { plan: 'team' }, { props: { Role: null, tier: 'gold' } }, runtime)
    expect(tag).toContain('{"plan":"team","tier":"gold"}')
  })

  it('does not call the props function when the tag is off', () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    expect(contextTag({ siteId: 'pa_X', props }, {}, null, { ...runtime, defaultEnabled: false })).toBe('')
    expect(props).not.toHaveBeenCalled()
  })

  it('enabled: per call beats configuration beats the default; overrides replace settings', () => {
    expect(contextTag({ siteId: 'pa_X', enabled: false }, {}, null, runtime)).toBe('')
    expect(contextTag({ siteId: 'pa_X', enabled: false }, {}, { enabled: true }, runtime)).toContain('pa_X')
    expect(contextTag({ siteId: 'pa_X', enabled: true }, {}, null, { ...runtime, defaultEnabled: false })).toContain('pa_X')
    expect(contextTag({ siteId: 'pa_X', modules: ['engage'] }, {}, { modules: ['vitals'] }, runtime)).toContain('data-modules="vitals"')
  })

  it('the per call nonce beats the framework nonce, which beats the configured one', () => {
    expect(contextTag({ siteId: 'pa_X', nonce: 'conf' }, {}, null, runtime)).toContain('nonce="conf"')
    expect(contextTag({ siteId: 'pa_X', nonce: 'conf' }, {}, null, { ...runtime, nonce: 'fw' })).toContain('nonce="fw"')
    expect(contextTag({ siteId: 'pa_X' }, {}, { nonce: 'call' }, { ...runtime, nonce: 'fw' })).toContain('nonce="call"')
  })
})

describe('auto inject rules', () => {
  it('only 200 text/html without encoding, not Ajax', () => {
    expect(shouldInject({ status: 200, contentType: 'text/html; charset=utf-8' })).toBe(true)
    expect(shouldInject({ status: 404, contentType: 'text/html' })).toBe(false)
    expect(shouldInject({ status: 200, contentType: 'application/json' })).toBe(false)
    expect(shouldInject({ status: 200, contentType: 'text/html', contentEncoding: 'gzip' })).toBe(false)
    expect(shouldInject({ status: 200, contentType: 'TEXT/HTML', requestedWith: 'xmlhttprequest' })).toBe(false)
  })

  it('puts the tag before </head> once', () => {
    expect(injectTag('<html><HEAD><title>x</title></HEAD><body></body></html>', SNIPPET)).toBe(
      `<html><HEAD><title>x</title>${SNIPPET}\n</head><body></body></html>`,
    )
    expect(injectTag(`<head>${SNIPPET}</head>`, SNIPPET)).toBe(`<head>${SNIPPET}</head>`)
    expect(injectTag('<p>No head here</p>', SNIPPET)).toBe('<p>No head here</p>')
    expect(injectTag('<head></head>', '')).toBe('<head></head>')
  })
})
