/**
 * rspress-plugin-privatus: Privatus Analytics for Rspress.
 *
 *   // rspress.config.ts
 *   import { pluginPrivatus } from 'rspress-plugin-privatus'
 *   export default defineConfig({ plugins: [pluginPrivatus({ siteId: 'pa_XXXX' })] })
 *
 * Adds the tracking script to the <head> of every page in `rspress build`.
 * `rspress dev` gets no tracker, so your own visits while writing are not counted.
 *
 * Only adds HTML tags. It never sends requests, sets no cookies and reads no visitor data.
 */
import { contextTag, type BaseOptions } from '@privatus-analytics/html-core'

export type { Props, PropValue, SpaMode } from '@privatus-analytics/html-core'

/** The parts of Rspress' RouteMeta the plugin passes to your props function. */
export interface RouteMeta {
  routePath: string
  pureRoutePath: string
  absolutePath: string
  relativePath: string
  pageName: string
  lang: string
  version: string
}

/** One entry of Rspress' `head` setting, written out so the package needs no Rspress types at run time. */
export type HeadEntry = string | [string, Record<string, string>] | ((route: RouteMeta) => string | [string, Record<string, string>] | undefined)

/** The part of Rspress' UserConfig the plugin changes. */
export interface RspressConfig {
  head?: HeadEntry[]
}

/** The plugin object Rspress gets. */
export interface PrivatusRspressPlugin {
  name: string
  config<C extends RspressConfig>(config: C, utils: unknown, isProd: boolean): C
}

/**
 * Settings for the plugin. Every one is optional except the site id. `props` may be a
 * function that gets each page's route, for example `(route) => ({ lang: route.lang })`.
 */
export type PrivatusRspressOptions = BaseOptions<RouteMeta>

/** Tracker modules the plugin loads when you don't set `modules`. */
export const DEFAULT_MODULES: readonly string[] = ['engage', 'auto', 'vitals', 'clicks', 'ask']

/**
 * The Rspress plugin. It adds one `head` entry that prints the tag for each page.
 * The tag prints only with a site id (or PRIVATUS_SITE_ID) and only in `rspress build`,
 * unless `enabled` says otherwise.
 */
export function pluginPrivatus(options: PrivatusRspressOptions = {}): PrivatusRspressPlugin {
  const settings: PrivatusRspressOptions = { modules: [...DEFAULT_MODULES], ...options }
  return {
    name: 'rspress-plugin-privatus',
    config(config, _utils, isProd) {
      const runtime = { defaultEnabled: isProd === true }
      // Called by Rspress for each page it renders. When the tag is off this is the queue
      // stub alone (queueStub on) or nothing, and the props function is not called.
      const entry = (route: RouteMeta): string | undefined => contextTag(settings, route, null, runtime) || undefined
      return { ...config, head: [...(config.head ?? []), entry] }
    },
  }
}

export default pluginPrivatus
