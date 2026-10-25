/**
 * @privatus-analytics/astro: Astro integration for Privatus Analytics.
 *
 *   // astro.config.mjs
 *   import privatus from '@privatus-analytics/astro'
 *   export default defineConfig({ integrations: [privatus({ site: 'pa_XXXX' })] })
 *
 * Adds a tiny inline loader to every page's <head> that installs the queue
 * stub and injects pa.js once. Works with static and SSR output and with
 * view transitions (pa.js tracks pushState navigations). No cookies,
 * storage or device ids.
 */
import { loaderSnippet, type PrivatusOptions } from '@privatus-analytics/tracker'

export type { PrivatusOptions } from '@privatus-analytics/tracker'
export { getClient, track, trackAsync, pageview, props, optOut, optIn, isOptedOut } from '@privatus-analytics/tracker'

type InjectedScriptStage = 'head-inline' | 'before-hydration' | 'page' | 'page-ssr'

/** Structural subset of Astro's AstroIntegration (no dependency on `astro`). */
export interface PrivatusAstroIntegration {
  name: string
  hooks: {
    'astro:config:setup': (params: { injectScript: (stage: InjectedScriptStage, content: string) => void }) => void
  }
}

export default function privatus(options: PrivatusOptions): PrivatusAstroIntegration {
  const snippet = loaderSnippet(options)
  return {
    name: '@privatus-analytics/astro',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('head-inline', snippet)
      },
    },
  }
}
