# Changelog

## 1.0.0 - 2026-10-28

- Initial release of `rspress-plugin-privatus`.
- `pluginPrivatus()` adds the tracking script to the `<head>` of every page in `rspress build`, and
  nothing while `rspress dev` runs.
- Loads the `engage`, `auto`, `vitals`, `clicks` and `ask` modules unless you set `modules`.
- The script tag follows the other Privatus Analytics packages: site id (or `PRIVATUS_SITE_ID`), script
  host (or `PRIVATUS_SCRIPT_HOST`), modules, excluded paths, domains, single-page app mode, manual mode,
  extra attributes, Content Security Policy nonce, the queue stub and page props (an object, or a
  function that gets each page's route).
- Never sends requests, sets no cookies and reads no visitor data.
