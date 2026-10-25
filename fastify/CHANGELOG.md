# Changelog

## 1.0.0 - 2026-10-25

- Initial release of `@privatus-analytics/fastify`.
- Fastify plugin: `reply.privatusAnalyticsTag()`, `app.privatus` helpers and `reply.locals` helpers for `@fastify/view`.
- Optional auto inject (`autoInject: true`) in an `onSend` hook for string and Buffer bodies. Uses the `@fastify/helmet` nonce.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
