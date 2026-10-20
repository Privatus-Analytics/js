/**
 * @privatus/next client entry (bundled with a "use client" banner).
 *
 * <PrivatusAnalytics site="pa_XXXX" /> loads pa.js from
 * privatusanalytics.com and sends hits there.
 */
import { useEffect, useMemo } from 'react'
import { getClient, init, type PrivatusClient, type PrivatusOptions } from '@privatus/tracker'

export type { PrivatusClient, PrivatusOptions, Props, PageviewOptions } from '@privatus/tracker'

export type PrivatusAnalyticsProps = PrivatusOptions

/** The tracker options the component uses (exported for tests and custom loaders). */
export function resolveOptions(options: PrivatusAnalyticsProps): PrivatusOptions {
  return { ...options }
}

/** Injects pa.js once (after hydration). Renders nothing. */
export function PrivatusAnalytics(props: PrivatusAnalyticsProps): null {
  const key = JSON.stringify(props)
  useEffect(() => {
    init(resolveOptions(props))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

/** The tracker client: track, trackAsync, pageview, props, optOut, optIn, isOptedOut. */
export function usePrivatus(namespace = 'privatus'): PrivatusClient {
  return useMemo(() => getClient(namespace), [namespace])
}
