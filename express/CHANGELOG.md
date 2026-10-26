# Changelog

## 1.0.1 - 2026-10-26

- README: a new intro that starts with the problem Privatus Analytics solves.
- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Auto inject still adds nothing while the tag is off.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- Added: `example/`, a small Express app for the conformance tests.

## 1.0.0 - 2026-10-25

- Initial release of `@privatus-analytics/express`.
- Express middleware: `privatusAnalyticsTag()`, `privatusEventAttrs()` and `privatusClickAttr()` on `res.locals`, plain `eventAttrs`, `eventData`, `clickAttr` and `clickData` helpers, and `middleware.tag(req, res)`.
- Optional auto inject (`autoInject: true`) that wraps `res.write` and `res.end`, fixes `Content-Length` and drops the `ETag`.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
