/**
 * Data attributes the tracker reads for custom events and click maps.
 * Same rules as the Ruby gem (privatus-analytics-rails, Attributes module).
 */

export const MAX_NAME = 120
export const MAX_KEY = 64
export const MAX_PROPS = 30
export const MAX_VALUE = 500
export const CLICK_NAME = /^[A-Za-z0-9_.:-]{1,100}$/

/** A value you can pass as an event prop or a page prop. */
export type PropValue = string | number | boolean | null | undefined | ReadonlyArray<string | number | boolean | null | undefined>
export type Props = Record<string, PropValue>

/** Cuts a string to `max` characters (code points, not UTF-16 halves). */
export function cut(value: string, max: number): string {
  const chars = Array.from(value)
  return chars.length > max ? chars.slice(0, max).join('') : value
}

/** Escapes text for an HTML attribute value or text node. */
export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Lowercases a key, swaps anything outside a-z 0-9 _ for _, and cuts it to 64 characters. */
export function normalizeKey(key: unknown): string {
  return cut(String(key).toLowerCase().replace(/[^a-z0-9_]/gu, '_'), MAX_KEY)
}

/**
 * Cleans prop keys, drops null and undefined values and keeps the first 30 props.
 * Returns a Map so the order is kept even for keys that look like numbers.
 */
export function normalizeProps(props: Props | null | undefined): Map<string, unknown> {
  const clean = new Map<string, unknown>()
  if (!props || typeof props !== 'object') return clean
  for (const [rawKey, value] of Object.entries(props)) {
    const key = normalizeKey(rawKey)
    if (key === '' || value === null || value === undefined) continue
    clean.set(key, value)
  }
  return new Map(Array.from(clean).slice(0, MAX_PROPS))
}

function stringValue(value: unknown): string {
  const text = Array.isArray(value)
    ? value.filter((item) => item !== null && item !== undefined).map(String).join(',')
    : String(value)
  return cut(text, MAX_VALUE)
}

/**
 * Attributes for a custom event: `{ "data-privatus-event": name, "data-privatus-prop-<key>": value }`.
 * Returns `{}` for an empty name.
 */
export function eventData(name: unknown, props?: Props | null): Record<string, string> {
  const clean = cut(String(name ?? '').trim(), MAX_NAME).trim()
  if (clean === '') return {}
  const attrs: Record<string, string> = { 'data-privatus-event': clean }
  for (const [key, value] of normalizeProps(props)) attrs[`data-privatus-prop-${key}`] = stringValue(value)
  return attrs
}

/** Whether a click map name is valid: letters, digits, _ . : - and at most 100 characters. */
export function isValidClickName(name: unknown): boolean {
  return typeof name === 'string' && CLICK_NAME.test(name)
}

/** `{ "data-privatus-click": name }`, or `{}` when the name is not valid. */
export function clickData(name: unknown): Record<string, string> {
  return isValidClickName(name) ? { 'data-privatus-click': name as string } : {}
}

/** Turns an attribute map into HTML, with every value escaped. */
export function attributesToHtml(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ')
}

/** `data-privatus-event="..." data-privatus-prop-...="..."` as an HTML string. */
export function eventAttrs(name: unknown, props?: Props | null): string {
  return attributesToHtml(eventData(name, props))
}

/** `data-privatus-click="..."` as an HTML string, or '' when the name is not valid. */
export function clickAttr(name: unknown, warn?: (message: string) => void): string {
  const data = clickData(name)
  if (!data['data-privatus-click'] && warn) {
    warn(
      `[privatus] click map name ${JSON.stringify(name)} is not valid. Use letters, digits and _ . : - only, ` +
        'at most 100 characters. Nothing was printed.',
    )
  }
  return attributesToHtml(data)
}
