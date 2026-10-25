/**
 * @privatus-analytics/nuxt: Nuxt 3 module for Privatus Analytics.
 *
 *   // nuxt.config.ts
 *   export default defineNuxtConfig({
 *     modules: ['@privatus-analytics/nuxt'],
 *     privatus: { site: 'pa_XXXX' },
 *   })
 *
 * The tracker <script> is server-rendered into <head> through `app.head`,
 * and `usePrivatus()` is auto-imported. No cookies, storage or device ids.
 */
import { addImports, defineNuxtModule } from '@nuxt/kit'
import { scriptAttributes, type PrivatusOptions } from '@privatus-analytics/tracker'

export type { PrivatusOptions } from '@privatus-analytics/tracker'

export type ModuleOptions = Partial<PrivatusOptions>

export interface HeadScript {
  src: string
  defer?: boolean
  tagPosition: 'head'
  [attr: string]: string | boolean | undefined
}

/** The `app.head.script` entry for these options. */
export function headScript(options: PrivatusOptions): HeadScript {
  const { src, defer, ...rest } = scriptAttributes(options)
  const script: HeadScript = { src, tagPosition: 'head', ...rest }
  if (defer !== undefined) script.defer = true
  return script
}

interface NuxtOptionsLike {
  app: { head: { script?: unknown[] } }
}

/** Adds the tracker script to `nuxt.options.app.head.script` (idempotent). */
export function applyToNuxtOptions(nuxtOptions: NuxtOptionsLike, options: PrivatusOptions): void {
  const head = nuxtOptions.app.head
  head.script = head.script || []
  const exists = head.script.some(
    (s) => typeof s === 'object' && s !== null && (s as HeadScript)['data-site'] === options.site,
  )
  if (!exists) head.script.push(headScript(options))
}

/** Site id from module options or the environment (NUXT_PUBLIC_PRIVATUS_SITE / PRIVATUS_SITE). */
export function resolveSite(options: ModuleOptions, env: Record<string, string | undefined> = process.env): string | undefined {
  return options.site || env.NUXT_PUBLIC_PRIVATUS_SITE || env.PRIVATUS_SITE
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@privatus-analytics/nuxt',
    configKey: 'privatus',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {},
  setup(options, nuxt) {
    addImports({ name: 'usePrivatus', from: '@privatus-analytics/nuxt/runtime' })
    const site = resolveSite(options)
    if (!site) {
      console.warn('[privatus] No site id: set `privatus.site` or NUXT_PUBLIC_PRIVATUS_SITE. Tracker not added.')
      return
    }
    applyToNuxtOptions(nuxt.options as unknown as NuxtOptionsLike, { ...options, site })
  },
})
