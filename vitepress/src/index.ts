/**
 * vitepress-plugin-privatus: Privatus Analytics for VitePress (and plain Vite apps).
 *
 * VitePress has no plugin system of its own, so this package gives you three small helpers:
 *
 *   privatusHead(options)          head entries for the `head` setting in .vitepress/config
 *   privatusTransformHead(options) a `transformHead` hook: runs in `vitepress build` only,
 *                                  and can set page props for each page
 *   privatusVitePlugin(options)    a Vite plugin for plain Vite apps (transformIndexHtml)
 *
 * Only adds HTML tags. It never sends requests, sets no cookies and reads no visitor data.
 */
import {
  contextElements,
  contextTag,
  injectTag,
  canInjectInto,
  type BaseOptions,
  type Props,
  type ScriptElement,
} from '@privatus/html-core'

export type { Props, PropValue, SpaMode } from '@privatus/html-core'

/** VitePress' HeadConfig, written out so the package needs no VitePress types at run time. */
export type HeadConfig = [string, Record<string, string>] | [string, Record<string, string>, string]

/** The parts of VitePress' transformHead context the plugin passes to your props function. */
export interface TransformHeadContext {
  page: string
  pageData: { relativePath: string; title?: string; frontmatter?: Record<string, any>; [key: string]: unknown }
  [key: string]: unknown
}

/** The parts of Vite's transformIndexHtml context the plugin passes to your props function. */
export interface IndexHtmlContext {
  path: string
  filename: string
  [key: string]: unknown
}

export interface PrivatusHeadOptions extends Omit<BaseOptions<void>, 'props'> {
  /**
   * Page props sent with every pageview and event. A plain object.
   * Never put names, emails, user ids or anything that points to one person here.
   */
  props?: Props | null
}

export type PrivatusTransformHeadOptions = BaseOptions<TransformHeadContext>
export type PrivatusViteOptions = BaseOptions<IndexHtmlContext>

function toHead(element: ScriptElement): HeadConfig {
  const attrs: Record<string, string> = {}
  for (const [name, value] of Object.entries(element.attributes)) attrs[name] = value === true ? '' : value
  return element.code !== undefined ? ['script', attrs, element.code] : ['script', attrs]
}

function production(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Head entries for VitePress' `head` setting:
 *
 *   export default defineConfig({ head: [...privatusHead({ siteId: 'pa_XXXX' })] })
 *
 * NODE_ENV is read when your config loads. `vitepress build` sets it to production,
 * `vitepress dev` does not, so the tag is only in production builds unless `enabled` says otherwise.
 */
export function privatusHead(options: PrivatusHeadOptions = {}): HeadConfig[] {
  return contextElements(options, undefined, null, { defaultEnabled: production() }).map(toHead)
}

/**
 * A `transformHead` hook for VitePress. VitePress calls it for each page in
 * `vitepress build` only, so the tag never reaches `vitepress dev`. `props` may be a
 * function that gets the page context, for example the page's frontmatter:
 *
 *   transformHead: privatusTransformHead({ siteId: 'pa_XXXX', props: ({ pageData }) => ({ section: pageData.frontmatter?.section }) })
 *
 * Use this or privatusHead, not both.
 */
export function privatusTransformHead(options: PrivatusTransformHeadOptions = {}): (context: TransformHeadContext) => HeadConfig[] {
  return (context) => contextElements(options, context, null, { defaultEnabled: true }).map(toHead)
}

/** The parts of a Vite plugin this returns, written out so the package needs no Vite types. */
export interface PrivatusVitePlugin {
  name: string
  apply: 'build'
  configResolved(config: { isProduction: boolean }): void
  transformIndexHtml: { order: 'post'; handler(html: string, context: IndexHtmlContext): string }
}

/**
 * A Vite plugin for plain Vite apps: puts the tag before </head> in index.html in
 * production builds (`vite build`). `vite` (the dev server) never gets it.
 *
 *   export default defineConfig({ plugins: [privatusVitePlugin({ siteId: 'pa_XXXX' })] })
 *
 * VitePress builds its pages without index.html, so in VitePress use privatusHead or
 * privatusTransformHead instead.
 */
export function privatusVitePlugin(options: PrivatusViteOptions = {}): PrivatusVitePlugin {
  let isProduction = true
  return {
    name: 'vitepress-plugin-privatus',
    apply: 'build',
    configResolved(config) {
      isProduction = config.isProduction
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!canInjectInto(html)) return html
        return injectTag(html, contextTag(options, context, null, { defaultEnabled: isProduction }))
      },
    },
  }
}
