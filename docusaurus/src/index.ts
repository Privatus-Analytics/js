/**
 * docusaurus-plugin-privatus: Privatus Analytics for Docusaurus.
 *
 *   // docusaurus.config.js
 *   plugins: [['docusaurus-plugin-privatus', { siteId: 'pa_XXXX' }]]
 *
 * Adds the tracking script to the <head> of every page in `docusaurus build`.
 * `docusaurus start` gets nothing, so your own visits while writing are not counted.
 *
 * Only adds HTML tags. It never sends requests, sets no cookies and reads no visitor data.
 */
import { contextElements, SPA_MODES, type BaseOptions, type Props } from '@privatus-analytics/html-core'

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

/** The head tags for these options, or [] when the tag is off. */
export function headTags(options: PrivatusDocusaurusOptions = {}): HtmlTag[] {
  // `docusaurus build` sets NODE_ENV to production. `docusaurus start` sets development.
  const runtime = { defaultEnabled: process.env.NODE_ENV === 'production' }
  return contextElements(options, undefined, null, runtime).map((element) => {
    const tag: HtmlTag = { tagName: 'script', attributes: { ...element.attributes } }
    if (element.code !== undefined) tag.innerHTML = element.code
    return tag
  })
}

/**
 * The Docusaurus plugin. The tag prints only with a site id (or PRIVATUS_SITE_ID) and
 * only in production builds, unless `enabled` says otherwise.
 */
export default function privatusPlugin(_context: unknown, options: PrivatusDocusaurusOptions = {}): PrivatusDocusaurusPlugin {
  return {
    name: 'docusaurus-plugin-privatus',
    injectHtmlTags() {
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
