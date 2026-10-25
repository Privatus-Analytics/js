/**
 * Checks the plugin options when Gatsby starts, so a typo fails early with a clear message.
 * Gatsby passes its own copy of Joi, so this package needs no Joi of its own.
 */

/** The parts of Joi this uses. */
type JoiLike = any

export function pluginOptionsSchema({ Joi }: { Joi: JoiLike }): unknown {
  const list = Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).allow(null)
  return Joi.object({
    siteId: Joi.string().allow('', null).description('The site id (starts with pa_). Falls back to PRIVATUS_SITE_ID.'),
    scriptHost: Joi.string().allow('', null).description('Origin that serves /js/pa.js. Default https://privatusstats.com.'),
    modules: list.description('Tracker modules. Leave unset for the tracker default. [] loads none.'),
    excludedPaths: list.description('Path globs the tracker never counts (data-exclude).'),
    domains: list.description('Hostnames to count (data-domains).'),
    spa: Joi.string().valid('auto', 'history', 'hash', 'off').allow(null),
    manual: Joi.boolean().allow(null),
    enabled: Joi.boolean().allow(null).description('true or false forces the tag on or off. Default: production builds only.'),
    extraAttributes: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).allow(null)).allow(null),
    queueStub: Joi.boolean().allow(null),
    nonce: Joi.string().allow('', null),
    props: Joi.object().allow(null).description('Page props sent with every pageview and event. Groups like plan or role, never people.'),
  })
}
