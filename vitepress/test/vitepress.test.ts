import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build as viteBuild } from 'vite'
import { build as vitepressBuild } from 'vitepress'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QUEUE_STUB } from '@privatus-analytics/html-core'
import { privatusHead, privatusTransformHead, privatusVitePlugin } from '../src/index.js'

const SITE = fileURLToPath(new URL('./vp-site', import.meta.url))
// VitePress minifies inline head scripts unless their type leaves out "javascript".
const INLINE = { type: 'text/ecmascript' }
const APP = fileURLToPath(new URL('./vite-app', import.meta.url))
const outputs: string[] = []

afterEach(() => {
  while (outputs.length) rmSync(outputs.pop()!, { recursive: true, force: true })
  vi.unstubAllEnvs()
  delete (globalThis as Record<string, unknown>).__privatusVitePress
})

function outDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'privatus-vitepress-'))
  outputs.push(dir)
  return dir
}

// VitePress links vue into the node_modules of the folder it runs from. In this
// workspace that link breaks its server render, so build from the folder that
// really holds node_modules/vue, as a normal docs site would.
const VUE_HOME = dirname(dirname(dirname(createRequire(import.meta.url).resolve('vue/package.json'))))

async function buildDocs(config: Record<string, unknown>): Promise<(path: string) => string> {
  const dir = outDir()
  ;(globalThis as Record<string, unknown>).__privatusVitePress = { outDir: dir, ...config }
  const cwd = process.cwd()
  process.chdir(VUE_HOME)
  try {
    await vitepressBuild(SITE)
  } finally {
    process.chdir(cwd)
  }
  return (path) => readFileSync(join(dir, path), 'utf8')
}

describe('privatusHead', () => {
  it('gives head entries, only in production unless enabled says otherwise', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(privatusHead({ siteId: 'pa_VP' })).toEqual([])
    vi.stubEnv('NODE_ENV', 'production')
    expect(privatusHead({ siteId: 'pa_VP', props: { plan: 'pro' } })).toEqual([
      ['script', INLINE, 'window.privatusPageProps=function(){return {"plan":"pro"}}'],
      ['script', { defer: '', src: 'https://privatusstats.com/js/pa.js', 'data-site': 'pa_VP', 'data-props': 'privatusPageProps' }],
    ])
    expect(privatusHead({})).toEqual([])
  })

  it('when off, gives only the queue stub (when it is on), never the tracker or page props', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const stub = ['script', INLINE, QUEUE_STUB]
    expect(privatusHead({ siteId: 'pa_VP', queueStub: true, props: { plan: 'pro' } })).toEqual([stub])
    expect(privatusHead({ queueStub: true })).toEqual([stub])
    expect(privatusHead({ siteId: 'pa_VP', props: { plan: 'pro' } })).toEqual([])
    vi.stubEnv('NODE_ENV', 'production')
    expect(privatusHead({ siteId: 'pa_VP', enabled: false, queueStub: true, nonce: 'abc' })).toEqual([['script', { ...INLINE, nonce: 'abc' }, QUEUE_STUB]])
  })

  it('works in a real vitepress build', async () => {
    const read = await buildDocs({ head: privatusHead({ siteId: 'pa_VP', enabled: true, modules: ['engage', 'auto'] }) })
    const home = read('index.html')
    expect(home).toMatch(/<script defer(="")? src="https:\/\/privatusstats\.com\/js\/pa\.js" data-site="pa_VP" data-modules="engage,auto"><\/script>/)
    expect(home).toContain('data-privatus-event="Report exported"')
    expect(read('guide/start.html')).toContain('data-site="pa_VP"')
  }, 120_000)
})

describe('privatusTransformHead', () => {
  it('adds the tag per page in a real vitepress build, with props from the frontmatter', async () => {
    const read = await buildDocs({
      transformHead: privatusTransformHead({
        siteId: 'pa_VP',
        props: ({ pageData }) => ({ section: pageData.frontmatter?.section, note: '</script><b>' }),
      }),
    })
    const home = read('index.html')
    expect(home).toContain('<script type="text/ecmascript">window.privatusPageProps=function(){return {"section":"home"')
    expect(home).not.toContain('"</script>')
    expect(home.split('</script>').length).toBe(read('index.html').split('<script').length)
    const guide = read('guide/start.html')
    expect(guide).toContain('{"section":"guide"')
    expect(guide).toContain('<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_VP" data-props="privatusPageProps"></script>')
  }, 120_000)

  it('keeps the queue stub and the escaped page props exactly as printed in a real vitepress build', async () => {
    const read = await buildDocs({
      transformHead: privatusTransformHead({ siteId: 'pa_VP', queueStub: true, props: { plan: 'pro', note: '</script>&' } }),
    })
    const home = read('index.html')
    expect(home).toContain(`<script type="text/ecmascript">${QUEUE_STUB}</script>`)
    expect(home).toContain(
      '<script type="text/ecmascript">window.privatusPageProps=function(){return {"plan":"pro","note":"\\u003c/script\\u003e\\u0026"}}</script>'
    )
  }, 120_000)

  it('can be switched off', () => {
    const hook = privatusTransformHead({ siteId: 'pa_VP', enabled: false })
    expect(hook({ page: 'index.md', pageData: { relativePath: 'index.md' } })).toEqual([])
  })

  it('switched off with the queue stub on, gives only the stub and does not run the props function', () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const hook = privatusTransformHead({ siteId: 'pa_VP', enabled: false, queueStub: true, props })
    expect(hook({ page: 'index.md', pageData: { relativePath: 'index.md' } })).toEqual([['script', INLINE, QUEUE_STUB]])
    expect(props).not.toHaveBeenCalled()
  })

  it('switched off with the queue stub on, adds no second stub when privatusHead already gave one', () => {
    const hook = privatusTransformHead({ siteId: 'pa_VP', enabled: false, queueStub: true })
    const head = [['script', INLINE, QUEUE_STUB]] as never
    expect(hook({ page: 'index.md', pageData: { relativePath: 'index.md' }, head })).toEqual([])
    const withNonce = [['script', { ...INLINE, nonce: 'abc' }, QUEUE_STUB]] as never
    expect(hook({ page: 'index.md', pageData: { relativePath: 'index.md' }, head: withNonce })).toEqual([])
  })

  it('switched off, every page of a real vitepress build gets exactly one stub, also next to privatusHead', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    for (const config of [
      { transformHead: privatusTransformHead({ siteId: 'pa_VP', enabled: false, queueStub: true, props }) },
      {
        head: privatusHead({ siteId: 'pa_VP', enabled: false, queueStub: true, props: { plan: 'pro' } }),
        transformHead: privatusTransformHead({ siteId: 'pa_VP', enabled: false, queueStub: true, props }),
      },
    ]) {
      const read = await buildDocs(config)
      for (const path of ['index.html', 'guide/start.html']) {
        const html = read(path)
        expect(html.split('window.privatus=window.privatus').length - 1, path).toBe(1)
        expect(html, path).toContain(`<script type="text/ecmascript">${QUEUE_STUB}</script>`)
        expect(html, path).not.toContain('/js/pa.js')
        expect(html, path).not.toContain('privatusPageProps')
      }
    }
    expect(props).not.toHaveBeenCalled()
  }, 240_000)

  it('switched off with the queue stub off, a real vitepress build adds nothing', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const read = await buildDocs({ transformHead: privatusTransformHead({ siteId: 'pa_VP', enabled: false, props }) })
    for (const path of ['index.html', 'guide/start.html']) {
      expect(read(path), path).not.toContain('window.privatus')
      expect(read(path), path).not.toContain('/js/pa.js')
    }
    expect(props).not.toHaveBeenCalled()
  }, 120_000)
})

describe('privatusVitePlugin', () => {
  it('puts the tag in index.html in a real vite build', async () => {
    // Vite works out isProduction from NODE_ENV, which vitest sets to test.
    vi.stubEnv('NODE_ENV', 'production')
    const dir = outDir()
    await viteBuild({
      root: APP,
      logLevel: 'silent',
      build: { outDir: dir, emptyOutDir: true },
      plugins: [privatusVitePlugin({ siteId: 'pa_VITE', props: (ctx) => ({ page: ctx.path }) })] as never,
    })
    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    expect(html).toContain('<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_VITE" data-props="privatusPageProps"></script>\n</head>')
    expect(html).toContain('{"page":"/index.html"}')
  }, 120_000)

  const STUB = `<script>${QUEUE_STUB}</script>`
  const PAGE = '<html><head></head><body></body></html>'
  const CTX = { path: '/index.html', filename: '/app/index.html' } as never

  it('when the tag is off, adds only the queue stub and never runs the props function', () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const withStub = `<html><head>${STUB}\n</head><body></body></html>`
    const dev = privatusVitePlugin({ siteId: 'pa_VITE', queueStub: true, props })
    dev.configResolved({ isProduction: false, command: 'build' })
    expect(dev.transformIndexHtml.handler(PAGE, CTX)).toBe(withStub)
    const off = privatusVitePlugin({ siteId: 'pa_VITE', queueStub: true, enabled: false, nonce: 'n1', props })
    off.configResolved({ isProduction: true, command: 'build' })
    expect(off.transformIndexHtml.handler(PAGE, CTX)).toBe(`<html><head><script nonce="n1">${QUEUE_STUB}</script>\n</head><body></body></html>`)
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    const noSite = privatusVitePlugin({ queueStub: true, props })
    noSite.configResolved({ isProduction: true, command: 'build' })
    expect(noSite.transformIndexHtml.handler(PAGE, CTX)).toBe(withStub)
    expect(props).not.toHaveBeenCalled()
  })

  it('when the tag is off without the queue stub, adds nothing', () => {
    const off = privatusVitePlugin({ siteId: 'pa_VITE', enabled: false })
    off.configResolved({ isProduction: true, command: 'build' })
    expect(off.transformIndexHtml.handler(PAGE, CTX)).toBe(PAGE)
  })

  it('runs in the dev server too, but only ever adds the queue stub there', () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const plugin = privatusVitePlugin({ siteId: 'pa_VITE', enabled: true, queueStub: true, props })
    expect('apply' in plugin).toBe(false)
    plugin.configResolved({ isProduction: false, command: 'serve' })
    expect(plugin.transformIndexHtml.handler(PAGE, CTX)).toBe(`<html><head>${STUB}\n</head><body></body></html>`)
    const plain = privatusVitePlugin({ siteId: 'pa_VITE', enabled: true })
    plain.configResolved({ isProduction: false, command: 'serve' })
    expect(plain.transformIndexHtml.handler(PAGE, CTX)).toBe(PAGE)
    expect(props).not.toHaveBeenCalled()
  })

  it('does not add a second stub to a page that already has one', () => {
    const plugin = privatusVitePlugin({ siteId: 'pa_VITE', enabled: false, queueStub: true })
    plugin.configResolved({ isProduction: true, command: 'build' })
    const page = `<html><head><script nonce="x">${QUEUE_STUB}</script></head><body></body></html>`
    expect(plugin.transformIndexHtml.handler(page, CTX)).toBe(page)
  })

  it('adds exactly one stub and nothing else in a real vite build with the tag off', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const dir = outDir()
    const props = vi.fn(() => ({ plan: 'pro' }))
    await viteBuild({
      root: APP,
      logLevel: 'silent',
      build: { outDir: dir, emptyOutDir: true },
      plugins: [privatusVitePlugin({ siteId: 'pa_VITE', enabled: false, queueStub: true, props })] as never,
    })
    const html = readFileSync(join(dir, 'index.html'), 'utf8')
    expect(html.split('window.privatus=window.privatus').length - 1).toBe(1)
    expect(html).not.toContain('pa.js')
    expect(html).not.toContain('privatusPageProps')
    expect(props).not.toHaveBeenCalled()
  }, 120_000)

  it('adds nothing for a development mode build', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const dir = outDir()
    await viteBuild({
      root: APP,
      mode: 'development',
      logLevel: 'silent',
      build: { outDir: dir, emptyOutDir: true },
      plugins: [privatusVitePlugin({ siteId: 'pa_VITE' })] as never,
    })
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).not.toContain('pa.js')
  }, 120_000)
})

describe('what VitePress itself does', () => {
  it('a VitePress build does not run transformIndexHtml, so the Vite plugin is for plain Vite apps', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const read = await buildDocs({ vitePlugins: [privatusVitePlugin({ siteId: 'pa_VITE', enabled: true })] })
    expect(read('index.html')).not.toContain('pa.js')
  }, 120_000)
})
