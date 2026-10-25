import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_HOST,
  createClient,
  hasTrackerScript,
  init,
  isOptedOut,
  loaderSnippet,
  optIn,
  optOut,
  pageview,
  props,
  queueStub,
  renderScriptTag,
  scriptAttributes,
  track,
  trackAsync,
} from '../src/index.js'

function reset() {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  delete (window as any).privatus
  delete (window as any).myns
  window.localStorage.clear()
}

/** Mimics pa.js start(): replace the stub with the API and replay the queue. */
function loadFakeTracker(ns = 'privatus') {
  const calls: unknown[][] = []
  let optedOut = false
  const api: any = {
    track: (...a: unknown[]) => {
      calls.push(['track', ...a])
      const cb = a.find((x) => typeof x === 'function') as (() => void) | undefined
      if (cb) cb()
    },
    pageview: (...a: unknown[]) => calls.push(['pageview', ...a]),
    props: (...a: unknown[]) => calls.push(['props', ...a]),
    optOut: () => { optedOut = true },
    optIn: () => { optedOut = false },
    isOptedOut: () => optedOut,
    ready: (fn: () => void) => fn(),
  }
  const queued = (window as any)[ns]?.q ?? []
  ;(window as any)[ns] = api
  queued.forEach((c: [string, unknown[]]) => api[c[0]].apply(api, c[1]))
  return calls
}

describe('scriptAttributes', () => {
  it('loads the hosted script from the tracker host, not the website', () => {
    expect(DEFAULT_HOST).toBe('https://privatusstats.com')
  })

  it('maps the minimal options', () => {
    expect(scriptAttributes({ site: 'pa_123' })).toEqual({
      src: 'https://privatusstats.com/js/pa.js',
      defer: '',
      'data-site': 'pa_123',
    })
  })

  it('maps every option to data-* attributes', () => {
    expect(
      scriptAttributes({
        site: 'pa_1',
        api: 'https://privatusanalytics.test/',
        spa: 'hash',
        manual: true,
        modules: ['engage', 'vitals'],
        domains: ['example.com', 'www.example.com'],
        exclude: ['/admin/*'],
        mask: { '/u/*': '/u/:id', '/o/*': '/o/:id' },
        params: ['q'],
        canonical: true,
        hash: true,
        props: 'getProps',
        namespace: 'myns',
        debug: true,
        allowLocal: true,
        nonce: 'abc',
      }),
    ).toEqual({
      src: 'https://privatusanalytics.test/js/pa.js',
      defer: '',
      'data-site': 'pa_1',
      'data-api': 'https://privatusanalytics.test',
      'data-spa': 'hash',
      'data-manual': 'true',
      'data-modules': 'engage,vitals',
      'data-domains': 'example.com,www.example.com',
      'data-exclude': '/admin/*',
      'data-mask': '/u/*->/u/:id,/o/*->/o/:id',
      'data-params': 'q',
      'data-canonical': 'true',
      'data-hash': 'true',
      'data-props': 'getProps',
      'data-namespace': 'myns',
      'data-debug': 'true',
      'data-allow-local': 'true',
      nonce: 'abc',
    })
  })

  it('keeps an empty modules list (= no modules) and a custom api/src', () => {
    const attrs = scriptAttributes({ site: 'pa_1', modules: [], api: 'https://privatusanalytics.test' })
    expect(attrs['data-modules']).toBe('')
    expect(attrs.src).toBe('https://privatusanalytics.test/js/pa.js')
    expect(attrs['data-api']).toBe('https://privatusanalytics.test')
    expect(scriptAttributes({ site: 'pa_1', src: '/x.js' }).src).toBe('/x.js')
  })

  it('accepts mask as an array and can drop defer', () => {
    const attrs = scriptAttributes({ site: 'pa_1', mask: ['/a/*->/a/:id'], defer: false })
    expect(attrs['data-mask']).toBe('/a/*->/a/:id')
    expect('defer' in attrs).toBe(false)
  })

  it('requires site', () => {
    expect(() => scriptAttributes({} as any)).toThrow(/site/)
  })

  it('renders an escaped script tag', () => {
    expect(renderScriptTag({ site: 'pa_"x<' })).toBe(
      '<script src="https://privatusstats.com/js/pa.js" defer data-site="pa_&quot;x&lt;"></script>',
    )
  })

  it('renders the queue stub', () => {
    expect(queueStub('myns')).toBe('window["myns"]=window["myns"]||{q:[]};')
  })
})

describe('init', () => {
  beforeEach(reset)
  afterEach(reset)

  it('injects the script once with matching attributes', () => {
    init({ site: 'pa_1', modules: ['engage', 'vitals'] })
    init({ site: 'pa_1', modules: ['engage', 'vitals'] })
    const scripts = document.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('src')).toBe('https://privatusstats.com/js/pa.js')
    expect(scripts[0].getAttribute('data-site')).toBe('pa_1')
    expect(scripts[0].getAttribute('data-modules')).toBe('engage,vitals')
    expect(scripts[0].defer).toBe(true)
    expect(hasTrackerScript()).toBe(true)
  })

  it('does not inject when a server-rendered tag already exists', () => {
    document.head.innerHTML = renderScriptTag({ site: 'pa_1' })
    init({ site: 'pa_1' })
    expect(document.querySelectorAll('script')).toHaveLength(1)
  })

  it('queues calls made before pa.js loads as [method, args]', () => {
    track('early')
    init({ site: 'pa_1' })
    track('signup', { plan: 'pro' })
    pageview({ props: { a: 1 } })
    props({ theme: 'dark' })
    expect((window as any).privatus.q).toEqual([
      ['track', ['early', {}]],
      ['track', ['signup', { plan: 'pro' }]],
      ['pageview', [{ props: { a: 1 } }]],
      ['props', [{ theme: 'dark' }]],
    ])
  })

  it('replays the queue into pa.js and then calls it directly', () => {
    init({ site: 'pa_1' })
    track('queued', { a: 1 })
    const calls = loadFakeTracker()
    track('direct')
    expect(calls).toEqual([
      ['track', 'queued', { a: 1 }],
      ['track', 'direct', {}],
    ])
    expect(createClient().isLoaded()).toBe(true)
  })

  it('uses a custom namespace', () => {
    const client = init({ site: 'pa_1', namespace: 'myns' })
    client.track('x')
    expect((window as any).myns.q).toEqual([['track', ['x', {}]]])
    expect((window as any).privatus).toBeUndefined()
    expect(document.querySelector('script')!.getAttribute('data-namespace')).toBe('myns')
  })

  it('trackAsync resolves via the callback or the timeout', async () => {
    init({ site: 'pa_1' })
    vi.useFakeTimers()
    const pending = trackAsync('slow', {}, 500)
    vi.advanceTimersByTime(500)
    await expect(pending).resolves.toBeUndefined()
    vi.useRealTimers()
    loadFakeTracker()
    await expect(trackAsync('fast')).resolves.toBeUndefined()
  })
})

describe('opt-out', () => {
  beforeEach(reset)

  it('reads the pa.js opt-out flag before load and honours queued calls', () => {
    expect(isOptedOut()).toBe(false)
    window.localStorage.setItem('privatus_optout', '1')
    expect(isOptedOut()).toBe(true)
    window.localStorage.clear()
    optOut()
    expect(isOptedOut()).toBe(true)
    optIn()
    expect(isOptedOut()).toBe(false)
    expect((window as any).privatus.q).toEqual([['optOut', []], ['optIn', []]])
  })

  it('delegates to pa.js once loaded', () => {
    loadFakeTracker()
    optOut()
    expect(isOptedOut()).toBe(true)
  })

  it('never writes cookies or storage itself', () => {
    init({ site: 'pa_1' })
    track('x')
    optOut()
    pageview()
    expect(document.cookie).toBe('')
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })
})

describe('loaderSnippet', () => {
  beforeEach(reset)

  it('installs the stub and injects pa.js once when evaluated', () => {
    const code = loaderSnippet({ site: 'pa_1', api: 'https://privatusanalytics.test' })
    new Function(code)()
    new Function(code)()
    const scripts = document.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0].getAttribute('src')).toBe('https://privatusanalytics.test/js/pa.js')
    expect(scripts[0].getAttribute('data-api')).toBe('https://privatusanalytics.test')
    expect((window as any).privatus.q).toEqual([])
    init({ site: 'pa_1', api: 'https://privatusanalytics.test' })
    expect(document.querySelectorAll('script')).toHaveLength(1)
  })

  it('escapes </script> in values', () => {
    expect(loaderSnippet({ site: '</script>' })).not.toContain('</script>')
  })
})
