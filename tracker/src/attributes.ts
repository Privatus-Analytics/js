/**
 * Isomorphic helpers that turn typed options into the <script> attributes
 * read by pa.js. Safe to import on the server (no DOM access).
 */

/** The tracker host: serves /js/pa.js and receives hits. The website and docs stay on privatusanalytics.com. */
export const DEFAULT_HOST = 'https://privatusstats.com'

export type SpaMode = 'auto' | 'history' | 'hash' | 'off'

export interface PrivatusOptions {
  /** Site id from the dashboard, e.g. `pa_AbC123`. Required. */
  site: string
  /**
   * Origin that receives hits and serves modules: pa.js posts to
   * `{api}/api/event` and loads `{api}/js/pa.<module>.js`. Only needed when
   * you host a copy of pa.js yourself. Maps to `data-api`.
   */
  api?: string
  /** Script URL. Defaults to `{api}/js/pa.js`, or the hosted script. */
  src?: string
  /** SPA navigation tracking. Maps to `data-spa`. Default `auto`. */
  spa?: SpaMode
  /** Do not send the automatic pageview. Maps to `data-manual`. */
  manual?: boolean
  /** Extra tracker modules, e.g. `['vitals', 'outbound']`. `data-modules`. */
  modules?: string[]
  /** Only track on these hostnames. `data-domains`. */
  domains?: string[]
  /** Path globs never tracked, e.g. `['/admin/*']`. `data-exclude`. */
  exclude?: string[]
  /** Path masks, e.g. `{ '/users/*': '/users/:id' }`. `data-mask`. */
  mask?: Record<string, string> | string[]
  /** Query params kept in addition to UTM/ref params. `data-params`. */
  params?: string[]
  /** Report the <link rel="canonical"> URL. `data-canonical`. */
  canonical?: boolean
  /** Keep the #fragment (hash-routed apps). `data-hash`. */
  hash?: boolean
  /** Name of a global function returning props for every hit. `data-props`. */
  props?: string
  /** Global the tracker lives on. Default `privatus`. `data-namespace`. */
  namespace?: string
  /** Log hits to the console instead of sending them. `data-debug`. */
  debug?: boolean
  /** Also track on localhost. `data-allow-local`. */
  allowLocal?: boolean
  /** CSP nonce for the injected <script>. */
  nonce?: string
  /** Load with `defer` (default true). */
  defer?: boolean
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function namespaceOf(options?: Pick<PrivatusOptions, 'namespace'>): string {
  return (options && options.namespace) || 'privatus'
}

/** The script URL that init() injects for these options. */
export function scriptSrc(options: PrivatusOptions): string {
  if (options.src) return options.src
  return `${trimSlash(options.api || DEFAULT_HOST)}/js/pa.js`
}

function joined(values?: string[]): string | undefined {
  if (!values || values.length === 0) return undefined
  return values.map((v) => String(v).trim()).filter(Boolean).join(',')
}

function masks(mask?: Record<string, string> | string[]): string | undefined {
  if (!mask) return undefined
  const entries = Array.isArray(mask) ? mask : Object.entries(mask).map(([from, to]) => `${from}->${to}`)
  return joined(entries)
}

/**
 * Attributes for the tracker <script>, in insertion order. Boolean HTML
 * attributes (`defer`) are returned as empty strings.
 */
export function scriptAttributes(options: PrivatusOptions): Record<string, string> {
  if (!options || !options.site) throw new Error('[privatus] `site` is required')
  const attrs: Record<string, string> = { src: scriptSrc(options) }
  if (options.defer !== false) attrs.defer = ''
  const data: Record<string, string | undefined> = {
    site: options.site,
    api: options.api ? trimSlash(options.api) : undefined,
    spa: options.spa,
    manual: options.manual ? 'true' : undefined,
    modules: options.modules ? options.modules.join(',') : undefined,
    domains: joined(options.domains),
    exclude: joined(options.exclude),
    mask: masks(options.mask),
    params: joined(options.params),
    canonical: options.canonical ? 'true' : undefined,
    hash: options.hash ? 'true' : undefined,
    props: options.props,
    namespace: options.namespace,
    debug: options.debug ? 'true' : undefined,
    'allow-local': options.allowLocal ? 'true' : undefined
  }
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) attrs[`data-${key}`] = value
  }
  if (options.nonce) attrs.nonce = options.nonce
  return attrs
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * The queue stub, as inline JavaScript. Calls made before pa.js loads are
 * pushed to `window[namespace].q` as `[method, args]` and replayed.
 */
export function queueStub(namespace = 'privatus'): string {
  const ns = JSON.stringify(namespace)
  return `window[${ns}]=window[${ns}]||{q:[]};`
}

/**
 * Inline JavaScript that installs the queue stub and injects pa.js once
 * (for integrations that can only add inline head scripts, e.g. Astro).
 */
export function loaderSnippet(options: PrivatusOptions): string {
  const attrs = scriptAttributes(options)
  const ns = JSON.stringify(namespaceOf(options))
  const json = JSON.stringify(attrs).replace(/</g, '\\u003c')
  return (
    `(function(){var w=window,d=document,n=${ns};w[n]=w[n]||{q:[]};` +
    `if(d.querySelector('script[data-privatus-loader="'+n+'"]'))return;` +
    `var a=${json},s=d.createElement('script');` +
    `for(var k in a){if(k==='defer')s.defer=true;else s.setAttribute(k,a[k])}` +
    `s.setAttribute('data-privatus-loader',n);(d.head||d.documentElement).appendChild(s)})();`
  )
}

/** The tracker <script> tag as an HTML string (for SSR and hooks). */
export function renderScriptTag(options: PrivatusOptions): string {
  const attrs = scriptAttributes(options)
  const html = Object.entries(attrs)
    .map(([key, value]) => (value === '' && key === 'defer' ? key : `${key}="${escapeHtml(value)}"`))
    .join(' ')
  return `<script ${html}></script>`
}
