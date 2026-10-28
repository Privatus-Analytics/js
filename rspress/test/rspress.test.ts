import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RspressPlugin, UserConfig } from '@rspress/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QUEUE_STUB } from '@privatus-analytics/html-core'
import pluginDefault, { DEFAULT_MODULES, pluginPrivatus, type HeadEntry, type PrivatusRspressOptions, type RouteMeta } from '../src/index.js'

const DOCS = fileURLToPath(new URL('./site/docs', import.meta.url))

const route = (routePath = '/', lang = ''): RouteMeta => ({ routePath, pureRoutePath: routePath, absolutePath: '/docs/index.md', relativePath: 'index.md', pageName: 'index', lang, version: '' })

/** The head entry the plugin adds, called for one route. */
function headFor(options: PrivatusRspressOptions, isProd: boolean, r: RouteMeta = route()): string | undefined {
  const input: UserConfig = { head: ['<meta name="x" content="y">'] }
  const config = pluginPrivatus(options).config(input, {}, isProd)
  expect(config.head).toHaveLength(2)
  expect(config.head![0]).toBe('<meta name="x" content="y">')
  const entry = config.head![1] as unknown as Extract<HeadEntry, (route: RouteMeta) => unknown>
  return entry(r) as string | undefined
}

afterEach(() => vi.unstubAllEnvs())

describe('rspress-plugin-privatus', () => {
  it('is an Rspress plugin that adds the script with the default modules in production builds', () => {
    const plugin: RspressPlugin = pluginPrivatus({ siteId: 'pa_RS' })
    expect(plugin.name).toBe('rspress-plugin-privatus')
    expect(pluginDefault).toBe(pluginPrivatus)
    expect(headFor({ siteId: 'pa_RS' }, true)).toBe(
      '<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_RS" data-modules="engage,auto,vitals,clicks,ask"></script>',
    )
    expect(DEFAULT_MODULES).toEqual(['engage', 'auto', 'vitals', 'clicks', 'ask'])
  })

  it('adds nothing during rspress dev', () => {
    expect(headFor({ siteId: 'pa_RS' }, false)).toBeUndefined()
    expect(headFor({ siteId: 'pa_RS', enabled: true }, false)).toContain('pa.js')
    expect(headFor({ siteId: 'pa_RS', enabled: false }, true)).toBeUndefined()
  })

  it('keeps a config without head working', () => {
    const input: UserConfig = { title: 'Docs' }
    const config = pluginPrivatus({ siteId: 'pa_RS' }).config(input, {}, true)
    expect(config.title).toBe('Docs')
    expect(config.head).toHaveLength(1)
  })

  it('adds nothing without a site id, and reads PRIVATUS_SITE_ID', () => {
    vi.stubEnv('PRIVATUS_SITE_ID', '')
    expect(headFor({}, true)).toBeUndefined()
    vi.stubEnv('PRIVATUS_SITE_ID', 'pa_ENV')
    expect(headFor({}, true)).toContain('data-site="pa_ENV"')
  })

  it('modules and the other tracker settings can be changed', () => {
    const html = headFor({ siteId: 'pa_RS', modules: ['engage'], excludedPaths: ['/drafts/*'], domains: ['example.com'], spa: 'history', manual: true, scriptHost: 'https://stats.example.com' }, true)!
    expect(html).toContain('src="https://stats.example.com/js/pa.js"')
    expect(html).toContain('data-modules="engage"')
    expect(html).toContain('data-exclude="/drafts/*"')
    expect(html).toContain('data-domains="example.com"')
    expect(html).toContain('data-spa="history"')
    expect(html).toContain('data-manual="true"')
    expect(headFor({ siteId: 'pa_RS', modules: [] }, true)).toContain('data-modules=""')
  })

  it('page props come from each route, and the props function only runs when the tag prints', () => {
    const props = vi.fn((r: RouteMeta) => ({ lang: r.lang || 'en' }))
    const zh = headFor({ siteId: 'pa_RS', props }, true, route('/zh/', 'zh'))!
    expect(zh).toContain('window.privatusPageProps=function(){return {"lang":"zh"}}')
    expect(zh).toContain('data-props="privatusPageProps"')
    props.mockClear()
    expect(headFor({ siteId: 'pa_RS', props }, false)).toBeUndefined()
    expect(props).not.toHaveBeenCalled()
  })

  it('when off, adds only the queue stub (when it is on)', () => {
    const html = headFor({ siteId: 'pa_RS', queueStub: true, props: { section: 'docs' } }, false)!
    expect(html).toContain(QUEUE_STUB)
    expect(html).not.toContain('pa.js')
    expect(html).not.toContain('privatusPageProps')
  })

  it('adds the tag to every page in a real rspress build, with props from the route', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'privatus-rspress-'))
    try {
      const { build } = await import('@rspress/core')
      const config: UserConfig = {
        root: DOCS,
        outDir,
        title: 'Test',
        plugins: [pluginPrivatus({ siteId: 'pa_RS', props: (r) => ({ page: r.routePath }) })],
      }
      await build({ docDirectory: DOCS, config })
      for (const [file, page] of [['index.html', '/'], ['guide/start.html', '/guide/start']]) {
        const html = readFileSync(join(outDir, file), 'utf8')
        const head = html.slice(0, html.indexOf('</head>'))
        expect(head).toContain('<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_RS" data-modules="engage,auto,vitals,clicks,ask" data-props="privatusPageProps"></script>')
        expect(head).toContain(`return {"page":"${page}"}`)
        expect(html.match(/\/js\/pa\.js/g)).toHaveLength(1)
      }
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 120_000)
})
