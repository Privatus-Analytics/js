import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Eleventy from '@11ty/eleventy'
import { afterEach, describe, expect, it, vi } from 'vitest'
import privatus, { QUEUE_STUB, privatusPlugin, type PrivatusEleventyOptions } from '../src/index.js'

const SITE = fileURLToPath(new URL('./site', import.meta.url))
const SNIPPET = '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_TEST123456"></script>'
const outputs: string[] = []

afterEach(() => {
  while (outputs.length) rmSync(outputs.pop()!, { recursive: true, force: true })
  vi.unstubAllEnvs()
})

async function build(options: PrivatusEleventyOptions): Promise<(path: string) => string> {
  const output = mkdtempSync(join(tmpdir(), 'privatus-eleventy-'))
  outputs.push(output)
  // A fresh copy of the site for each build: Eleventy keeps compiled layouts between
  // builds in one process, keyed by path, so a reused folder could keep an old shortcode.
  const input = mkdtempSync(join(tmpdir(), 'privatus-eleventy-src-'))
  outputs.push(input)
  cpSync(SITE, input, { recursive: true })
  const eleventy = new Eleventy(input, output, {
    quietMode: true,
    config(eleventyConfig: { addPlugin: (plugin: unknown, options: unknown) => void }) {
      eleventyConfig.addPlugin(privatus, { siteId: 'pa_TEST123456', ...options })
    },
  })
  await eleventy.write()
  return (path) => readFileSync(join(output, path), 'utf8')
}

describe('eleventy-plugin-privatus in a real Eleventy build', () => {
  it('puts the tag before </head> on every HTML page of a build', async () => {
    const read = await build({})
    expect(read('index.html')).toContain(`${SNIPPET}\n</head>`)
    expect(read('liquid/index.html')).toContain(`${SNIPPET}\n</head>`)
  })

  it('leaves files that are not HTML alone', async () => {
    const read = await build({})
    expect(read('feed.xml')).not.toContain('pa.js')
  })

  it('does not add a second tag when the layout uses the shortcode, and the shortcode takes props', async () => {
    const read = await build({})
    const docs = read('docs/index.html')
    expect(docs.split('/js/pa.js')).toHaveLength(2)
    expect(docs).toContain('window.privatusPageProps=function(){return {"section":"docs"}}')
  })

  it('event and click shortcodes work in Nunjucks and Liquid', async () => {
    const read = await build({ enabled: false })
    const home = read('index.html')
    expect(home).toContain(
      '<button data-privatus-event="Report exported" data-privatus-prop-format="csv" data-privatus-prop-report_type="monthly">Export</button>',
    )
    expect(home).toContain('<a href="/pricing/" data-privatus-click="pricing.cta">See plans</a>')
    expect(home).not.toContain('pa.js')
    const liquid = read('liquid/index.html')
    expect(liquid).toContain('<form data-privatus-event="Newsletter joined" data-privatus-prop-list="weekly"></form>')
    expect(liquid).toContain('<a data-privatus-click="nav.home">Home</a>')
  })

  it('page props can be a function of the page', async () => {
    const read = await build({ props: (page) => ({ section: String(page.url).split('/')[1] || 'home' }), queueStub: true })
    const page = read('liquid/index.html')
    expect(page).toContain('{"section":"liquid"}')
    expect(page).toContain('data-props="privatusPageProps"')
    expect(page).toContain("window.privatus=window.privatus||{q:[]}")
  })

  it('prints nothing without a site id', async () => {
    const read = await build({ siteId: null })
    expect(read('index.html')).not.toContain('pa.js')
  })

  const PAGES = ['index.html', 'liquid/index.html', 'docs/index.html']
  const count = (html: string, part: string) => html.split(part).length - 1

  it('when off with the queue stub, every page gets exactly one stub and nothing else', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const read = await build({ enabled: false, queueStub: true, props })
    for (const path of PAGES) {
      const html = read(path)
      expect(count(html, `<script>${QUEUE_STUB}</script>`), path).toBe(1)
      expect(count(html, 'window.privatus=window.privatus'), path).toBe(1)
      expect(html, path).not.toContain('/js/pa.js')
      expect(html, path).not.toContain('privatusPageProps')
      expect(html, path).not.toContain('data-props')
    }
    expect(read('index.html')).toContain(`<script>${QUEUE_STUB}</script>\n</head>`)
    expect(props).not.toHaveBeenCalled()
  })

  it('a page whose layout also uses the shortcode still gets one stub when off', async () => {
    const read = await build({ enabled: false, queueStub: true })
    expect(count(read('docs/index.html'), 'window.privatus=window.privatus')).toBe(1)
  })

  it('without a site id and with the queue stub, every page gets only the stub', async () => {
    const read = await build({ siteId: null, queueStub: true })
    for (const path of PAGES) {
      expect(count(read(path), 'window.privatus=window.privatus'), path).toBe(1)
      expect(read(path), path).not.toContain('/js/pa.js')
    }
  })

  it('when off without the queue stub, no page gets anything', async () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const read = await build({ enabled: false, props })
    for (const path of PAGES) {
      expect(read(path), path).not.toContain('window.privatus')
      expect(read(path), path).not.toContain('/js/pa.js')
    }
    expect(props).not.toHaveBeenCalled()
  })

  it('autoInject: false leaves pages to the shortcode', async () => {
    const read = await build({ autoInject: false })
    expect(read('index.html')).not.toContain('pa.js')
    expect(read('docs/index.html')).toContain(SNIPPET.replace('"></script>', '" data-props="privatusPageProps"></script>'))
  })
})

describe('run mode', () => {
  function fakeConfig() {
    const shortcodes: Record<string, (...args: any[]) => string> = {}
    const transforms: Array<(content: string) => string> = []
    return {
      shortcodes,
      transforms,
      addShortcode: (name: string, fn: (...args: any[]) => string) => {
        shortcodes[name] = fn
      },
      addTransform: (_name: string, fn: (content: string) => string) => {
        transforms.push(fn)
      },
    }
  }

  it('is off with --serve and --watch, on in a build', () => {
    const config = fakeConfig()
    privatusPlugin(config, { siteId: 'pa_TEST123456' })
    const page = { page: { outputPath: '_site/index.html', url: '/' } }
    for (const mode of ['serve', 'watch']) {
      vi.stubEnv('ELEVENTY_RUN_MODE', mode)
      expect(config.transforms[0].call(page, '<head></head>')).toBe('<head></head>')
    }
    vi.stubEnv('ELEVENTY_RUN_MODE', 'build')
    expect(config.transforms[0].call(page, '<head></head>')).toBe(`<head>${SNIPPET}\n</head>`)
    expect(config.shortcodes.privatusAnalyticsTag.call(page)).toBe(SNIPPET)
  })

  it('when off, the shortcode and the transform print only the queue stub (when on)', () => {
    const props = vi.fn(() => ({ plan: 'pro' }))
    const config = fakeConfig()
    privatusPlugin(config, { siteId: 'pa_TEST123456', queueStub: true, props })
    const page = { page: { outputPath: '_site/index.html', url: '/' } }
    vi.stubEnv('ELEVENTY_RUN_MODE', 'serve')
    expect(config.shortcodes.privatusAnalyticsTag.call(page)).toBe(`<script>${QUEUE_STUB}</script>`)
    expect(config.shortcodes.privatusAnalyticsTag.call(page, { queueStub: false })).toBe('')
    expect(config.transforms[0].call(page, '<head></head>')).toBe(`<head><script>${QUEUE_STUB}</script>\n</head>`)
    // A page that already prints the stub (from the shortcode, with or without a nonce) is left alone.
    const printed = `<head><script nonce="n1">${QUEUE_STUB}</script></head>`
    expect(config.transforms[0].call(page, printed)).toBe(printed)
    // A stub only shown as text in a code block does not count.
    const shown = `<head></head><pre>&lt;script&gt;${QUEUE_STUB}&lt;/script&gt;</pre>`
    expect(config.transforms[0].call(page, shown)).toContain(`<script>${QUEUE_STUB}</script>\n</head>`)
    vi.stubEnv('ELEVENTY_RUN_MODE', 'build')
    expect(config.shortcodes.privatusAnalyticsTag.call(page, { enabled: false, nonce: 'abc' })).toBe(`<script nonce="abc">${QUEUE_STUB}</script>`)
    expect(props).not.toHaveBeenCalled()
  })

  it('without a site id, the shortcode prints only the queue stub and the transform adds nothing', () => {
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    vi.stubEnv('ELEVENTY_RUN_MODE', 'build')
    const config = fakeConfig()
    privatusPlugin(config, { queueStub: true, props: { plan: 'pro' } })
    const page = { page: { outputPath: '_site/index.html', url: '/' } }
    expect(config.shortcodes.privatusAnalyticsTag.call(page)).toBe(`<script>${QUEUE_STUB}</script>`)
    expect(config.transforms[0].call(page, '<head></head>')).toBe(`<head><script>${QUEUE_STUB}</script>\n</head>`)
  })

  it('when off without the queue stub, the transform adds nothing', () => {
    const config = fakeConfig()
    privatusPlugin(config, { siteId: 'pa_TEST123456' })
    vi.stubEnv('ELEVENTY_RUN_MODE', 'serve')
    expect(config.transforms[0].call({ page: { outputPath: '_site/index.html' } }, '<head></head>')).toBe('<head></head>')
  })

  it('warns about a bad click name outside a build', () => {
    vi.stubEnv('ELEVENTY_RUN_MODE', 'serve')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = fakeConfig()
    privatusPlugin(config, {})
    expect(config.shortcodes.privatusClickAttr('not ok')).toBe('')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
