/**
 * @privatus-analytics/fastify: Privatus Analytics for Fastify.
 *
 *   import privatus from '@privatus-analytics/fastify'
 *   await app.register(privatus, { siteId: 'pa_XXXX' })
 *   // in a handler: reply.privatusAnalyticsTag()
 *
 * Only prints HTML: the browser script tag and data attributes. It never sends
 * events from your server, sets no cookies and reads no visitor data.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  canInjectInto,
  clickAttr as coreClickAttr,
  clickData as coreClickData,
  contextTag,
  eventAttrs as coreEventAttrs,
  eventData as coreEventData,
  injectTag,
  isProduction,
  shouldInject,
  willPrint,
  type BaseOptions,
  type Props,
  type Runtime,
  type TagOverrides,
} from '@privatus-analytics/html-core'

export type { Props, PropValue, SpaMode, TagOverrides } from '@privatus-analytics/html-core'
export { QUEUE_STUB } from '@privatus-analytics/html-core'

export interface PrivatusFastifyOptions extends Omit<BaseOptions<FastifyRequest>, 'nonce'> {
  /**
   * Content Security Policy nonce for the scripts: a string, or a function that gets the
   * request and reply. Defaults to reply.cspNonce.script from @fastify/helmet.
   */
  nonce?: string | ((request: FastifyRequest, reply: FastifyReply) => string | null | undefined) | null
  /** true puts the tag before </head> in HTML responses for you. Default false. */
  autoInject?: boolean
  /** false skips adding the helpers to reply.locals (read by @fastify/view). Default true. */
  locals?: boolean
}

/** The helpers on `fastify.privatus`. */
export interface PrivatusHelpers {
  /** The script tag HTML for one request ('' when off). */
  tag(request: FastifyRequest, reply: FastifyReply, overrides?: TagOverrides): string
  eventAttrs: typeof eventAttrs
  eventData: typeof eventData
  clickAttr: typeof clickAttr
  clickData: typeof clickData
}

/** The helpers added to reply.locals for @fastify/view templates. */
export interface PrivatusLocals {
  privatusAnalyticsTag: (overrides?: TagOverrides) => string
  privatusEventAttrs: (name: string, props?: Props | null) => string
  privatusClickAttr: (name: string) => string
}

declare module 'fastify' {
  interface FastifyInstance {
    privatus: PrivatusHelpers
  }
  interface FastifyReply {
    /** The Privatus script tag HTML for this request ('' when off). */
    privatusAnalyticsTag(overrides?: TagOverrides): string
  }
}

function warn(message: string): void {
  if (!isProduction()) console.warn(message)
}

/** Data attributes for a custom event, as HTML. On a <form> the event is sent on submit. */
export function eventAttrs(name: string, props?: Props | null): string {
  return coreEventAttrs(name, props)
}

/** The same attributes as an object with the full attribute names. */
export function eventData(name: string, props?: Props | null): Record<string, string> {
  return coreEventData(name, props)
}

/** `data-privatus-click="name"`, or '' when the name is not valid (with a warning outside production). */
export function clickAttr(name: string): string {
  return coreClickAttr(name, warn)
}

/** `{ "data-privatus-click": name }`, or {} when the name is not valid. */
export function clickData(name: string): Record<string, string> {
  const data = coreClickData(name)
  if (!data['data-privatus-click']) coreClickAttr(name, warn)
  return data
}

function header(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  return Array.isArray(value) ? value.join(', ') : String(value)
}

function plugin(fastify: FastifyInstance, options: PrivatusFastifyOptions, done: (error?: Error) => void): void {
  const { nonce: nonceOption, autoInject, locals, ...base } = options
  const runtime = (request: FastifyRequest, reply: FastifyReply): Runtime => {
    const nonce = typeof nonceOption === 'function' ? nonceOption(request, reply) : nonceOption
    const helmet = (reply as unknown as { cspNonce?: { script?: string } }).cspNonce
    return { defaultEnabled: isProduction(), nonce: nonce ?? helmet?.script }
  }
  const tag = (request: FastifyRequest, reply: FastifyReply, overrides?: TagOverrides): string =>
    contextTag(base, request, overrides, runtime(request, reply))

  fastify.decorate('privatus', { tag, eventAttrs, eventData, clickAttr, clickData })
  fastify.decorateReply('privatusAnalyticsTag', function (this: FastifyReply, overrides?: TagOverrides) {
    return tag(this.request, this, overrides)
  })

  if (locals !== false) {
    if (!fastify.hasReplyDecorator('locals')) fastify.decorateReply('locals', null)
    fastify.addHook('onRequest', (request, reply, next) => {
      const replyWithLocals = reply as FastifyReply & { locals?: Record<string, unknown> | null }
      replyWithLocals.locals = {
        ...(replyWithLocals.locals ?? {}),
        privatusAnalyticsTag: (overrides?: TagOverrides) => tag(request, reply, overrides),
        privatusEventAttrs: eventAttrs,
        privatusClickAttr: clickAttr,
      } satisfies PrivatusLocals
      next()
    })
  }

  if (autoInject === true) {
    fastify.addHook('onSend', async (request, reply, payload) => {
      if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) return payload
      if (request.method !== 'GET') return payload
      const ok = shouldInject({
        status: reply.statusCode,
        contentType: header(reply.getHeader('content-type')),
        contentEncoding: header(reply.getHeader('content-encoding')),
        requestedWith: header(request.headers['x-requested-with']),
      })
      if (!ok || !willPrint(base, runtime(request, reply))) return payload
      const html = typeof payload === 'string' ? payload : payload.toString('utf8')
      if (!canInjectInto(html)) return payload
      const changed = injectTag(html, tag(request, reply))
      if (changed === html) return payload
      // Fastify works out Content-Length again for a string body.
      reply.removeHeader('content-length')
      reply.removeHeader('etag')
      return changed
    })
  }
  done()
}

// What fastify-plugin does, without the dependency: share the decorators and hooks
// with the whole app instead of keeping them inside this plugin's scope.
const meta = plugin as typeof plugin & Record<symbol, unknown>
meta[Symbol.for('skip-override')] = true
meta[Symbol.for('fastify.display-name')] = '@privatus-analytics/fastify'
meta[Symbol.for('plugin-meta')] = { fastify: '>=4', name: '@privatus-analytics/fastify' }

/** The Fastify plugin. Register it with `app.register(privatus, options)`. */
export const privatus = plugin
export default plugin
