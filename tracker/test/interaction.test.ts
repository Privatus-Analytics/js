import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The real tracker, not a stub: these pin how pa.js reports whether a real
// input happened on the page (the `i` flag), in the source and in the
// minified file that sites load.
const ROOT = resolve(__dirname, '../../../..')
const SCRIPTS = {
  'tracker/src/pa.js': readFileSync(resolve(ROOT, 'tracker/src/pa.js'), 'utf8'),
  'public/js/pa.js': readFileSync(resolve(ROOT, 'public/js/pa.js'), 'utf8'),
}
let script: keyof typeof SCRIPTS

const fetchMock = vi.fn((_url: string, _init: { body: string }) => Promise.resolve({ status: 202 }))

type Listener = (event: { type: string; isTrusted: boolean }) => void
let listeners: Record<string, Listener[]> = {}

/** Runs pa.js as the page's tracker script. It sends the first pageview itself. */
function loadTracker(overrides: Record<string, string> = {}) {
  const el = document.createElement('script')
  const attributes = { site: 'pa_1', api: 'https://collect.test', spa: 'off', 'allow-local': 'true', ...overrides }
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(`data-${name}`, value))
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => el })
  new Function(SCRIPTS[script])()
  return (window as any).privatus
}

/** Every hit sent so far, oldest first. */
function hits() {
  return fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body))
}

/**
 * Hands the tracker's window listeners an event. jsdom cannot dispatch a
 * trusted event, so the listeners are called directly.
 */
function fire(type: string, isTrusted = true) {
  ;(listeners[type] || []).slice().forEach((listener) => listener({ type, isTrusted }))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  window.localStorage.clear()
  delete (window as any).privatus
  listeners = {}
  vi.spyOn(window, 'addEventListener').mockImplementation((type: string, listener: any) => {
    ;(listeners[type] ||= []).push(listener)
  })
  vi.spyOn(window, 'removeEventListener').mockImplementation((type: string, listener: any) => {
    listeners[type] = (listeners[type] || []).filter((known) => known !== listener)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe.each(Object.keys(SCRIPTS) as Array<keyof typeof SCRIPTS>)('%s interaction flag', (name) => {
  beforeEach(() => { script = name })

  it('says no input was seen on the first pageview', () => {
    loadTracker()
    expect(hits()).toHaveLength(1)
    expect(hits()[0]).toMatchObject({ t: 'pageview', i: 0 })
  })

  it.each(['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'])('reports the first %s at once', (type) => {
    loadTracker()
    fire(type)
    expect(hits()).toHaveLength(2)
    expect(hits()[1]).toMatchObject({ t: 'engagement', i: 1 })
  })

  it('reports input once, then keeps the flag on every later hit', () => {
    const tracker = loadTracker()
    fire('pointermove')
    fire('pointermove')
    fire('keydown')
    expect(hits()).toHaveLength(2)

    tracker.track('signup')
    tracker.pageview()
    expect(hits().slice(2).map((hit) => [hit.t, hit.i])).toEqual([['event', 1], ['pageview', 1]])
  })

  it('ignores scripted input', () => {
    const tracker = loadTracker()
    fire('pointermove', false)
    fire('keydown', false)
    tracker.track('signup')
    expect(hits().map((hit) => [hit.t, hit.i])).toEqual([['pageview', 0], ['event', 0]])
  })

  it('does not count a scroll as input: a script can scroll', () => {
    const tracker = loadTracker()
    fire('scroll')
    tracker.track('signup')
    expect(hits().map((hit) => hit.i)).toEqual([0, 0])
  })

  it('reports input when engagement tracking is off', () => {
    loadTracker({ modules: '' })
    fire('touchstart')
    expect(hits()).toHaveLength(2)
    expect(hits()[1]).toMatchObject({ t: 'engagement', e: 0, i: 1 })
    expect(hits()[1]).not.toHaveProperty('sd')
  })

  it('waits for the pageview when input comes first', () => {
    const tracker = loadTracker({ manual: 'true' })
    fire('pointerdown')
    expect(hits()).toHaveLength(0)
    tracker.pageview()
    expect(hits()).toHaveLength(1)
    expect(hits()[0]).toMatchObject({ t: 'pageview', i: 1 })
  })

  it('sends a yes or no, never the input itself', () => {
    loadTracker()
    fire('pointermove')
    const allowed = ['s', 't', 'u', 'l', 'w', 'r', 'p', 'e', 'sd', 'i']
    hits().forEach((hit) => expect(allowed).toEqual(expect.arrayContaining(Object.keys(hit))))
  })
})
