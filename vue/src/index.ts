/**
 * @privatus/vue: Vue 3 plugin for the Privatus Analytics tracker.
 *
 *   app.use(createPrivatus({ site: 'pa_XXXX' }))
 *
 * No cookies, storage or device ids. SSR-safe: nothing is injected when
 * there is no `window` (the plugin can be installed in SSR apps as-is).
 */
import { inject, type App, type Directive, type InjectionKey, type Plugin } from 'vue'
import { getClient, init, namespaceOf, type PrivatusClient, type PrivatusOptions, type Props } from '@privatus/tracker'

export type { PrivatusClient, PrivatusOptions, Props, PageviewOptions } from '@privatus/tracker'

export const PrivatusKey: InjectionKey<PrivatusClient> = Symbol('privatus')

export type EventBinding = string | { name: string; props?: Props; on?: string }

type BoundElement = HTMLElement & { __privatus?: { handler: () => void; on: string } }

function normalize(value: EventBinding): { name: string; props?: Props; on: string } {
  return typeof value === 'string' ? { name: value, on: 'click' } : { on: 'click', ...value }
}

/** `v-privatus-event="'signup'"` or `v-privatus-event="{ name: 'signup', props: { plan } }"`. */
export function eventDirective(client: PrivatusClient): Directive<BoundElement, EventBinding> {
  const bind = (el: BoundElement, value: EventBinding) => {
    const binding = normalize(value)
    const handler = () => client.track(binding.name, binding.props)
    el.__privatus = { handler, on: binding.on }
    el.addEventListener(binding.on, handler)
  }
  const unbind = (el: BoundElement) => {
    if (el.__privatus) el.removeEventListener(el.__privatus.on, el.__privatus.handler)
    delete el.__privatus
  }
  return {
    mounted: (el, { value }) => bind(el, value),
    updated: (el, { value }) => {
      unbind(el)
      bind(el, value)
    },
    beforeUnmount: (el) => unbind(el),
  }
}

export function createPrivatus(options: PrivatusOptions): Plugin & { client: PrivatusClient } {
  const client = getClient(namespaceOf(options))
  return {
    client,
    install(app: App) {
      init(options)
      app.provide(PrivatusKey, client)
      app.config.globalProperties.$privatus = client
      app.directive('privatus-event', eventDirective(client))
    },
  }
}

/** The tracker client provided by the plugin (or the default client). */
export function usePrivatus(): PrivatusClient {
  return inject(PrivatusKey, null) ?? getClient()
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $privatus: PrivatusClient
  }
}
