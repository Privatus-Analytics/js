/**
 * @privatus-analytics/tracker: typed loader and API for the Privatus Analytics
 * browser tracker (pa.js).
 *
 * - No cookies, localStorage, sessionStorage or device ids are added by this
 *   package. The only storage touched is pa.js's own user-initiated opt-out
 *   flag, which `isOptedOut()` reads before the script has loaded.
 * - Every function is a safe no-op on the server (no `window`).
 */
import { namespaceOf, scriptAttributes, type PrivatusOptions } from './attributes.js'

export * from './attributes.js'

export type PropValue = string | number | boolean | string[] | null | undefined
export type Props = Record<string, PropValue>

export interface PageviewOptions {
  props?: Props
}

type QueueEntry = [string, unknown[]]

interface Stub {
  q: QueueEntry[]
}

interface LoadedApi {
  track(name: string, props?: Props, callback?: () => void): void
  pageview(options?: PageviewOptions): void
  props(props: Props): void
  optOut(): void
  optIn(): void
  isOptedOut(): boolean
  ready(fn: () => void): void
}

export interface PrivatusClient {
  /** Send a custom event. `props.revenue` / `props.currency` record revenue. */
  track(name: string, props?: Props, callback?: () => void): void
  /** Like track(), resolving once the hit is sent or after `timeout` ms. */
  trackAsync(name: string, props?: Props, timeout?: number): Promise<void>
  /** Send a pageview for the current URL (useful with `manual: true`). */
  pageview(options?: PageviewOptions): void
  /** Set props sent with every following hit on this page load. */
  props(props: Props): void
  /** Stop tracking this browser (user-initiated; stored by pa.js). */
  optOut(): void
  /** Undo optOut(). */
  optIn(): void
  isOptedOut(): boolean
  /** Run `fn` once pa.js has loaded. */
  ready(fn: () => void): void
  /** True once pa.js has replaced the queue stub. */
  isLoaded(): boolean
  readonly namespace: string
}

const OPT_OUT_KEY = 'privatus_optout'
const INJECTED_ATTR = 'data-privatus-loader'

export const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined'

function target(ns: string): Stub | LoadedApi | undefined {
  if (!isBrowser()) return undefined
  const w = window as unknown as Record<string, Stub | LoadedApi | undefined>
  const current = w[ns]
  if (current && typeof (current as LoadedApi).track === 'function') return current
  if (current && Array.isArray((current as Stub).q)) return current
  const stub: Stub = { q: [] }
  w[ns] = stub
  return stub
}

function call(ns: string, method: keyof LoadedApi, args: unknown[]): void {
  const t = target(ns)
  if (!t) return
  const fn = (t as unknown as Record<string, unknown>)[method]
  if (typeof fn === 'function') {
    ;(fn as (...a: unknown[]) => void).apply(t, args)
  } else {
    ;(t as Stub).q.push([method, args])
  }
}

/** A client bound to a namespace. Works before and after pa.js loads. */
export function createClient(namespace = 'privatus'): PrivatusClient {
  const ns = namespace
  return {
    namespace: ns,
    track(name, props, callback) {
      if (!isBrowser()) return
      const args: unknown[] = [name, props || {}]
      if (callback) args.push(callback)
      call(ns, 'track', args)
    },
    trackAsync(name, props, timeout = 1000) {
      if (!isBrowser()) return Promise.resolve()
      return new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          resolve()
        }
        setTimeout(finish, timeout)
        call(ns, 'track', [name, props || {}, finish])
      })
    },
    pageview(options) {
      call(ns, 'pageview', options ? [options] : [])
    },
    props(props) {
      call(ns, 'props', [props])
    },
    optOut() {
      call(ns, 'optOut', [])
    },
    optIn() {
      call(ns, 'optIn', [])
    },
    isOptedOut() {
      const t = target(ns)
      if (!t) return false
      if (typeof (t as LoadedApi).isOptedOut === 'function') return (t as LoadedApi).isOptedOut()
      // Before load, read pa.js's own opt-out flag (the queued optOut/optIn
      // calls are applied on load, so account for the last one queued).
      const queued = (t as Stub).q.filter((e) => e[0] === 'optOut' || e[0] === 'optIn')
      if (queued.length) return queued[queued.length - 1][0] === 'optOut'
      try {
        return window.localStorage.getItem(OPT_OUT_KEY) === '1'
      } catch {
        return false
      }
    },
    ready(fn) {
      call(ns, 'ready', [fn])
    },
    isLoaded() {
      const t = target(ns)
      return !!t && typeof (t as LoadedApi).track === 'function'
    }
  }
}

const clients = new Map<string, PrivatusClient>()

/** The client for a namespace (default `privatus`). */
export function getClient(namespace = 'privatus'): PrivatusClient {
  let client = clients.get(namespace)
  if (!client) {
    client = createClient(namespace)
    clients.set(namespace, client)
  }
  return client
}

/** True if a pa.js tag for this namespace is already in the document (injected or server-rendered). */
export function hasTrackerScript(namespace = 'privatus'): boolean {
  if (!isBrowser()) return false
  const scripts = document.querySelectorAll('script[data-site]')
  for (let i = 0; i < scripts.length; i++) {
    const el = scripts[i]
    if (el.hasAttribute(INJECTED_ATTR) || /\/pa\.js(\?|$)/.test(el.getAttribute('src') || '')) {
      if ((el.getAttribute('data-namespace') || 'privatus') === namespace) return true
    }
  }
  return false
}

/**
 * Install the queue stub and inject pa.js once. Calling it again with the
 * same namespace is a no-op, so it is safe in effects and hot reloads.
 * Returns the client; on the server it returns an inert client.
 */
export function init(options: PrivatusOptions): PrivatusClient {
  const ns = namespaceOf(options)
  const client = getClient(ns)
  if (!isBrowser()) return client
  target(ns)
  if (client.isLoaded() || hasTrackerScript(ns)) return client
  const el = document.createElement('script')
  for (const [key, value] of Object.entries(scriptAttributes(options))) {
    if (key === 'defer') el.defer = true
    else el.setAttribute(key, value)
  }
  el.setAttribute(INJECTED_ATTR, ns)
  ;(document.head || document.documentElement).appendChild(el)
  return client
}

const defaultClient = getClient('privatus')

export const track = defaultClient.track
export const trackAsync = defaultClient.trackAsync
export const pageview = defaultClient.pageview
export const props = defaultClient.props
export const optOut = defaultClient.optOut
export const optIn = defaultClient.optIn
export const isOptedOut = defaultClient.isOptedOut
export const ready = defaultClient.ready
