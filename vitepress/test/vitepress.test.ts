import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build as viteBuild } from 'vite'
import { build as vitepressBuild } from 'vitepress'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { privatusHead, privatusTransformHead, privatusVitePlugin } from '../src/index.js'

const SITE = fileURLToPath(new URL('./vp-site', import.meta.url))
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
      ['script', {}, 'window.privatusPageProps=function(){return {"plan":"pro"}}'],
      ['script', { defer: '', src: 'https://privatusstats.com/js/pa.js', 'data-site': 'pa_VP', 'data-props': 'privatusPageProps' }],
    ])
    expect(privatusHead({})).toEqual([])
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
    // VitePress minifies inline head scripts, so the JSON comes back as plain JavaScript.
    const home = read('index.html')
    expect(home).toMatch(/<script>window\.privatusPageProps=function\(\)\{return ?\{"?section"?: ?"home"/)
    expect(home).not.toContain('"</script>')
    expect(home.split('</script>').length).toBe(read('index.html').split('<script').length)
    const guide = read('guide/start.html')
    expect(guide).toMatch(/section"?: ?"guide"/)
    expect(guide).toContain('<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_VP" data-props="privatusPageProps"></script>')
  }, 120_000)

  it('can be switched off', () => {
    const hook = privatusTransformHead({ siteId: 'pa_VP', enabled: false })
    expect(hook({ page: 'index.md', pageData: { relativePath: 'index.md' } })).toEqual([])
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
