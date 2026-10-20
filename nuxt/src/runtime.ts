/** Auto-imported by @privatus/nuxt: the tracker client (SSR-safe no-ops on the server). */
import { getClient, type PrivatusClient } from '@privatus/tracker'

export type { PrivatusClient } from '@privatus/tracker'

export function usePrivatus(namespace = 'privatus'): PrivatusClient {
  return getClient(namespace)
}
