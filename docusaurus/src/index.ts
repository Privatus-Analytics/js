/**
 * docusaurus-plugin-privatus: Privatus Analytics for Docusaurus.
 *
 *   // docusaurus.config.js
 *   plugins: [['docusaurus-plugin-privatus', { siteId: 'pa_XXXX' }]]
 *
 * Adds the tracking script to the <head> of every page in `docusaurus build`.
 * `docusaurus start` gets no tracker, so your own visits while writing are not counted
 * (only the queue stub, when queueStub is on).
 *
 * Only adds HTML tags. It never sends requests, sets no cookies and reads no visitor data.
 */
import { contextElements, QUEUE_STUB, SPA_MODES, willPrint, type BaseOptions, type Props } from '@privatus-analytics/html-core'

export type { Props, PropValue, SpaMode } from '@privatus-analytics/html-core'

export interface PrivatusDocusaurusOptions extends Omit<BaseOptions<void>, 'props'> {
  /**
   * Page props sent with every pageview and event. A plain object, set once for the
   * whole site. Never put names, emails, user ids or anything that points to one person here.
   */
  props?: Props | null
}

/** Docusaurus' HtmlTagObject, written out so the package needs no Docusaurus types at run time. */
export interface HtmlTag {
  tagName: string
  attributes?: Record<string, string | boolean>
  innerHTML?: string
}

/** The plugin object Docusaurus gets. */
export interface PrivatusDocusaurusPlugin {
  name: string
  injectHtmlTags(): { headTags?: HtmlTag[] }
}

function runtime(): { defaultEnabled: boolean } {
  // `docusaurus build` sets NODE_ENV to production. `docusaurus start` sets development.
  return { defaultEnabled: process.env.NODE_ENV === 'production' }
}

/** Whether head tags (for example the site config's headTags) already hold the queue stub. */
function hasStub(tags: unknown): boolean {
  return Array.isArray(tags) && tags.some((tag) => tag && typeof tag === 'object' && (tag as HtmlTag).tagName === 'script' && (tag as HtmlTag).innerHTML === QUEUE_STUB)
}

/** The head tags for these options. When the tag is off: only the queue stub (when it is on), else []. */
export function headTags(options: PrivatusDocusaurusOptions = {}): HtmlTag[] {
  return contextElements(options, undefined, null, runtime()).map((element) => {
    const tag: HtmlTag = { tagName: 'script', attributes: { ...element.attributes } }
    if (element.code !== undefined) tag.innerHTML = element.code
    return tag
  })
}

/**
 * The Docusaurus plugin. The tag prints only with a site id (or PRIVATUS_SITE_ID) and
 * only in production builds, unless `enabled` says otherwise.
 */
export default function privatusPlugin(context: unknown, options: PrivatusDocusaurusOptions = {}): PrivatusDocusaurusPlugin {
  return {
    name: 'docusaurus-plugin-privatus',
    injectHtmlTags() {
      // When the tag is off this is the queue stub alone (queueStub on) or nothing. A site
      // whose own headTags already hold the stub (from headTags()) does not get a second one.
      const siteHeadTags = (context as { siteConfig?: { headTags?: unknown } } | null)?.siteConfig?.headTags
      if (!willPrint(options, runtime()) && hasStub(siteHeadTags)) return {}
      const tags = headTags(options)
      return tags.length ? { headTags: tags } : {}
    },
  }
}

const LISTS = ['modules', 'excludedPaths', 'domains'] as const
const STRINGS = ['siteId', 'scriptHost', 'nonce'] as const
const BOOLEANS = ['enabled', 'manual', 'queueStub'] as const
const KNOWN = new Set<string>([...LISTS, ...STRINGS, ...BOOLEANS, 'spa', 'extraAttributes', 'props', 'id'])

function fail(message: string): never {
  throw new Error(`[docusaurus-plugin-privatus] ${message}`)
}

/** Checks the options when Docusaurus loads the plugin, so a typo fails the build early. */
export function validateOptions({ options }: { options: Record<string, unknown> | undefined; validate?: unknown }): PrivatusDocusaurusOptions {
  const given = options ?? {}
  for (const key of Object.keys(given)) if (!KNOWN.has(key)) fail(`unknown option "${key}"`)
  for (const key of STRINGS) {
    const value = given[key]
    if (value !== undefined && value !== null && typeof value !== 'string') fail(`"${key}" must be text`)
  }
  for (const key of BOOLEANS) {
    const value = given[key]
    if (value !== undefined && value !== null && typeof value !== 'boolean') fail(`"${key}" must be true or false`)
  }
  for (const key of LISTS) {
    const value = given[key]
    if (value !== undefined && value !== null && typeof value !== 'string' && !(Array.isArray(value) && value.every((v) => typeof v === 'string'))) {
      fail(`"${key}" must be a list of text`)
    }
  }
  if (given.spa !== undefined && given.spa !== null && !(SPA_MODES as readonly unknown[]).includes(given.spa)) {
    fail('"spa" must be auto, history, hash or off')
  }
  for (const key of ['extraAttributes', 'props']) {
    const value = given[key]
    if (value !== undefined && value !== null && (typeof value !== 'object' || Array.isArray(value))) fail(`"${key}" must be an object`)
  }
  return given as PrivatusDocusaurusOptions
}
