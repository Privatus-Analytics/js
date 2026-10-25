/**
 * @privatus-analytics/svelte: Privatus Analytics for Svelte and SvelteKit.
 *
 * - `initPrivatus(options)` in a root layout's onMount (or use the hook).
 * - `use:privatus={{ name: 'signup', props: { plan } }}` action.
 * - `privatusHandle(options)` SvelteKit `handle` hook that server-renders
 *   the tracker <script> into <head>.
 *
 * No cookies, storage or device ids.
 */
import { getClient, init, renderScriptTag, type PrivatusClient, type PrivatusOptions, type Props } from '@privatus-analytics/tracker'

export type { PrivatusClient, PrivatusOptions, Props, PageviewOptions } from '@privatus-analytics/tracker'

export { getClient }

/** Inject pa.js in the browser (no-op on the server). */
export function initPrivatus(options: PrivatusOptions): PrivatusClient {
  return init(options)
}

export interface PrivatusActionParams {
  name: string
  props?: Props
  /** DOM event that triggers tracking (default `click`). */
  on?: string
  namespace?: string
}

/** Svelte action: `<button use:privatus={{ name: 'signup' }}>`. */
export function privatus(node: HTMLElement, params: PrivatusActionParams) {
  let current = params
  const handler = () => getClient(current.namespace).track(current.name, current.props)
  let eventName = current.on || 'click'
  node.addEventListener(eventName, handler)
  return {
    update(next: PrivatusActionParams) {
      node.removeEventListener(eventName, handler)
      current = next
      eventName = current.on || 'click'
      node.addEventListener(eventName, handler)
    },
    destroy() {
      node.removeEventListener(eventName, handler)
    },
  }
}

/* Minimal structural SvelteKit types so this package does not depend on @sveltejs/kit. */
export interface ResolveOptions {
  transformPageChunk?: (input: { html: string; done: boolean }) => string | undefined | Promise<string | undefined>
  [key: string]: unknown
}
export type Resolve<E> = (event: E, opts?: ResolveOptions) => Response | Promise<Response>
export type PrivatusHandle = <E>(input: { event: E; resolve: Resolve<E> }) => Response | Promise<Response>

/**
 * SvelteKit `handle` hook that inserts the tracker <script> before </head>.
 *
 *   // src/hooks.server.ts
 *   export const handle = privatusHandle({ site: 'pa_XXXX' })
 *   // or: export const handle = sequence(privatusHandle({ ... }), yourHandle)
 */
export function privatusHandle(options: PrivatusOptions): PrivatusHandle {
  const tag = renderScriptTag(options)
  return ({ event, resolve }) =>
    resolve(event, {
      transformPageChunk: ({ html }) => (html.includes('</head>') ? html.replace('</head>', `${tag}</head>`) : html),
    })
}
