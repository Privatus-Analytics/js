/**
 * @privatus-analytics/next/server: the Privatus Analytics script tag and the event and
 * click attributes, rendered on the server. Use it in Server Components, like your
 * root layout. It also works in Client Components.
 *
 *   import { PrivatusAnalyticsTag, eventData, clickData } from '@privatus-analytics/next/server'
 *   <head><PrivatusAnalyticsTag props={{ plan: 'pro' }} /></head>
 *   <button {...eventData('Report exported', { format: 'csv' })}>Export</button>
 *
 * Only renders HTML: the browser script tag and data attributes. It never sends
 * events from your server, sets no cookies and reads no visitor data.
 */
import { createElement, Fragment, type ReactElement } from 'react'
import {
  clickAttr as coreClickAttr,
  clickData as coreClickData,
  eventData as coreEventData,
  isProduction,
  tagElements,
  type Props,
  type ScriptElement,
  type TagSettings,
} from '@privatus-analytics/html-core'

export type { Props, PropValue, SpaMode } from '@privatus-analytics/html-core'
export { QUEUE_STUB } from '@privatus-analytics/html-core'

export interface PrivatusAnalyticsTagProps extends TagSettings {
  /**
   * true or false forces the tag on or off. When not set: on only when NODE_ENV is
   * production (`next build` and `next start`), so `next dev` is never counted.
   */
  enabled?: boolean | null
  /**
   * Page props sent with every pageview and event on the page, like { plan: 'pro' }.
   * Never put names, emails, user ids or anything that points to one person here.
   */
  props?: Props | null
}

function warn(message: string): void {
  if (!isProduction()) console.warn(message)
}

function toReact(element: ScriptElement, index: number): ReactElement {
  const attributes: Record<string, unknown> = { key: index }
  for (const [name, value] of Object.entries(element.attributes)) attributes[name] = value
  // The code is the queue stub or the page props script, already safe inside <script>.
  if (element.code !== undefined) attributes.dangerouslySetInnerHTML = { __html: element.code }
  return createElement('script', attributes)
}

/**
 * The Privatus Analytics script tag. Put it in the <head> of your root layout.
 *
 * It prints only with a site id (or PRIVATUS_SITE_ID) and in production, unless
 * `enabled` says otherwise. When it is off, it prints only the queue stub if
 * `queueStub` is on, so privatus.track calls never fail, and otherwise nothing.
 */
export function PrivatusAnalyticsTag(options: PrivatusAnalyticsTagProps): ReactElement | null {
  const { enabled, props, ...settings } = options
  const elements = tagElements({ ...settings, enabled: (enabled ?? isProduction()) === true, props })
  if (elements.length === 0) return null
  return createElement(Fragment, null, ...elements.map(toReact))
}

/**
 * Attributes for a custom event, to spread on a button, link or form:
 * <button {...eventData('Report exported', { format: 'csv' })}>. On a <form> the
 * event is sent on submit.
 */
export function eventData(name: string, props?: Props | null): Record<string, string> {
  return coreEventData(name, props)
}

/**
 * `{ "data-privatus-click": name }` for a click map name, or {} when the name is not
 * valid (with a warning outside production).
 */
export function clickData(name: string): Record<string, string> {
  const data = coreClickData(name)
  if (!data['data-privatus-click']) coreClickAttr(name, warn)
  return data
}
