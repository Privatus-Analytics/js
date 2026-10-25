import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Eleventy from '@11ty/eleventy'
import { afterEach, describe, expect, it, vi } from 'vitest'
import privatus, { privatusPlugin, type PrivatusEleventyOptions } from '../src/index.js'

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
  const eleventy = new Eleventy(SITE, output, {
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
