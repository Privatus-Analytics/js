// A Content Security Policy with a nonce, the way the Next.js docs show it: the proxy
// puts the nonce in an x-nonce request header and sends the policy. Next.js reads the
// nonce from the policy and adds it to its own scripts. The layouts pass it to the tag.
import { NextResponse } from 'next/server'

const NONCE = 'testnonce'

export function proxy(request) {
  const scriptHost = (process.env.PRIVATUS_SCRIPT_HOST || 'https://privatusstats.com').replace(/\/+$/, '')
  const policy = `script-src 'nonce-${NONCE}' ${scriptHost}`
  const headers = new Headers(request.headers)
  headers.set('x-nonce', NONCE)
  headers.set('content-security-policy', policy)
  const response = NextResponse.next({ request: { headers } })
  response.headers.set('content-security-policy', policy)
  return response
}

export const config = { matcher: '/((?!_next/static|_next/image|favicon.ico).*)' }
