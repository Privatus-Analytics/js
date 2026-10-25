import compress from '@fastify/compress'
import Fastify, { type FastifyInstance } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import privatus, { QUEUE_STUB, clickAttr, eventAttrs, type PrivatusFastifyOptions } from '../src/index.js'

const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const PAGE = '<html><head><title>Plain</title></head><body>Plain</body></html>'

async function app(options: PrivatusFastifyOptions, after?: (app: FastifyInstance) => Promise<void>): Promise<FastifyInstance> {
  const app = Fastify()
  await app.register(privatus, { siteId: 'pa_TEST123456', ...options })
  await after?.(app)
  app.get('/', async (_request, reply) =>
    reply.type('text/html').send(`<html><head>${reply.privatusAnalyticsTag()}</head><body></body></html>`),
  )
  app.get('/locals', async (_request, reply) => {
    const locals = (reply as unknown as { locals: Record<string, (...args: unknown[]) => string> }).locals
    return reply
      .type('text/html')
      .send(`<head>${locals.privatusAnalyticsTag()}</head><button ${locals.privatusEventAttrs('Export CSV', { format: 'csv' })}>`)
  })
  app.get('/plain', async (_request, reply) => reply.type('text/html; charset=utf-8').send(PAGE))
  app.get('/buffer', async (_request, reply) => reply.type('text/html').send(Buffer.from(PAGE)))
  app.get('/data', async () => ({ html: '</head>' }))
  app.get('/bare', async (_request, reply) => reply.type('text/html').send('<p>No head here</p>'))
  app.get('/off', async (request, reply) => {
    const query = request.query as { stub?: string; nonce?: string }
    if (query.nonce) (reply as unknown as { cspNonce: { script: string } }).cspNonce = { script: query.nonce }
    return reply.type('text/html').send(`<head>${reply.privatusAnalyticsTag({ enabled: false, queueStub: query.stub === '1' })}</head>`)
  })
  app.get('/nonce', async (_request, reply) => {
    ;(reply as unknown as { cspNonce: { script: string } }).cspNonce = { script: 'n0nce' }
    return reply.type('text/html').send(PAGE)
  })
  return app
}

describe('reply.privatusAnalyticsTag', () => {
  it('prints the tag', async () => {
    const response = await (await app({ enabled: true })).inject('/')
    expect(response.body).toContain(`<head>${SNIPPET}</head>`)
  })

  it('prints nothing outside production by default, or without a site id', async () => {
    expect((await (await app({})).inject('/')).body).not.toContain('pa.js')
    expect((await (await app({ enabled: true, siteId: null })).inject('/')).body).not.toContain('pa.js')
  })

  it('is on when NODE_ENV is production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      expect((await (await app({})).inject('/')).body).toContain(SNIPPET)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('sends props from a function that gets the request', async () => {
    const a = await app({ enabled: true, props: (request) => ({ plan: (request.query as { plan: string }).plan }) })
    const body = (await a.inject('/?plan=team')).body
    expect(body).toContain('window.privatusPageProps=function(){return {"plan":"team"}}')
    expect(body).toContain('data-props="privatusPageProps"')
  })

  it('adds the helpers to reply.locals and fastify.privatus', async () => {
    const a = await app({ enabled: true })
    const body = (await a.inject('/locals')).body
    expect(body).toContain(SNIPPET)
    expect(body).toContain('<button data-privatus-event="Export CSV" data-privatus-prop-format="csv">')
    expect(a.privatus.clickAttr('pricing.cta')).toBe('data-privatus-click="pricing.cta"')
  })
})

describe('when the tag is off', () => {
  it('prints only the queue stub, with the nonce, and does not run the props function', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    expect((await (await app({ props })).inject('/off?stub=1&nonce=n0nce')).body).toBe(`<head><script nonce="n0nce">${QUEUE_STUB}</script></head>`)
    expect((await (await app({ props })).inject('/off?stub=1')).body).toBe(`<head><script>${QUEUE_STUB}</script></head>`)
    expect(props).not.toHaveBeenCalled()
  })

  it('prints nothing with the queue stub off', async () => {
    expect((await (await app({ props: { plan: 'pro' } })).inject('/off?nonce=n0nce')).body).toBe('<head></head>')
  })

  it('prints only the queue stub without a site id', async () => {
    const { body } = await (await app({ enabled: true, siteId: null, queueStub: true, props: { plan: 'pro' } })).inject('/')
    expect(body).toBe(`<html><head><script>${QUEUE_STUB}</script></head><body></body></html>`)
  })

  it('auto inject adds nothing, even with the queue stub on', async () => {
    expect((await (await app({ autoInject: true, queueStub: true })).inject('/plain')).body).toBe(PAGE)
    expect((await (await app({ autoInject: true, queueStub: true, enabled: false })).inject('/plain')).body).toBe(PAGE)
  })
})

describe('auto inject', () => {
  it('does nothing by default', async () => {
    expect((await (await app({ enabled: true })).inject('/plain')).body).toBe(PAGE)
  })

  it('adds the tag before </head> to strings and buffers and fixes Content-Length', async () => {
    const a = await app({ enabled: true, autoInject: true })
    for (const path of ['/plain', '/buffer']) {
      const response = await a.inject(path)
      expect(response.body).toContain(`${SNIPPET}\n</head>`)
      expect(response.headers['content-length']).toBe(String(Buffer.byteLength(response.body)))
    }
  })

  it('does not add a second tag', async () => {
    const body = (await (await app({ enabled: true, autoInject: true })).inject('/')).body
    expect(body.split('/js/pa.js')).toHaveLength(2)
  })

  it('leaves JSON, pages without a head, Ajax and other environments alone', async () => {
    const a = await app({ enabled: true, autoInject: true })
    expect((await a.inject('/data')).body).toBe('{"html":"</head>"}')
    expect((await a.inject('/bare')).body).toBe('<p>No head here</p>')
    expect((await a.inject({ url: '/plain', headers: { 'x-requested-with': 'XMLHttpRequest' } })).body).toBe(PAGE)
    expect((await (await app({ autoInject: true })).inject('/plain')).body).toBe(PAGE)
  })

  it('uses the @fastify/helmet nonce and prints the queue stub', async () => {
    const a = await app({ enabled: true, autoInject: true, queueStub: true, props: { plan: 'pro' } })
    const response = await a.inject('/nonce')
    expect(response.body.split('nonce="n0nce"')).toHaveLength(4)
    expect(response.body).toContain('q:[]')
  })
})

describe('with @fastify/compress registered after privatus', () => {
  it('injects first, then the page is compressed', async () => {
    const a = await app({ enabled: true, autoInject: true }, async (a) => {
      await a.register(compress, { threshold: 0 })
    })
    const response = await a.inject({ url: '/plain', headers: { 'accept-encoding': 'gzip' } })
    expect(response.headers['content-encoding']).toBe('gzip')
    const { gunzipSync } = await import('node:zlib')
    expect(gunzipSync(response.rawPayload).toString()).toContain(`${SNIPPET}\n</head>`)
  })
})

describe('plain helpers', () => {
  it('build attributes', () => {
    expect(eventAttrs('Report exported', { format: 'csv' })).toBe('data-privatus-event="Report exported" data-privatus-prop-format="csv"')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(clickAttr('no spaces allowed')).toBe('')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
