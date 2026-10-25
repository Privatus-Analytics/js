/**
 * gatsby-plugin-privatus: Privatus Analytics for Gatsby.
 *
 *   // gatsby-config.js
 *   plugins: [{ resolve: 'gatsby-plugin-privatus', options: { siteId: 'pa_XXXX' } }]
 *
 * Adds the tracking script to the <head> of every page in `gatsby build`.
 * `gatsby develop` gets nothing, so your own visits while you build are not counted.
 *
 * Only adds HTML tags. It never sends requests, sets no cookies and reads no visitor data.
 */
import * as React from 'react'
import { contextElements, type BaseOptions, type Props, type ScriptElement } from '@privatus/html-core'

export type { Props, PropValue, SpaMode } from '@privatus/html-core'

export interface PrivatusGatsbyOptions extends Omit<BaseOptions<void>, 'props'> {
  /**
   * Page props sent with every pageview and event. A plain object, set once for the
   * whole site. Never put names, emails, user ids or anything that points to one person here.
   */
  props?: Props | null
  /** Gatsby adds this to every plugin's options. Ignored. */
  plugins?: unknown[]
}

/** The parts of Gatsby's onRenderBody arguments the plugin uses. */
export interface RenderBodyArgs {
  setHeadComponents: (components: React.ReactNode[]) => void
  pathname?: string
}

function element(script: ScriptElement, index: number): React.ReactElement {
  const props: Record<string, unknown> = { key: `privatus-analytics-${index}` }
  for (const [name, value] of Object.entries(script.attributes)) props[name] = value
  if (script.code !== undefined) props.dangerouslySetInnerHTML = { __html: script.code }
  return React.createElement('script', props)
}

/** The <script> elements for these options, or [] when the tag is off. */
export function headComponents(options: PrivatusGatsbyOptions = {}): React.ReactElement[] {
  const { plugins: _plugins, ...rest } = options
  // `gatsby build` sets NODE_ENV to production. `gatsby develop` sets development.
  const runtime = { defaultEnabled: process.env.NODE_ENV === 'production' }
  return contextElements(rest, undefined, null, runtime).map(element)
}

/**
 * Gatsby's server rendering hook. The tag prints only with a site id (or PRIVATUS_SITE_ID)
 * and only in production builds, unless `enabled` says otherwise.
 */
export function onRenderBody({ setHeadComponents }: RenderBodyArgs, options: PrivatusGatsbyOptions = {}): void {
  const components = headComponents(options)
  if (components.length) setHeadComponents(components)
}
