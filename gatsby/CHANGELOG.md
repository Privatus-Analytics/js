# Changelog

## 1.0.1 - 2026-10-26

- README: a new intro that starts with the problem Privatus Analytics solves.
- Changed: with `queueStub` on, a tag that is off (outside production, `enabled: false` or no site id) now
  prints the queue stub and nothing else, so `privatus.track(...)` calls in your own JavaScript never fail.
  Before, it printed nothing. With `queueStub` off it still prints nothing. `onRenderBody` adds the stub
  alone to every page in `gatsby develop`; tests now check each page gets exactly one, also with the
  README's `headComponents` swap.
- Fixed: in a real `gatsby build` the plugin added nothing (found by the conformance tests). Gatsby finds a
  plugin's APIs by reading `gatsby-ssr.js`, and the file only re-exported the built code, so Gatsby never saw
  `onRenderBody`. `gatsby-ssr.js` and `gatsby-node.js` now name each API.
- README: the privacy section has a paragraph you can paste into your privacy policy.
- README: how to use other settings on some pages with `headComponents`.
- `example/`: a tiny site for the Privatus conformance tests, built with the plugin and served by nginx.

## 1.0.0 - 2026-10-25

- Initial release of `gatsby-plugin-privatus`.
- Gatsby plugin that adds the tag to the head of every page in `gatsby build` only (`onRenderBody`).
- Option checks with `pluginOptionsSchema`. Page props from the config.
- The script tag follows the Privatus Analytics Rails gem: site id (or `PRIVATUS_SITE_ID`), script host (or
  `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode, extra attributes,
  Content Security Policy nonce, the queue stub and page props (`privatusPageProps` and `data-props`).
- Prints nothing without a site id, and only in production unless `enabled` says otherwise.
- Never sends requests, sets no cookies and reads no visitor data.
