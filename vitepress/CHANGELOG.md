# Changelog

## Unreleased

- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing.
- Changed: with `queueStub` on, `privatusVitePlugin` now adds the queue stub alone to `index.html` while the
  tag is off (a development build, `enabled: false` or no site id), and it now runs in the Vite dev server
  too, where it only ever adds the stub (never the tracker). The props function is not called then. A page
  that already has the stub does not get a second one. With `queueStub` off it adds nothing, as before.
- Changed: `privatusTransformHead` adds no second queue stub to a page whose head already has one from
  `privatusHead` while the tag is off.
- Fixed: VitePress minified the inline head scripts from `privatusHead` and `privatusTransformHead`, which
  changed the official queue stub and undid the page props escaping (found by the conformance tests). They
  now carry `type="text/ecmascript"`, so VitePress leaves them exactly as printed.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- `example/`: a tiny site for the Privatus conformance tests, built with the plugin and served by nginx.

## 1.0.0 - 2026-10-25

- Initial release of `vitepress-plugin-privatus`.
- `privatusHead()` head entries and a `privatusTransformHead()` hook for VitePress, with per page props from the page data.
- `privatusVitePlugin()` for plain Vite apps (`transformIndexHtml`, production builds only).
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
