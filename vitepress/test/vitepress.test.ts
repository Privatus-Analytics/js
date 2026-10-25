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

  it('adds nothing when the tag is off, not even the queue stub', () => {
    const page = '<html><head></head><body></body></html>'
    const ctx = { path: '/index.html', filename: '/app/index.html' } as never
    const dev = privatusVitePlugin({ siteId: 'pa_VITE', queueStub: true })
    dev.configResolved({ isProduction: false })
    expect(dev.transformIndexHtml.handler(page, ctx)).toBe(page)
    const off = privatusVitePlugin({ siteId: 'pa_VITE', queueStub: true, enabled: false })
    off.configResolved({ isProduction: true })
    expect(off.transformIndexHtml.handler(page, ctx)).toBe(page)
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    const noSite = privatusVitePlugin({ queueStub: true })
    noSite.configResolved({ isProduction: true })
    expect(noSite.transformIndexHtml.handler(page, ctx)).toBe(page)
  })

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
