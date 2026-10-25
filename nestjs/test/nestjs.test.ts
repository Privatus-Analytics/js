import 'reflect-metadata'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { Controller, Get, Header, Inject, Module, Render, Req, Res, type INestApplication, type MiddlewareConsumer } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PrivatusMiddleware, PrivatusModule, PrivatusService, QUEUE_STUB, type PrivatusNestOptions } from '../src/index.js'

const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const PAGE = '<html><head><title>Plain</title></head><body>Plain</body></html>'
let app: INestApplication | undefined

afterEach(async () => {
  await app?.close()
  app = undefined
})

@Controller()
class PagesController {
  constructor(@Inject(PrivatusService) private readonly privatus: PrivatusService) {}

  @Get()
  @Render('layout')
  home(): Record<string, never> {
    return {}
  }

  @Get('features')
  @Render('features')
  features(): Record<string, never> {
    return {}
  }

  @Get('plain')
  @Header('Content-Type', 'text/html; charset=utf-8')
  plain(): string {
    return PAGE
  }

  @Get('data')
  data(): { html: string } {
    return { html: '</head>' }
  }

  @Get('off')
  off(@Req() req: { query: Record<string, string> }, @Res() res: { locals: Record<string, any>; type(t: string): { send(b: string): void } }): void {
    if (req.query.nonce) res.locals.cspNonce = req.query.nonce
    res.type('html').send(`<head>${this.privatus.tag(req as never, res as never, { enabled: false, queueStub: req.query.stub === '1' })}</head>`)
  }

  @Get('service')
  service(@Req() req: never, @Res() res: { type(t: string): { send(b: string): void } }): void {
    res.type('html').send(`<head>${this.privatus.tag(req)}</head><a ${this.privatus.clickAttr('pricing.cta')}>`)
  }
}

async function start(options: PrivatusNestOptions, useModuleMiddleware = true): Promise<string> {
  @Module({ imports: [PrivatusModule.forRoot({ siteId: 'pa_TEST123456', ...options })], controllers: [PagesController] })
  class AppModule {
    configure(consumer: MiddlewareConsumer): void {
      if (useModuleMiddleware) consumer.apply(PrivatusMiddleware).forRoutes('{*splat}')
    }
  }
  const nest = await NestFactory.create<NestExpressApplication>(AppModule, { logger: false })
  nest.setBaseViewsDir(fileURLToPath(new URL('./views', import.meta.url)))
  nest.setViewEngine('ejs')
  if (!useModuleMiddleware) nest.use(nest.get(PrivatusService).middleware())
  await nest.listen(0, '127.0.0.1')
  app = nest
  return `http://127.0.0.1:${(nest.getHttpServer().address() as AddressInfo).port}`
}

async function get(url: string, headers: Record<string, string> = {}): Promise<{ body: string; headers: Headers }> {
  const response = await fetch(url, { headers })
  return { body: await response.text(), headers: response.headers }
}

describe('PrivatusModule with the Express platform', () => {
  it('the middleware adds the tag helper to res.locals for @Render templates', async () => {
    const url = await start({ enabled: true })
    const { body } = await get(url)
    expect(body).toContain(SNIPPET)
    expect(body.indexOf(SNIPPET)).toBeLessThan(body.indexOf('</head>'))
  })

  it('prints nothing outside production by default', async () => {
    const url = await start({})
    expect((await get(url)).body).not.toContain('pa.js')
  })

  it('renders event and click attributes in a real view', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const url = await start({})
    const { body } = await get(`${url}/features`)
    expect(body).toContain('<button data-privatus-event="Export CSV" data-privatus-prop-format="csv">Export</button>')
    expect(body).toContain('<a data-privatus-click="pricing.cta" href="/pricing">Pricing</a>')
    warn.mockRestore()
  })

  it('PrivatusService works in a controller and props get the request', async () => {
    const url = await start({ enabled: true, props: (req) => ({ plan: String(req.query.plan) }) })
    const { body } = await get(`${url}/service?plan=pro`)
    expect(body).toContain('{"plan":"pro"}')
    expect(body).toContain('data-props="privatusPageProps"')
    expect(body).toContain('<a data-privatus-click="pricing.cta">')
  })

  it('auto inject adds the tag to HTML responses and fixes Content-Length', async () => {
    const url = await start({ enabled: true, autoInject: true })
    const { body, headers } = await get(`${url}/plain`)
    expect(body).toContain(`${SNIPPET}\n</head>`)
    expect(headers.get('content-length')).toBe(String(Buffer.byteLength(body)))
    expect((await get(url)).body.split('/js/pa.js')).toHaveLength(2)
    expect((await get(`${url}/data`)).body).toBe('{"html":"</head>"}')
    expect((await get(`${url}/plain`, { 'X-Requested-With': 'XMLHttpRequest' })).body).toBe(PAGE)
  })

  it('the plain middleware works with app.use in main.ts', async () => {
    const url = await start({ enabled: true, autoInject: true }, false)
    expect((await get(`${url}/plain`)).body).toContain(`${SNIPPET}\n</head>`)
  })

  it('forRootAsync takes options from a factory', async () => {
    @Module({ imports: [PrivatusModule.forRootAsync({ useFactory: async () => ({ siteId: 'pa_ASYNC', enabled: true }) })] })
    class AsyncModule {}
    const nest = await NestFactory.createApplicationContext(AsyncModule, { logger: false })
    expect(nest.get(PrivatusService).tag({ headers: {} })).toContain('data-site="pa_ASYNC"')
    await nest.close()
  })
})

describe('when the tag is off', () => {
  it('prints only the queue stub, with the nonce, and does not run the props function', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const url = await start({ props })
    expect((await get(`${url}/off?stub=1&nonce=n0nce`)).body).toBe(`<head><script nonce="n0nce">${QUEUE_STUB}</script></head>`)
    expect((await get(`${url}/off?stub=1`)).body).toBe(`<head><script>${QUEUE_STUB}</script></head>`)
    expect(props).not.toHaveBeenCalled()
  })

  it('prints nothing with the queue stub off', async () => {
    const url = await start({ props: { plan: 'pro' } })
    expect((await get(`${url}/off?nonce=n0nce`)).body).toBe('<head></head>')
  })

  it('prints only the queue stub without a site id', async () => {
    const url = await start({ enabled: true, siteId: '', queueStub: true, props: { plan: 'pro' } })
    const { body } = await get(url)
    expect(body).toContain(`<script>${QUEUE_STUB}</script>`)
    expect(body).not.toContain('pa.js')
  })

  it('auto inject adds nothing, even with the queue stub on', async () => {
    const url = await start({ autoInject: true, queueStub: true })
    expect((await get(`${url}/plain`)).body).toBe(PAGE)
  })
})
