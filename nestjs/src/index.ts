/**
 * @privatus-analytics/nestjs: Privatus Analytics for NestJS.
 *
 *   @Module({ imports: [PrivatusModule.forRoot({ siteId: 'pa_XXXX' })] })
 *   export class AppModule {}
 *
 * Gives you PrivatusService (the tag, event and click attributes) and
 * PrivatusMiddleware (adds the helpers to res.locals for @Render templates and can
 * put the tag in the head of HTML responses).
 *
 * Only prints HTML: the browser script tag and data attributes. It never sends
 * events from your server, sets no cookies and reads no visitor data.
 */
import { Global, Inject, Injectable, Module, type DynamicModule, type NestMiddleware } from '@nestjs/common'
import {
  clickAttr as coreClickAttr,
  clickData as coreClickData,
  contextTag,
  eventAttrs as coreEventAttrs,
  eventData as coreEventData,
  isProduction,
  willPrint,
  type BaseOptions,
  type Props,
  type Runtime,
  type TagOverrides,
} from '@privatus-analytics/html-core'
import { injectIntoNodeResponse, type NodeRequest, type NodeResponse } from '@privatus-analytics/html-core/node'

export type { Props, PropValue, SpaMode, TagOverrides } from '@privatus-analytics/html-core'
export { QUEUE_STUB } from '@privatus-analytics/html-core'

/** The request your props function gets: the Express request on the Express platform. */
export type PrivatusRequest = NodeRequest & Record<string, any>
/** The response: the Express response on the Express platform. */
export type PrivatusResponse = NodeResponse & { locals?: Record<string, any> } & Record<string, any>

export interface PrivatusNestOptions extends Omit<BaseOptions<PrivatusRequest>, 'nonce'> {
  /**
   * Content Security Policy nonce for the scripts: a string, or a function that gets the
   * request and response. Defaults to res.locals.cspNonce.
   */
  nonce?: string | ((req: PrivatusRequest, res?: PrivatusResponse) => string | null | undefined) | null
  /** true makes PrivatusMiddleware put the tag before </head> in HTML responses. Default false. */
  autoInject?: boolean
}

export const PRIVATUS_OPTIONS = 'PRIVATUS_OPTIONS'

function warn(message: string): void {
  if (!isProduction()) console.warn(message)
}

/** The tag and the attribute helpers. Inject it anywhere once PrivatusModule is imported. */
export class PrivatusService {
  constructor(readonly options: PrivatusNestOptions = {}) {}

  private runtime(req: PrivatusRequest, res?: PrivatusResponse): Runtime {
    const option = this.options.nonce
    const nonce = typeof option === 'function' ? option(req, res) : option
    const local = res && res.locals ? res.locals.cspNonce : undefined
    return { defaultEnabled: isProduction(), nonce: nonce ?? (typeof local === 'string' ? local : undefined) }
  }

  private base(): BaseOptions<PrivatusRequest> {
    const { nonce: _nonce, autoInject: _autoInject, ...rest } = this.options
    return rest
  }

  /**
   * The script tag HTML for one request ('' when off). Prints only with a site id
   * and when NODE_ENV is production, unless `enabled` says otherwise.
   */
  tag(req: PrivatusRequest, res?: PrivatusResponse, overrides?: TagOverrides): string {
    return contextTag(this.base(), req, overrides, this.runtime(req, res))
  }

  /** Data attributes for a custom event, as HTML. On a <form> the event is sent on submit. */
  eventAttrs(name: string, props?: Props | null): string {
    return coreEventAttrs(name, props)
  }

  /** The same attributes as an object with the full attribute names. */
  eventData(name: string, props?: Props | null): Record<string, string> {
    return coreEventData(name, props)
  }

  /** `data-privatus-click="name"`, or '' when the name is not valid (with a warning outside production). */
  clickAttr(name: string): string {
    return coreClickAttr(name, warn)
  }

  /** `{ "data-privatus-click": name }`, or {} when the name is not valid. */
  clickData(name: string): Record<string, string> {
    const data = coreClickData(name)
    if (!data['data-privatus-click']) coreClickAttr(name, warn)
    return data
  }

  /**
   * A plain (req, res, next) middleware. Adds privatusAnalyticsTag(), privatusEventAttrs()
   * and privatusClickAttr() to res.locals and, with autoInject, puts the tag in the head.
   */
  middleware(): (req: PrivatusRequest, res: PrivatusResponse, next: (error?: unknown) => void) => void {
    return (req, res, next) => {
      if (res.locals) {
        res.locals.privatusAnalyticsTag = (overrides?: TagOverrides) => this.tag(req, res, overrides)
        res.locals.privatusEventAttrs = (name: string, props?: Props | null) => this.eventAttrs(name, props)
        res.locals.privatusClickAttr = (name: string) => this.clickAttr(name)
      }
      if (this.options.autoInject === true && willPrint(this.base(), this.runtime(req, res))) {
        injectIntoNodeResponse(req, res, () => this.tag(req, res))
      }
      next()
    }
  }
}

/**
 * Nest middleware class. Apply it in your module:
 *
 *   configure(consumer: MiddlewareConsumer) { consumer.apply(PrivatusMiddleware).forRoutes('*') }
 */
@Injectable()
export class PrivatusMiddleware implements NestMiddleware {
  private readonly handler: ReturnType<PrivatusService['middleware']>

  constructor(@Inject(PrivatusService) privatus: PrivatusService) {
    this.handler = privatus.middleware()
  }

  use(req: PrivatusRequest, res: PrivatusResponse, next: (error?: unknown) => void): void {
    this.handler(req, res, next)
  }
}

export interface PrivatusModuleAsyncOptions {
  imports?: DynamicModule['imports']
  inject?: any[]
  useFactory: (...args: any[]) => PrivatusNestOptions | Promise<PrivatusNestOptions>
}

/** Import once in your root module. It is global, so PrivatusService is available everywhere. */
@Global()
@Module({})
export class PrivatusModule {
  static forRoot(options: PrivatusNestOptions = {}): DynamicModule {
    return PrivatusModule.build([{ provide: PRIVATUS_OPTIONS, useValue: options }])
  }

  /** For options from ConfigService and friends. */
  static forRootAsync(options: PrivatusModuleAsyncOptions): DynamicModule {
    const module = PrivatusModule.build([
      { provide: PRIVATUS_OPTIONS, useFactory: options.useFactory, inject: options.inject ?? [] },
    ])
    return { ...module, imports: options.imports ?? [] }
  }

  private static build(optionProviders: NonNullable<DynamicModule['providers']>): DynamicModule {
    return {
      module: PrivatusModule,
      global: true,
      providers: [
        ...optionProviders,
        {
          provide: PrivatusService,
          useFactory: (options: PrivatusNestOptions) => new PrivatusService(options),
          inject: [PRIVATUS_OPTIONS],
        },
        PrivatusMiddleware,
      ],
      exports: [PrivatusService, PrivatusMiddleware, PRIVATUS_OPTIONS],
    }
  }
}
