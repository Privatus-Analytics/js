/**
 * Builds the Privatus Analytics script tag. Same output as the Ruby gem's Tag class:
 *
 *   <script defer src="https://privatusstats.com/js/pa.js" data-site="pa_X"></script>
 *
 * Before the tracker tag it can also print the queue stub and the page props script.
 */
import { escapeHtml, type Props } from './attributes.js'
import { pagePropsJson } from './page-props.js'

export const DEFAULT_HOST = 'https://privatusstats.com'
export const MARKER = '/js/pa.js'
export const PROPS_FUNCTION = 'privatusPageProps'
export const SPA_MODES = ['auto', 'history', 'hash', 'off'] as const
export type SpaMode = (typeof SPA_MODES)[number]
export const QUEUE_STUB =
  "window.privatus=window.privatus||{q:[]};['track','pageview','props','optOut','optIn','ready']" +
  '.forEach(function(m){window.privatus[m]=window.privatus[m]||function(){window.privatus.q.push(' +
  '[m,Array.prototype.slice.call(arguments)])}})'

/** Where to read PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST from. */
export type EnvSource = Record<string, string | undefined> | undefined

/** The tag settings shared by every package. All optional except the site id. */
export interface TagSettings {
  /** The site id (starts with `pa_`). Falls back to the PRIVATUS_SITE_ID environment variable. */
  siteId?: string | null
  /** Origin that serves /js/pa.js. Falls back to PRIVATUS_SCRIPT_HOST, then https://privatusstats.com. */
  scriptHost?: string | null
  /** Tracker modules, for example ['engage', 'auto']. undefined keeps the tracker default. [] loads none. */
  modules?: string[] | string | null
  /** Path globs the tracker never counts (`data-exclude`). */
  excludedPaths?: string[] | string | null
  /** Hostnames to count (`data-domains`). undefined counts every host. */
  domains?: string[] | string | null
  /** auto, history, hash or off. Only a value other than auto is printed. */
  spa?: SpaMode | null
  /** true turns off the automatic pageview (`data-manual="true"`). */
  manual?: boolean | null
  /** Any other data-* attribute, for example { 'data-mask': '/orders/*->/orders/:id' }. */
  extraAttributes?: Record<string, string | number | boolean | null | undefined> | null
  /** true prints the official queue stub first, so privatus.track works before pa.js loads. */
  queueStub?: boolean | null
  /** Content Security Policy nonce for the scripts. */
  nonce?: string | null
}

/** One <script> element: its attributes (true means a bare attribute like `defer`) and inline code. */
export interface ScriptElement {
  attributes: Record<string, string | true>
  code?: string
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim()
}

/** The site id, or the PRIVATUS_SITE_ID environment variable, or undefined. */
export function resolveSiteId(value: string | null | undefined, env: EnvSource = defaultEnv()): string | undefined {
  const id = clean(value) || clean(env?.PRIVATUS_SITE_ID)
  return id === '' ? undefined : id
}

/** The script host without a trailing slash. */
export function resolveScriptHost(value: string | null | undefined, env: EnvSource = defaultEnv()): string {
  const host = clean(value) || clean(env?.PRIVATUS_SCRIPT_HOST) || DEFAULT_HOST
  return host.replace(/\/+$/, '')
}

/** process.env when there is one (Node), else undefined (browsers, some edge runtimes). */
export function defaultEnv(): EnvSource {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  return proc && proc.env ? proc.env : undefined
}

/** Whether NODE_ENV is production. The plain default for "is this a production-like environment". */
export function isProduction(env: EnvSource = defaultEnv()): boolean {
  return clean(env?.NODE_ENV) === 'production'
}

// undefined/null stays undefined. Anything else becomes a clean list of strings.
function list(value: string[] | string | null | undefined): string[] | undefined {
  if (value === null || value === undefined) return undefined
  const items = Array.isArray(value) ? value : [value]
  return items
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter((item) => item !== '')
}

export interface TagInput extends TagSettings {
  /** Whether the tag is on. Each package works this out from its own idea of the environment. */
  enabled: boolean
  /** Page props for this page, already merged. A function is only called when the tag prints. */
  props?: Props | null | (() => Props | null | undefined)
  /** Where to read PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST. Defaults to process.env. */
  env?: EnvSource
}

/**
 * The script elements to print, in order, or [] when nothing should print
 * (no site id, or the tag is off).
 */
export function tagElements(input: TagInput): ScriptElement[] {
  const env = 'env' in input ? input.env : defaultEnv()
  const siteId = resolveSiteId(input.siteId, env)
  if (!siteId || !input.enabled) return []

  const nonce = clean(input.nonce) || undefined
  const inline = (code: string): ScriptElement => ({ attributes: nonce ? { nonce } : {}, code })
  const json = pagePropsJson(typeof input.props === 'function' ? input.props() : input.props)
  const elements: ScriptElement[] = []
  if (input.queueStub === true) elements.push(inline(QUEUE_STUB))
  if (json) elements.push(inline(`window.${PROPS_FUNCTION}=function(){return ${json}}`))

  const attrs: Record<string, string | true> = {
    defer: true,
    src: `${resolveScriptHost(input.scriptHost, env)}${MARKER}`,
    'data-site': siteId,
  }
  const lists: Array<[keyof TagSettings, string]> = [
    ['modules', 'data-modules'],
    ['excludedPaths', 'data-exclude'],
    ['domains', 'data-domains'],
  ]
  for (const [name, attribute] of lists) {
    const values = list(input[name] as string[] | string | null | undefined)
    // undefined keeps the tracker default. An empty modules list loads none.
    if (values && (name === 'modules' || values.length > 0)) attrs[attribute] = values.join(',')
  }
  const spa = String(input.spa ?? '')
  if ((SPA_MODES as readonly string[]).includes(spa) && spa !== 'auto') attrs['data-spa'] = spa
  if (input.manual === true) attrs['data-manual'] = 'true'
  for (const [name, value] of Object.entries(input.extraAttributes ?? {})) {
    if (value !== null && value !== undefined) attrs[name] = String(value)
  }
  if (nonce) attrs.nonce = nonce
  if (json) attrs['data-props'] = PROPS_FUNCTION
  elements.push({ attributes: attrs })
  return elements
}

/** One script element as HTML. */
export function renderElement(element: ScriptElement): string {
  const attrs = Object.entries(element.attributes)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escapeHtml(value)}"`))
    .join('')
  return `<script${attrs}>${element.code ?? ''}</script>`
}

/** The full tag as HTML, or '' when nothing should print. */
export function renderTag(input: TagInput): string {
  return tagElements(input).map(renderElement).join('\n')
}
