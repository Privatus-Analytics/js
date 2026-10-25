/**
 * The glue every package uses: settings from configuration, a props function that
 * gets the request (or page), per call overrides, and the package's own idea of
 * whether the tag is on.
 */
import type { Props } from './attributes.js'
import { mergeProps } from './page-props.js'
import { defaultEnv, renderTag, resolveSiteId, tagElements, type EnvSource, type ScriptElement, type TagInput, type TagSettings } from './tag.js'

/** Page props: a plain object, or a function called for each request or page. */
export type PropsSetting<Ctx> = Props | null | ((context: Ctx) => Props | null | undefined)

export interface BaseOptions<Ctx> extends TagSettings {
  /** true or false forces the tag on or off. Leave it unset to use the package default. */
  enabled?: boolean | null
  /**
   * Page props sent with every pageview and event on the page.
   * Never put names, emails, user ids or anything that points to one person here.
   */
  props?: PropsSetting<Ctx>
}

/** Options you can change for one call. Props are merged over the configured ones. null removes one. */
export interface TagOverrides extends TagSettings {
  enabled?: boolean | null
  props?: Props | null
}

export interface Runtime {
  /** Whether the tag is on when `enabled` is not set. */
  defaultEnabled: boolean
  /** The framework's CSP nonce for this request, if any. */
  nonce?: string | null
  /** Where to read PRIVATUS_SITE_ID and PRIVATUS_SCRIPT_HOST. Defaults to process.env. */
  env?: EnvSource
}

/** Calls the props function, or returns the plain object. */
export function resolveProps<Ctx>(setting: PropsSetting<Ctx> | undefined, context: Ctx): Props {
  const value = typeof setting === 'function' ? setting(context) : setting
  return value && typeof value === 'object' ? value : {}
}

/** The TagInput for one request or page. The props function only runs when the tag prints. */
export function tagInput<Ctx>(options: BaseOptions<Ctx>, context: Ctx, overrides: TagOverrides | null | undefined, runtime: Runtime): TagInput {
  const { enabled: enabledOption, props: propsSetting, ...settings } = options
  const { enabled: enabledOverride, props: propsOverride, ...overrideSettings } = overrides ?? {}
  const merged: TagSettings = { ...settings }
  for (const [key, value] of Object.entries(overrideSettings)) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value
  }
  const enabled = enabledOverride ?? enabledOption ?? runtime.defaultEnabled
  const nonce = overrideSettings.nonce ?? runtime.nonce ?? settings.nonce
  const input: TagInput = {
    ...merged,
    nonce,
    enabled: enabled === true,
    props: () => mergeProps(resolveProps(propsSetting, context), propsOverride),
  }
  if (runtime.env !== undefined) input.env = runtime.env
  return input
}

/** The tag HTML for one request or page. When off: only the queue stub (when it is on), else ''. */
export function contextTag<Ctx>(options: BaseOptions<Ctx>, context: Ctx, overrides: TagOverrides | null | undefined, runtime: Runtime): string {
  return renderTag(tagInput(options, context, overrides, runtime))
}

/** The script elements for one request or page. When off: only the queue stub (when it is on), else []. */
export function contextElements<Ctx>(options: BaseOptions<Ctx>, context: Ctx, overrides: TagOverrides | null | undefined, runtime: Runtime): ScriptElement[] {
  return tagElements(tagInput(options, context, overrides, runtime))
}

/**
 * Whether the tracker tag would print (a site id and on), without calling the props function.
 * A tag that is off but prints only the queue stub counts as false, so auto inject adds nothing.
 */
export function willPrint<Ctx>(options: BaseOptions<Ctx>, runtime: Runtime, overrides?: TagOverrides | null): boolean {
  const input = tagInput(options, undefined as Ctx, overrides, runtime)
  return input.enabled && resolveSiteId(input.siteId, 'env' in input ? input.env : defaultEnv()) !== undefined
}
