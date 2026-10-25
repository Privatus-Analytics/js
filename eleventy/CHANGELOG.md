# Changelog

## Unreleased

- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Changed: with `queueStub` on, auto inject now adds the queue stub alone to every page while the tag is
  off (for example with `--serve`), so `privatus.track(...)` calls never fail in development. No tracker, no
  page props script, and the props function is not called. A page whose layout already prints the stub with
  the `privatusAnalyticsTag` shortcode does not get a second one. With `queueStub` off it adds nothing.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- `example/`: a tiny site for the Privatus conformance tests, built with the plugin and served by nginx.

## 1.0.0 - 2026-10-25

- Initial release of `eleventy-plugin-privatus`.
- Eleventy plugin that puts the tag before `</head>` on every HTML page of a build (not with `--serve` or `--watch`).
- Shortcodes `privatusAnalyticsTag`, `privatusEventAttrs` and `privatusClickAttr` for Nunjucks, Liquid and JavaScript templates. Page props from an object or a function of the page.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
