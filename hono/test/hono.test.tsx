import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { html } from 'hono/html'
import { NONCE, secureHeaders } from 'hono/secure-headers'
import { describe, expect, it, vi } from 'vitest'
import { clickAttr, clickData, eventAttrs, eventData, privatus, privatusAnalyticsTag, type PrivatusHonoOptions } from '../src/index.js'

const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const PAGE = '<html><head><title>Plain</title></head><body>Plain</body></html>'

function app(options: PrivatusHonoOptions, setup?: (app: Hono) => void): Hono {
  const app = new Hono()
  setup?.(app)
  app.use(privatus({ siteId: 'pa_TEST123456', ...options }))
  app.get('/', (c) => c.html(html`<html><head>${privatusAnalyticsTag(c)}</head><body></body></html>`))
  app.get('/jsx', (c) =>
    c.html(
      <html>
        <head>{c.var.privatus.tag()}</head>
        <body>
          <button {...eventData('Export CSV', { format: 'csv' })}>Export</button>
          <a href="/pricing" {...clickData('pricing.cta')}>Pricing</a>
        </body>
      </html>,
    ),
  )
  app.get('/attrs', (c) => c.html(html`<button ${eventAttrs('Say "hi"', { note: '<b>' })}>Hi</button><a ${clickAttr('pricing.cta')}>P</a>`))
  app.get('/plain', (c) => c.html(PAGE))
  app.get('/data', (c) => c.json({ html: '</head>' }))
  app.get('/bare', (c) => c.html('<p>No head here</p>'))
  return app
}

describe('privatusAnalyticsTag', () => {
  it('prints the tag in an html template', async () => {
    const body = await (await app({ enabled: true }).request('/')).text()
    expect(body).toContain(`<head>${SNIPPET}</head>`)
  })

  it('prints nothing outside production by default', async () => {
    expect(await (await app({}).request('/')).text()).not.toContain('pa.js')
  })

  it('reads the site id and NODE_ENV from Workers style bindings', async () => {
    const a = app({ siteId: undefined })
    const body = await (await a.request('/', {}, { PRIVATUS_SITE_ID: 'pa_WORKER', NODE_ENV: 'production' })).text()
    expect(body).toContain('data-site="pa_WORKER"')
  })

  it('works in JSX, with event and click data spread on elements', async () => {
    const body = await (await app({ enabled: true }).request('/jsx')).text()
    expect(body).toContain(SNIPPET)
    expect(body).toContain('<button data-privatus-event="Export CSV" data-privatus-prop-format="csv">Export</button>')
    expect(body).toContain('<a href="/pricing" data-privatus-click="pricing.cta">Pricing</a>')
  })

  it('escapes attribute values and keeps them raw in templates', async () => {
    const body = await (await app({}).request('/attrs')).text()
    expect(body).toBe(
      '<button data-privatus-event="Say &quot;hi&quot;" data-privatus-prop-note="&lt;b&gt;">Hi</button><a data-privatus-click="pricing.cta">P</a>',
    )
  })

  it('sends props from a function that gets the context', async () => {
    const body = await (await app({ enabled: true, props: (c) => ({ plan: c.req.query('plan') }) }).request('/?plan=pro')).text()
    expect(body).toContain('window.privatusPageProps=function(){return {"plan":"pro"}}')
    expect(body).toContain('data-props="privatusPageProps"')
  })

  it('uses the secureHeaders nonce', async () => {
    const a = app({ enabled: true, props: { plan: 'pro' } }, (a) =>
      a.use(secureHeaders({ contentSecurityPolicy: { scriptSrc: [NONCE] } })),
    )
    const response = await a.request('/')
    const nonce = /'nonce-([^']+)'/.exec(response.headers.get('content-security-policy') ?? '')![1]
    expect((await response.text()).split(`nonce="${nonce}"`)).toHaveLength(3)
  })
})

describe('auto inject', () => {
  it('does nothing by default', async () => {
    expect(await (await app({ enabled: true }).request('/plain')).text()).toBe(PAGE)
  })

  it('rewrites the HTML response and drops Content-Length', async () => {
    const a = new Hono()
    a.use(privatus({ siteId: 'pa_TEST123456', enabled: true, autoInject: true }))
    a.get('/', () => new Response(PAGE, { headers: { 'content-type': 'text/html', 'content-length': String(PAGE.length), 'x-kept': 'yes' } }))
    const response = await a.request('/')
    const body = await response.text()
    expect(body).toContain(`${SNIPPET}\n</head>`)
    expect(response.headers.get('content-length')).toBeNull()
    expect(response.headers.get('x-kept')).toBe('yes')
  })

  it('does not add a second tag', async () => {
    const body = await (await app({ enabled: true, autoInject: true }).request('/')).text()
    expect(body.split('/js/pa.js')).toHaveLength(2)
  })

  it('leaves JSON, pages without a head, Ajax and other environments alone', async () => {
    const a = app({ enabled: true, autoInject: true })
    expect(await (await a.request('/data')).text()).toBe('{"html":"</head>"}')
    expect(await (await a.request('/bare')).text()).toBe('<p>No head here</p>')
    expect(await (await a.request('/plain', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })).text()).toBe(PAGE)
    expect(await (await app({ autoInject: true }).request('/plain')).text()).toBe(PAGE)
  })

  it('prints the queue stub and props', async () => {
    const body = await (await app({ enabled: true, autoInject: true, queueStub: true, props: { plan: 'pro' } }).request('/plain')).text()
    expect(body).toContain('q:[]')
    expect(body).toContain('{"plan":"pro"}')
  })

  it('works with compress() registered first', async () => {
    const a = app({ enabled: true, autoInject: true }, (a) => a.use(compress()))
    const response = await a.request('/plain', { headers: { 'Accept-Encoding': 'gzip' } })
    expect(response.headers.get('content-encoding')).toBe('gzip')
    const { gunzipSync } = await import('node:zlib')
    expect(gunzipSync(Buffer.from(await response.arrayBuffer())).toString()).toContain(`${SNIPPET}\n</head>`)
  })

  it('warns about a bad click name outside production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(String(clickAttr('bad name'))).toBe('')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
