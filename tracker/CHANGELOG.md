# Changelog

## Unreleased

- Fix: the hosted script now loads from the tracker host, `https://privatusstats.com/js/pa.js`, and hits go
  there too. It used to point at `https://privatusanalytics.com`, the website. `DEFAULT_HOST` is now
  `https://privatusstats.com`. Setting `api` or `src` works as before.
- The tests that run the real `pa.js` now use copies kept in `test/fixtures/`, so they pass without the app
  repo next to this one. `scripts/refresh-tracker-fixtures.sh` updates the copies.
- README: a privacy section, with a paragraph you can paste into your privacy policy.

## 0.1.0 - 2026-10-20

- Initial release of `@privatus-analytics/tracker`.
