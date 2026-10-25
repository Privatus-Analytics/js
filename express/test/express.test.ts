import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import compression from 'compression'
import express, { type Express } from 'express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import privatus, { QUEUE_STUB, clickAttr, eventAttrs, eventData, type PrivatusExpressOptions } from '../src/index.js'

const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const PAGE = '<html><head><title>Plain</title></head><body>Plain</body></html>'
const servers: Server[] = []

afterEach(() => {
  while (servers.length) servers.pop()!.close()
})

function app(options: PrivatusExpressOptions, setup?: (app: Express) => void): Express {
  const app = express()
  app.set('views', fileURLToPath(new URL('./views', import.meta.url)))
  app.set('view engine', 'ejs')
  setup?.(app)
  app.use(privatus({ siteId: 'pa_TEST123456', ...options }))
  app.get('/', (_req, res) => res.render('layout'))
  app.get('/plain', (_req, res) => res.send(PAGE))
  app.get('/data', (_req, res) => res.json({ html: '</head>' }))
  app.get('/bare', (_req, res) => res.send('<p>No head here</p>'))
  app.get('/features', (_req, res) => res.render('features'))
  app.get('/off', (req, res) => {
    res.locals.cspNonce = req.query.nonce as string | undefined
    res.send(`<head>${res.locals.privatusAnalyticsTag!({ enabled: false, queueStub: req.query.stub === '1' })}</head>`)
  })
  app.get('/nonce', (_req, res) => {
    res.locals.cspNonce = 'n0nce'
    res.send(PAGE)
  })
  return app
}

async function get(app: Express, path: string, headers: Record<string, string> = {}): Promise<{ body: string; headers: Headers }> {
  const server = app.listen(0)
  servers.push(server)
  await new Promise((resolve) => server.once('listening', resolve))
  const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, { headers })
  return { body: await response.text(), headers: response.headers }
}

describe('res.locals helpers', () => {
  it('print the tag in the layout head', async () => {
    const { body } = await get(app({ enabled: true }), '/')
    expect(body).toContain(SNIPPET)
    expect(body.indexOf(SNIPPET)).toBeLessThan(body.indexOf('</head>'))
  })

  it('print nothing outside production by default', async () => {
    const { body } = await get(app({}), '/')
    expect(body).not.toContain('pa.js')
  })

  it('print the tag when the app env is production', async () => {
    const { body } = await get(app({}, (a) => a.set('env', 'production')), '/')
    expect(body).toContain(SNIPPET)
  })

  it('print nothing without a site id', async () => {
    const { body } = await get(app({ enabled: true, siteId: '' }), '/')
    expect(body).not.toContain('pa.js')
  })

  it('render event and click attributes in a real view, even when the tag is off', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { body } = await get(app({}), '/features')
    expect(body).toContain('<button data-privatus-event="Export CSV" data-privatus-prop-format="csv">Export</button>')
    expect(body).toContain('<a data-privatus-click="pricing.cta" href="/pricing">Pricing</a>')
    expect(body).toContain('<a  href="/x">X</a>')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"not valid" is not valid'))
    warn.mockRestore()
  })

  it('send configured props from the request', async () => {
    const { body } = await get(app({ enabled: true, props: (req) => ({ plan: String(req.query.plan) }) }), '/?plan=pro')
    expect(body).toContain('window.privatusPageProps=function(){return {"plan":"pro"}}')
    expect(body).toContain('data-props="privatusPageProps"')
  })
})

describe('when the tag is off', () => {
  it('prints only the queue stub, with the nonce, and does not run the props function', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    expect((await get(app({ props }), '/off?stub=1&nonce=n0nce')).body).toBe(`<head><script nonce="n0nce">${QUEUE_STUB}</script></head>`)
    expect((await get(app({ props }), '/off?stub=1')).body).toBe(`<head><script>${QUEUE_STUB}</script></head>`)
    expect(props).not.toHaveBeenCalled()
  })

  it('prints nothing with the queue stub off', async () => {
    expect((await get(app({ props: { plan: 'pro' } }), '/off?nonce=n0nce')).body).toBe('<head></head>')
  })

  it('prints only the queue stub without a site id', async () => {
    const { body } = await get(app({ enabled: true, siteId: '', queueStub: true, props: { plan: 'pro' } }), '/')
    expect(body).toContain(`<script>${QUEUE_STUB}</script>`)
    expect(body).not.toContain('pa.js')
    expect(body).not.toContain('privatusPageProps')
  })

  it('auto inject adds nothing, even with the queue stub on', async () => {
    expect((await get(app({ autoInject: true, queueStub: true }), '/plain')).body).toBe(PAGE)
    expect((await get(app({ autoInject: true, queueStub: true, enabled: false }), '/plain')).body).toBe(PAGE)
  })
})

describe('auto inject', () => {
  it('does nothing by default', async () => {
    const { body } = await get(app({ enabled: true }), '/plain')
    expect(body).toBe(PAGE)
  })

  it('adds the tag before </head> and fixes Content-Length', async () => {
    const { body, headers } = await get(app({ enabled: true, autoInject: true }), '/plain')
    expect(body).toContain(`${SNIPPET}\n</head>`)
    expect(headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
  })

  it('does not add a second tag when the layout has one', async () => {
    const { body } = await get(app({ enabled: true, autoInject: true }), '/')
    expect(body.split('/js/pa.js')).toHaveLength(2)
  })

  it('leaves JSON, pages without a head, and Ajax requests alone', async () => {
    const a = app({ enabled: true, autoInject: true })
    expect((await get(a, '/data')).body).toBe('{"html":"</head>"}')
    expect((await get(a, '/bare')).body).toBe('<p>No head here</p>')
    expect((await get(a, '/plain', { 'X-Requested-With': 'XMLHttpRequest' })).body).toBe(PAGE)
  })

  it('adds nothing outside production', async () => {
    expect((await get(app({ autoInject: true }), '/plain')).body).toBe(PAGE)
  })

  it('uses res.locals.cspNonce and prints the queue stub and props', async () => {
    const { body, headers } = await get(app({ enabled: true, autoInject: true, queueStub: true, props: { plan: 'pro' } }), '/nonce')
    expect(body.split('nonce="n0nce"')).toHaveLength(4)
    expect(body).toContain('q:[]')
    expect(headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
  })

  it('works with compression registered first', async () => {
    const a = app({ enabled: true, autoInject: true }, (a) => a.use(compression({ threshold: 0 })))
    const { body, headers } = await get(a, '/plain', { 'Accept-Encoding': 'gzip' })
    expect(headers.get('content-encoding')).toBe('gzip')
    expect(body).toContain(`${SNIPPET}\n</head>`)
  })
})

describe('plain helpers', () => {
  it('build attributes and the tag without a request cycle', () => {
    expect(eventAttrs('Report exported', { format: 'csv' })).toBe(
      'data-privatus-event="Report exported" data-privatus-prop-format="csv"',
    )
    expect(eventData('Guide opened')).toEqual({ 'data-privatus-event': 'Guide opened' })
    expect(clickAttr('pricing.cta')).toBe('data-privatus-click="pricing.cta"')
    const middleware = privatus({ siteId: 'pa_TEST123456', enabled: true })
    const req = { app: { get: () => 'test' } } as never
    const res = { locals: {} } as never
    expect(middleware.tag(req, res, { modules: ['engage', 'auto'] })).toContain('data-modules="engage,auto"')
  })
})
