# Changelog

## 1.0.1 - 2026-10-26

- README: a new intro that starts with the problem Privatus Analytics solves.
- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Changed: while the tag is off, the plugin adds no second queue stub when the site config's own `headTags`
  already hold one (for example from `headTags()`). Tests now check that every page gets exactly one stub.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- README: `docusaurus build` minifies the inline scripts; how to keep the exact text.
- `example/`: a tiny site for the Privatus conformance tests, built with the plugin and served by nginx.

## 1.0.0 - 2026-10-25

- Initial release of `docusaurus-plugin-privatus`.
- Docusaurus plugin that adds the tag to the head of every page in `docusaurus build` only.
- Option checks when Docusaurus loads the plugin. Page props from the config.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
