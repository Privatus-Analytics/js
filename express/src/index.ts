/**
 * @privatus/express: Privatus Analytics for Express.
 *
 *   import privatus from '@privatus/express'
 *   app.use(privatus({ siteId: 'pa_XXXX' }))
 *   // in a template: <%- privatusAnalyticsTag() %>
 *
 * Only prints HTML: the browser script tag and data attributes. It never sends
 * events from your server, sets no cookies and reads no visitor data.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import {
  clickAttr as coreClickAttr,
  clickData as coreClickData,
  contextTag,
  eventAttrs as coreEventAttrs,
  eventData as coreEventData,
  willPrint,
  type BaseOptions,
  type Props,
  type Runtime,
  type TagOverrides,
} from '@privatus/html-core'
import { injectIntoNodeResponse } from '@privatus/html-core/node'

export type { Props, PropValue, SpaMode, TagOverrides } from '@privatus/html-core'
export { QUEUE_STUB } from '@privatus/html-core'

/** Where the tag finds the request and response. */
export interface ExpressContext {
  req: Request
  res: Response
}

export interface PrivatusExpressOptions extends Omit<BaseOptions<Request>, 'nonce'> {
  /**
   * Content Security Policy nonce for the scripts: a string, or a function that gets the
   * request and response. Defaults to res.locals.cspNonce, the name helmet's docs use.
   */
  nonce?: string | ((req: Request, res: Response) => string | null | undefined) | null
  /** true puts the tag before </head> in HTML responses for you. Default false. */
  autoInject?: boolean
  /** false skips adding the helpers to res.locals. Default true. */
  locals?: boolean
}

/** The helpers added to res.locals for your templates. */
export interface PrivatusLocals {
  /** The script tag as HTML ('' when off). Print it unescaped, for example `<%- privatusAnalyticsTag() %>`. */
  privatusAnalyticsTag: (overrides?: TagOverrides) => string
  /** Event attributes as HTML, for inside a tag you write yourself. */
  privatusEventAttrs: (name: string, props?: Props | null) => string
  /** Click map name attribute as HTML. */
  privatusClickAttr: (name: string) => string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals extends Partial<PrivatusLocals> {}
  }
}

function warn(message: string): void {
  if (process.env.NODE_ENV !== 'production') console.warn(message)
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

function runtime(options: PrivatusExpressOptions, req: Request, res: Response): Runtime {
  const nonce = typeof options.nonce === 'function' ? options.nonce(req, res) : options.nonce
  const localNonce = res.locals ? res.locals.cspNonce : undefined
  const env = req.app && typeof req.app.get === 'function' ? req.app.get('env') : process.env.NODE_ENV
  return {
    defaultEnabled: env === 'production',
    nonce: nonce ?? (typeof localNonce === 'string' ? localNonce : undefined),
  }
}

function baseOptions(options: PrivatusExpressOptions): BaseOptions<Request> {
  const { nonce: _nonce, autoInject: _autoInject, locals: _locals, ...rest } = options
  return rest
}

/** The middleware, with `tag()` for rendering the tag yourself. */
export interface PrivatusMiddleware extends RequestHandler {
  /** The script tag HTML for one request ('' when off). */
  tag(req: Request, res: Response, overrides?: TagOverrides): string
}

/**
 * Express middleware. Adds `privatusAnalyticsTag()`, `privatusEventAttrs()` and
 * `privatusClickAttr()` to res.locals, and with `autoInject: true` puts the tag
 * in the head of HTML responses.
 *
 * The tag prints only when there is a site id and the app runs in production
 * (`app.get('env')`, which is NODE_ENV), unless `enabled` says otherwise.
 */
export function privatus(options: PrivatusExpressOptions = {}): PrivatusMiddleware {
  const base = baseOptions(options)
  const tag = (req: Request, res: Response, overrides?: TagOverrides): string =>
    contextTag(base, req, overrides, runtime(options, req, res))

  const middleware = function privatusAnalytics(req: Request, res: Response, next: NextFunction): void {
    if (options.locals !== false && res.locals) {
      res.locals.privatusAnalyticsTag = (overrides?: TagOverrides) => tag(req, res, overrides)
      res.locals.privatusEventAttrs = eventAttrs
      res.locals.privatusClickAttr = clickAttr
    }
    if (options.autoInject === true && willPrint(base, runtime(options, req, res))) {
      injectIntoNodeResponse(req, res, () => tag(req, res))
    }
    next()
  } as PrivatusMiddleware
  middleware.tag = tag
  return middleware
}

export default privatus
