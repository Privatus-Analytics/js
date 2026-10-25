# Changelog

## Unreleased

- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Fixed: the auto inject transform now adds nothing while the tag is off. With the new stub rule it would
  have added the stub to every page in `--serve`, and a second one next to the shortcode.
- README: the privacy section has a paragraph you can paste into your privacy policy.

## 1.0.0 - 2026-10-25

- Initial release of `eleventy-plugin-privatus`.
- Eleventy plugin that puts the tag before `</head>` on every HTML page of a build (not with `--serve` or `--watch`).
- Shortcodes `privatusAnalyticsTag`, `privatusEventAttrs` and `privatusClickAttr` for Nunjucks, Liquid and JavaScript templates. Page props from an object or a function of the page.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
