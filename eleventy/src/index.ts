/**
 * eleventy-plugin-privatus: Privatus Analytics for Eleventy (11ty).
 *
 *   // eleventy.config.js
 *   import privatus from 'eleventy-plugin-privatus'
 *   export default function (eleventyConfig) {
 *     eleventyConfig.addPlugin(privatus, { siteId: 'pa_XXXX' })
 *   }
 *
 * Puts the tracking script before </head> on every HTML page of a build, and adds
 * shortcodes for the tag, event attributes and click map names.
 *
 * Only writes HTML. It never sends requests, sets no cookies and reads no visitor data.
 */
import {
  canInjectInto,
  clickAttr,
  contextTag,
  eventAttrs,
  injectTag,
  type BaseOptions,
  type Props,
  type Runtime,
  type TagOverrides,
} from '@privatus/html-core'

export type { Props, PropValue, SpaMode, TagOverrides } from '@privatus/html-core'
export { QUEUE_STUB } from '@privatus/html-core'

/** The parts of Eleventy's `page` object the plugin passes to your props function. */
export interface EleventyPage {
  url?: string | false
  inputPath?: string
  outputPath?: string | false
  fileSlug?: string
  filePathStem?: string
  outputFileExtension?: string
  [key: string]: unknown
}

export interface PrivatusEleventyOptions extends BaseOptions<EleventyPage> {
  /**
   * true (the default) puts the tag before </head> in every .html file the build writes.
   * Set it to false and use the {% privatusAnalyticsTag %} shortcode in your layout instead.
   */
  autoInject?: boolean
}

/** The parts of Eleventy's config API the plugin uses. */
export interface EleventyConfigLike {
  addShortcode(name: string, fn: (this: { page?: EleventyPage }, ...args: any[]) => string): unknown
  addTransform(name: string, fn: (this: { page?: EleventyPage; outputPath?: string | false }, content: string, outputPath?: string | false) => string): unknown
}

function runtime(): Runtime {
  // Eleventy sets ELEVENTY_RUN_MODE to build, serve or watch. Only a build counts.
  return { defaultEnabled: process.env.ELEVENTY_RUN_MODE === 'build' }
}

function warn(message: string): void {
  if (process.env.ELEVENTY_RUN_MODE !== 'build') console.warn(message)
}

/** Props from shortcode arguments: one object (Nunjucks, JavaScript) or key, value pairs (Liquid). */
function propsFrom(args: unknown[]): Props {
  if (args.length === 1 && args[0] && typeof args[0] === 'object') return args[0] as Props
  const props: Props = {}
  for (let i = 0; i + 1 < args.length; i += 2) props[String(args[i])] = args[i + 1] as Props[string]
  return props
}

/**
 * The Eleventy plugin. Adds:
 * - the `privatusAnalyticsTag` shortcode (the script tag, for your layout's <head>),
 * - the `privatusEventAttrs` shortcode (custom event attributes for a button, link or form),
 * - the `privatusClickAttr` shortcode (a click map name),
 * - a transform that puts the tag in the <head> of every page (turn off with autoInject: false).
 *
 * The tag prints only with a site id (or PRIVATUS_SITE_ID) and only in a build,
 * not with --serve or --watch, unless `enabled` says otherwise.
 */
export function privatusPlugin(eleventyConfig: EleventyConfigLike, options: PrivatusEleventyOptions = {}): void {
  const { autoInject = true, ...base } = options
  const tag = (page: EleventyPage | undefined, overrides?: TagOverrides | null): string =>
    contextTag(base, page ?? {}, overrides, runtime())

  eleventyConfig.addShortcode('privatusAnalyticsTag', function (overrides?: TagOverrides) {
    return tag(this.page, overrides && typeof overrides === 'object' ? overrides : null)
  })
  eleventyConfig.addShortcode('privatusEventAttrs', function (name: string, ...props: unknown[]) {
    return eventAttrs(name, propsFrom(props))
  })
  eleventyConfig.addShortcode('privatusClickAttr', function (name: string) {
    return clickAttr(name, warn)
  })

  if (autoInject) {
    eleventyConfig.addTransform('privatus-analytics', function (content: string, legacyOutputPath?: string | false) {
      const outputPath = this.page?.outputPath ?? this.outputPath ?? legacyOutputPath
      if (typeof content !== 'string' || typeof outputPath !== 'string' || !outputPath.endsWith('.html')) return content
      if (!canInjectInto(content)) return content
      return injectTag(content, tag(this.page ?? { outputPath }))
    })
  }
}

export default privatusPlugin
