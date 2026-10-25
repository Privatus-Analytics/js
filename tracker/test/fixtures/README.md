# Tracker fixtures

Copies of the real tracker from the Privatus app repo. `test/interaction.test.ts` and
`test/retry.test.ts` run them in jsdom, so these tests work without the app repo.

| Fixture | Copied from (app repo) |
|---|---|
| `pa.src.js` | `tracker/src/pa.js`, the source |
| `pa.min.js` | `public/js/pa.js`, the minified file that sites load (built by `bin/rails tracker:build`) |

Source commit: `557f284069890058cb8e9e4c341bd228c4c32ea3` (as committed)
Commit date: 2026-10-23T08:19:43+08:00
Copied on: 2026-10-25

Do not edit these files by hand. To update them, run from the repo root:

    PRIVATUS_APP=~/projects/analytics/web ./scripts/refresh-tracker-fixtures.sh
