// Tests the built file in dist/, the one Directus loads.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// happy-dom changes import.meta.url, so paths start from the package folder.
const distFile = resolve(process.cwd(), 'dist/index.js')
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))

let panel: any

beforeAll(async () => {
  if (!existsSync(distFile)) throw new Error('Run npm run build first')
  panel = (await import(distFile)).default
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function stubApi(responses: Record<string, Response | (() => Response)>) {
  const calls: { url: string; init?: RequestInit }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const key = Object.keys(responses).find((k) => url.includes(k))
    if (!key) return json(404, { error: { message: 'not found' } })
    const value = responses[key]!
    return typeof value === 'function' ? value() : value.clone()
  }))
  return calls
}

const props = { token: 'pat_test', siteId: 'pa_ABC123', period: '30d', topPages: 3 }

describe('package', () => {
  it('declares a panel extension the way the Directus marketplace reads it', () => {
    expect(pkg['directus:extension']).toMatchObject({ type: 'panel', path: 'dist/index.js', source: 'src/index.ts' })
    expect(pkg['directus:extension'].host).toContain('^11.0.0')
    expect(pkg.keywords).toEqual(expect.arrayContaining(['directus', 'directus-extension', 'directus-extension-panel']))
    expect(pkg.files).toContain('dist')
  })
})

describe('built panel', () => {
  it('exports the panel config with its options', () => {
    expect(panel.id).toBe('privatus-analytics')
    expect(panel.name).toBe('Privatus Analytics')
    expect(typeof panel.component).toBe('object')
    expect(panel.options.map((o: any) => o.field)).toEqual(['token', 'siteId', 'period', 'topPages'])
    expect(panel.options[0].meta.options.masked).toBe(true)
    expect(panel.minWidth).toBeGreaterThan(0)
  })

  it('shows visitors, pageviews, the change and the top pages', async () => {
    const calls = stubApi({
      '/stats/aggregate.json': json(200, {
        data: { period: {}, metrics: { visitors: 1204, visits: 1390, pageviews: 3310 }, change: { visitors: 12.14, pageviews: -3 } },
        meta: {},
      }),
      '/breakdown/page.json': json(200, {
        data: { rows: [{ value: '/', pageviews: 980, visits: 700, share: 30 }, { value: '/pricing', pageviews: 402, visits: 300, share: 12 }] },
        meta: {},
      }),
    })
    const wrapper = mount(panel.component, { props })
    await flushPromises()

    expect(calls.map((c) => c.url)).toEqual([
      'https://privatusanalytics.com/sites/pa_ABC123/stats/aggregate.json?period=30d&compare=previous_period',
      'https://privatusanalytics.com/sites/pa_ABC123/breakdown/page.json?period=30d&limit=3',
    ])
    expect((calls[0]!.init!.headers as Record<string, string>).Authorization).toBe('Bearer pat_test')
    expect(wrapper.find('[data-metric="visitors"]').text()).toBe(new Intl.NumberFormat().format(1204))
    expect(wrapper.find('[data-metric="pageviews"]').text()).toBe(new Intl.NumberFormat().format(3310))
    expect(wrapper.text()).toContain('+12.1%')
    expect(wrapper.text()).toContain('-3%')
    const pages = wrapper.findAll('.privatus-page').map((li) => li.text())
    expect(pages).toEqual([`/${new Intl.NumberFormat().format(980)}`, '/pricing402'])
  })

  it('shows the API error message, for example for a wrong token', async () => {
    stubApi({
      '/stats/aggregate.json': json(401, { error: { code: 'unauthorized', message: 'That API token is invalid, revoked or expired.' } }),
      '/breakdown/page.json': json(401, { error: { code: 'unauthorized', message: 'That API token is invalid, revoked or expired.' } }),
    })
    const wrapper = mount(panel.component, { props })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('That API token is invalid, revoked or expired.')
  })

  it('asks for the settings before calling the API', async () => {
    const calls = stubApi({})
    const noToken = mount(panel.component, { props: { ...props, token: '' } })
    await flushPromises()
    expect(noToken.text()).toContain('API token')
    const badSite = mount(panel.component, { props: { ...props, siteId: 'abc/../x' } })
    await flushPromises()
    expect(badSite.text()).toContain('pa_')
    expect(calls).toHaveLength(0)
  })

  it('skips the top pages call when top pages is 0, and loads again when the options change', async () => {
    const calls = stubApi({
      '/stats/aggregate.json': () => json(200, { data: { metrics: { visitors: 5, pageviews: 9 } }, meta: {} }),
    })
    const wrapper = mount(panel.component, { props: { ...props, topPages: 0 } })
    await flushPromises()
    expect(calls).toHaveLength(1)
    expect(wrapper.findAll('.privatus-page')).toHaveLength(0)
    await wrapper.setProps({ period: 'today' })
    await flushPromises()
    expect(calls).toHaveLength(2)
    expect(calls[1]!.url).toContain('period=today')
  })
})
