import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The real tracker, not a stub: these pin how pa.js retries failed hits, in
// the source and in the minified file that sites load.
// Copies from the app repo, see fixtures/README.md.
const FIXTURES = resolve(__dirname, 'fixtures')
const SCRIPTS = {
  'tracker/src/pa.js': readFileSync(resolve(FIXTURES, 'pa.src.js'), 'utf8'),
  'public/js/pa.js': readFileSync(resolve(FIXTURES, 'pa.min.js'), 'utf8'),
}
let script: keyof typeof SCRIPTS

type Answer = number | Error | Promise<{ status: number }>

let answers: Answer[] = []
const fetchMock = vi.fn((_url: string, _init: { body: string }) => {
  // The last answer repeats.
  const answer = answers.length > 1 ? answers.shift()! : answers[0]
  if (answer instanceof Error) return Promise.reject(answer)
  return typeof answer === 'number' ? Promise.resolve({ status: answer }) : answer
})

/** Runs pa.js as the page's tracker script. Hits only go out through track(). */
function loadTracker() {
  const el = document.createElement('script')
  const attributes = { site: 'pa_1', api: 'https://collect.test', manual: 'true', modules: '', spa: 'off', 'allow-local': 'true' }
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(`data-${name}`, value))
  Object.defineProperty(document, 'currentScript', { configurable: true, get: () => el })
  new Function(SCRIPTS[script])()
  return (window as any).privatus
}

/** Event names of every request so far, in the order they were sent. */
function sent() {
  return fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).n)
}

const wait = (ms: number) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  window.localStorage.clear()
  delete (window as any).privatus
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe.each(Object.keys(SCRIPTS) as Array<keyof typeof SCRIPTS>)('%s retries', (name) => {
  beforeEach(() => { script = name })

  it('sends an accepted hit once', async () => {
    answers = [202]
    loadTracker().track('signup')
    await wait(600_000)
    expect(sent()).toEqual(['signup'])
    expect(fetchMock.mock.calls[0][0]).toBe('https://collect.test/api/event')
  })

  it('retries a 500 after 1s, 10s, 60s, 60s and 60s, then gives up', async () => {
    answers = [500]
    loadTracker().track('signup')
    await wait(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const delays = [1_000, 10_000, 60_000, 60_000, 60_000]
    for (const [retry, delay] of delays.entries()) {
      await wait(delay - 1)
      expect(fetchMock).toHaveBeenCalledTimes(retry + 1)
      await wait(1)
      expect(fetchMock).toHaveBeenCalledTimes(retry + 2)
    }

    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(6)
    const bodies = fetchMock.mock.calls.map(([, init]) => init.body)
    expect(new Set(bodies).size).toBe(1)
  })

  it('retries a 429 until the server accepts the hit', async () => {
    answers = [429, 429, 202]
    loadTracker().track('signup')
    await wait(1_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    await wait(10_000)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry a rejected request (blocked, offline)', async () => {
    answers = [new TypeError('Failed to fetch')]
    loadTracker().track('signup')
    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries failed hits oldest first, one at a time', async () => {
    let accept = (_response: { status: number }) => {}
    const pending = new Promise<{ status: number }>((resolve) => { accept = resolve })
    answers = [503, 503, 503, pending, 503, 202]
    const tracker = loadTracker()
    ;['a', 'b', 'c'].forEach((name) => tracker.track(name))

    await wait(1_000)
    expect(sent()).toEqual(['a', 'b', 'c', 'a'])

    // A hit that fails while a retry is in flight joins the back of the queue.
    tracker.track('d')
    await wait(600_000)
    expect(sent()).toEqual(['a', 'b', 'c', 'a', 'd'])

    accept({ status: 202 })
    await wait(0)
    expect(sent()).toEqual(['a', 'b', 'c', 'a', 'd', 'b', 'c', 'd'])
  })

  it('moves on to the next hit when a retry is rejected', async () => {
    answers = [500, 500, new TypeError('Failed to fetch'), 202]
    const tracker = loadTracker()
    ;['a', 'b'].forEach((name) => tracker.track(name))
    await wait(1_000)
    expect(sent()).toEqual(['a', 'b', 'a'])
    await wait(1_000)
    expect(sent()).toEqual(['a', 'b', 'a', 'b'])
    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('keeps at most 20 failed hits', async () => {
    answers = [500]
    const tracker = loadTracker()
    const names = Array.from({ length: 25 }, (_, i) => `e${i}`)
    names.forEach((name) => tracker.track(name))
    await wait(0)
    expect(fetchMock).toHaveBeenCalledTimes(25)

    answers = [202]
    await wait(1_000)
    expect(sent().slice(25)).toEqual(names.slice(0, 20))
  })

  it('drops the queue when the visitor opts out', async () => {
    answers = [500]
    const tracker = loadTracker()
    tracker.track('signup')
    await wait(0)
    tracker.optOut()
    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    tracker.optIn()
    await wait(600_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('calls the track callback once, after the first attempt', async () => {
    answers = [500, 202]
    const callback = vi.fn()
    loadTracker().track('signup', { plan: 'pro' }, callback)
    await wait(0)
    expect(callback).toHaveBeenCalledTimes(1)
    await wait(1_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
