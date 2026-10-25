# Changelog

## 1.0.0 - 2026-10-25

- Initial release of `eleventy-plugin-privatus`.
- Eleventy plugin that puts the tag before `</head>` on every HTML page of a build (not with `--serve` or `--watch`).
- Shortcodes `privatusAnalyticsTag`, `privatusEventAttrs` and `privatusClickAttr` for Nunjucks, Liquid and JavaScript templates. Page props from an object or a function of the page.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
