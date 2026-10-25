/**
 * @privatus-analytics/html-core: internal, never published. The HTML rules shared by the
 * Privatus server middleware and site generator plugins. Each package bundles it.
 *
 * It only builds strings. It never sends requests, sets cookies or reads visitor data.
 *
 * Named re-exports (not export *) so the bundled type declarations stay exact.
 */
export { MAX_NAME, MAX_KEY, MAX_PROPS, MAX_VALUE, CLICK_NAME, cut, escapeHtml, normalizeKey, normalizeProps, eventData, isValidClickName, clickData, attributesToHtml, eventAttrs, clickAttr, type PropValue, type Props } from './attributes.js'
export { MAX_ITEMS, pagePropsJson, mergeProps } from './page-props.js'
export { DEFAULT_HOST, MARKER, PROPS_FUNCTION, SPA_MODES, QUEUE_STUB, resolveSiteId, resolveScriptHost, defaultEnv, isProduction, tagElements, renderElement, renderTag, type SpaMode, type EnvSource, type TagSettings, type ScriptElement, type TagInput } from './tag.js'
export { shouldInject, canInjectInto, injectTag, type InjectCheck } from './inject.js'
export { resolveProps, tagInput, contextTag, contextElements, willPrint, type PropsSetting, type BaseOptions, type TagOverrides, type Runtime } from './context.js'
