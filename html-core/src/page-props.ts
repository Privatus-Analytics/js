/**
 * Page props (plan, role and so on) as JSON that is safe inside a <script>.
 * Keys follow the same rules as event props. Numbers, booleans and lists keep their JSON types.
 */
import { MAX_VALUE, cut, normalizeKey, normalizeProps, type Props } from './attributes.js'

export const MAX_ITEMS = 30
const UNSAFE = /[<>&\u2028\u2029]/g

function scalar(value: unknown): unknown {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  return cut(String(value), MAX_VALUE)
}

function jsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .slice(0, MAX_ITEMS)
      .map(scalar)
      .filter((item) => item !== undefined)
  }
  return scalar(value)
}

/** A JSON object string, or null when there are no props to send. */
export function pagePropsJson(props: Props | null | undefined): string | null {
  const parts: string[] = []
  for (const [key, raw] of normalizeProps(props)) {
    const value = jsonValue(raw)
    if (value === undefined) continue
    parts.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`)
  }
  if (parts.length === 0) return null
  return `{${parts.join(',')}}`.replace(UNSAFE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

/**
 * Merges page props: the keys of each later object are cleaned and replace the earlier ones.
 * A null value removes a prop.
 */
export function mergeProps(...sources: Array<Props | null | undefined>): Props {
  const merged: Props = {}
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const [key, value] of Object.entries(source)) merged[normalizeKey(key)] = value
  }
  return merged
}
