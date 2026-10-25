# Changelog

## Unreleased

- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Auto inject still adds nothing while the tag is off.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- Added: `example/`, a small Fastify app for the conformance tests.

## 1.0.0 - 2026-10-25

- Initial release of `@privatus-analytics/fastify`.
- Fastify plugin: `reply.privatusAnalyticsTag()`, `app.privatus` helpers and `reply.locals` helpers for `@fastify/view`.
- Optional auto inject (`autoInject: true`) in an `onSend` hook for string and Buffer bodies. Uses the `@fastify/helmet` nonce.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
