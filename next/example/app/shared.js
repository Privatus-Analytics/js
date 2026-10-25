// Conformance example app for @privatus-analytics/next.
//
// Built by the conformance suite (https://github.com/Privatus-Analytics/conformance).
// See its CONTRACT.md for what each route must render. The site id and script
// host come from PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST.
//
// Each route group has its own root layout, so each page decides what goes in <head>.
import { headers } from 'next/headers'

export const PAGE_PROPS = { plan: 'pro', role: 'admin', beta: true, seats: 3 }
export const NASTY = '</script><script>window.__pwned=1</script>  &<>"\''

/** The nonce the proxy put on the request. Reading headers also makes the page render per request. */
export async function nonce() {
  return (await headers()).get('x-nonce') ?? undefined
}
