/** Auto-imported by @privatus-analytics/nuxt: the tracker client (SSR-safe no-ops on the server). */
import { getClient, type PrivatusClient } from '@privatus-analytics/tracker'

export type { PrivatusClient } from '@privatus-analytics/tracker'

export function usePrivatus(namespace = 'privatus'): PrivatusClient {
  return getClient(namespace)
}
