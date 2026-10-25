/**
 * @privatus-analytics/hono: Privatus Analytics for Hono.
 *
 *   import { privatus, privatusAnalyticsTag } from '@privatus-analytics/hono'
 *   app.use(privatus({ siteId: 'pa_XXXX' }))
 *   app.get('/', (c) => c.html(html`<head>${privatusAnalyticsTag(c)}</head>`))
 *
 * Only prints HTML: the browser script tag and data attributes. It never sends
 * events from your server, sets no cookies and reads no visitor data.
 * Works on every runtime Hono runs on (Node, Bun, Deno, Cloudflare Workers).
 */
import type { Context, MiddlewareHandler } from 'hono'
import { env as honoEnv } from 'hono/adapter'
import { raw } from 'hono/html'
import type { HtmlEscapedString } from 'hono/utils/html'
import {
  canInjectInto,
  clickAttr as coreClickAttr,
  clickData as coreClickData,
  contextTag,
  defaultEnv,
  eventAttrs as coreEventAttrs,
  eventData as coreEventData,
  injectTag,
  shouldInject,
  willPrint,
  type BaseOptions,
  type EnvSource,
  type Props,
  type Runtime,
  type TagOverrides,
} from '@privatus-analytics/html-core'

export type { Props, PropValue, SpaMode, TagOverrides } from '@privatus-analytics/html-core'
export { QUEUE_STUB } from '@privatus-analytics/html-core'

export interface PrivatusHonoOptions extends Omit<BaseOptions<Context>, 'nonce'> {
  /**
   * Content Security Policy nonce for the scripts: a string, or a function that gets the
   * context. Defaults to c.get('secureHeadersNonce') from Hono's secureHeaders middleware.
   */
  nonce?: string | ((c: Context) => string | null | undefined) | null
  /** true puts the tag before </head> in HTML responses for you. Default false. */
  autoInject?: boolean
}

/** What the middleware keeps on the context, under c.var.privatus. */
export interface PrivatusVariables {
  options: PrivatusHonoOptions
  /** The script tag for this request, ready for html`` and JSX ('' when off). */
  tag: (overrides?: TagOverrides) => HtmlEscapedString
}

declare module 'hono' {
  interface ContextVariableMap {
    privatus: PrivatusVariables
  }
}

function contextEnv(c: Context): EnvSource {
  const merged: Record<string, string | undefined> = { ...(defaultEnv() ?? {}) }
  let runtimeEnv: Record<string, unknown> = {}
  try {
    runtimeEnv = honoEnv(c) as Record<string, unknown>
  } catch {
    runtimeEnv = {}
  }
  // Cloudflare Workers bindings and other runtime variables. Only text values count.
  for (const source of [runtimeEnv, (c.env ?? {}) as Record<string, unknown>]) {
    for (const [key, value] of Object.entries(source ?? {})) if (typeof value === 'string') merged[key] = value
  }
  return merged
}

function runtime(options: PrivatusHonoOptions, c: Context): Runtime {
  const env = contextEnv(c)
  const nonce = typeof options.nonce === 'function' ? options.nonce(c) : options.nonce
  const secureHeaders = (c.get as (key: string) => unknown)('secureHeadersNonce')
  return {
    defaultEnabled: (env?.NODE_ENV ?? '').trim() === 'production',
    nonce: nonce ?? (typeof secureHeaders === 'string' ? secureHeaders : undefined),
    env,
  }
}

function baseOptions(options: PrivatusHonoOptions): BaseOptions<Context> {
  const { nonce: _nonce, autoInject: _autoInject, ...rest } = options
  return rest
}

function render(options: PrivatusHonoOptions, c: Context, overrides?: TagOverrides): string {
  return contextTag(baseOptions(options), c, overrides, runtime(options, c))
}

function warn(message: string): void {
  const env = defaultEnv()
  if ((env?.NODE_ENV ?? '') !== 'production') console.warn(message)
}

/**
 * The script tag for this request as raw HTML for html`` templates and JSX.
 * Uses the options from the privatus() middleware, or the ones you pass.
 */
export function privatusAnalyticsTag(c: Context, overrides?: TagOverrides & { options?: PrivatusHonoOptions }): HtmlEscapedString {
  const { options: given, ...rest } = overrides ?? {}
  const options = given ?? c.get('privatus')?.options ?? {}
  return raw(render(options, c, rest))
}

/** Data attributes for a custom event as raw HTML, for html`<button ${eventAttrs('Report exported')}>`. */
export function eventAttrs(name: string, props?: Props | null): HtmlEscapedString {
  return raw(coreEventAttrs(name, props))
}

/** The same attributes as an object, to spread in JSX: <button {...eventData('Report exported')}>. */
export function eventData(name: string, props?: Props | null): Record<string, string> {
  return coreEventData(name, props)
}

/** `data-privatus-click="name"` as raw HTML, or '' when the name is not valid. */
export function clickAttr(name: string): HtmlEscapedString {
  return raw(coreClickAttr(name, warn))
}

/** `{ "data-privatus-click": name }` to spread in JSX, or {} when the name is not valid. */
export function clickData(name: string): Record<string, string> {
  const data = coreClickData(name)
  if (!data['data-privatus-click']) coreClickAttr(name, warn)
  return data
}

/**
 * Hono middleware. Keeps the options on c.var.privatus (so privatusAnalyticsTag(c)
 * and c.var.privatus.tag() work in handlers and JSX) and, with autoInject: true,
 * rewrites HTML responses to put the tag before </head>.
 *
 * The tag prints only when there is a site id and NODE_ENV is production
 * (from process.env or your Workers variables), unless `enabled` says otherwise.
 */
export function privatus(options: PrivatusHonoOptions = {}): MiddlewareHandler {
  return async function privatusAnalytics(c, next) {
    c.set('privatus', { options, tag: (overrides?: TagOverrides) => raw(render(options, c, overrides)) })
    await next()
    if (options.autoInject !== true || c.req.method !== 'GET') return
    const res = c.res
    const ok = shouldInject({
      status: res.status,
      contentType: res.headers.get('content-type'),
      contentEncoding: res.headers.get('content-encoding'),
      requestedWith: c.req.header('x-requested-with'),
    })
    if (!ok || !res.body || !willPrint(baseOptions(options), runtime(options, c))) return
    const html = await res.clone().text()
    if (!canInjectInto(html)) return
    const changed = injectTag(html, render(options, c))
    if (changed === html) return
    const headers = new Headers(res.headers)
    headers.delete('content-length')
    headers.delete('etag')
    c.res = undefined
    c.res = new Response(changed, { status: res.status, statusText: res.statusText, headers })
  }
}

export default privatus
