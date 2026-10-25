/**
 * Auto inject rules, the same as the Ruby gem's Rack middleware: only 200 text/html
 * responses without a Content-Encoding, not Ajax requests, and only pages that have a
 * </head> and do not already contain "/js/pa.js".
 */
import { MARKER } from './tag.js'

const HEAD_CLOSE = /<\/head>/i

export interface InjectCheck {
  status: number
  contentType?: string | null
  contentEncoding?: string | null
  /** The X-Requested-With request header. */
  requestedWith?: string | null
}

/** Whether a response may get the tag, from its status and headers. */
export function shouldInject(check: InjectCheck): boolean {
  if (check.status !== 200) return false
  if (!String(check.contentType ?? '').toLowerCase().startsWith('text/html')) return false
  if (check.contentEncoding !== null && check.contentEncoding !== undefined && check.contentEncoding !== '') return false
  return String(check.requestedWith ?? '').toLowerCase() !== 'xmlhttprequest'
}

/** Whether the HTML has a </head> and no Privatus script yet. */
export function canInjectInto(html: string): boolean {
  return !html.includes(MARKER) && HEAD_CLOSE.test(html)
}

/** Puts the tag just before the first </head>. Returns the HTML unchanged when it should not. */
export function injectTag(html: string, tag: string): string {
  if (tag === '' || !canInjectInto(html)) return html
  return html.replace(HEAD_CLOSE, () => `${tag}\n</head>`)
}
