# Changelog

## 0.1.1 - 2026-10-26

- README: a new intro that starts with the problem Privatus Analytics solves.
- Fix: the tracking script now loads from the tracker host, `https://privatusstats.com/js/pa.js`, through
  `@privatus-analytics/tracker`. It used to point at `https://privatusanalytics.com`, the website.
  Needs the next `@privatus-analytics/tracker` release.
- Added: `@privatus-analytics/next/server` with `<PrivatusAnalyticsTag />`, the script tag rendered on the
  server for the `<head>` of your root layout. It has the same settings as the other Privatus packages: site id
  (or `PRIVATUS_SITE_ID`), script host (or `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains,
  single-page app mode, manual mode, extra attributes, `enabled`, the Content Security Policy nonce, page props
  (`privatusPageProps` and `data-props`) and the queue stub. On only in production unless `enabled` says
  otherwise. When it is off, it prints only the queue stub (when `queueStub` is on), so `privatus.track(...)`
  calls never fail, and otherwise nothing.
- Added: `eventData` and `clickData` in `@privatus-analytics/next/server`, to spread custom event and click map
  attributes on buttons, links and forms.
- Added: `example/`, a small Next.js app for the conformance tests.
- README: rewritten around the server tag, with product analytics and a privacy section, including a paragraph
  you can paste into your privacy policy.

## 0.1.0 - 2026-10-20

- Initial release of `@privatus-analytics/next`.
