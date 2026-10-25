/**
 * @privatus-analytics/react: load the Privatus Analytics tracker from a React tree.
 * No cookies, storage or device ids; SSR-safe (the script is injected in an
 * effect, which never runs on the server).
 */
import { useEffect, useMemo } from 'react'
import { getClient, init, type PrivatusClient, type PrivatusOptions } from '@privatus-analytics/tracker'

export type { PrivatusClient, PrivatusOptions, Props, PageviewOptions } from '@privatus-analytics/tracker'

export type PrivatusAnalyticsProps = PrivatusOptions

/**
 * Injects pa.js once. Render it once near the root:
 * `<PrivatusAnalytics site="pa_XXXX" />`. Renders nothing.
 */
export function PrivatusAnalytics(props: PrivatusAnalyticsProps): null {
  const key = JSON.stringify(props)
  useEffect(() => {
    init(props)
    // Options are read once; re-rendering with the same options is a no-op.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

/** The tracker client: track, trackAsync, pageview, props, optOut, optIn, isOptedOut. */
export function usePrivatus(namespace = 'privatus'): PrivatusClient {
  return useMemo(() => getClient(namespace), [namespace])
}
