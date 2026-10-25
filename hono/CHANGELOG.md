# Changelog

## 1.0.0 - 2026-10-25

- Initial release of `@privatus-analytics/hono`.
- Hono middleware and `privatusAnalyticsTag(c)` for `html` templates and JSX, with `eventAttrs`, `eventData`, `clickAttr` and `clickData`.
- Optional auto inject (`autoInject: true`) that rewrites the HTML `Response`. Reads the site id and `NODE_ENV` from Workers variables too, and uses the `secureHeaders` nonce.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
