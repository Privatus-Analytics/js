#!/bin/sh
# Copies the real tracker from the Privatus app repo into tracker/test/fixtures/, for the
# tracker tests that run pa.js itself (interaction.test.ts and retry.test.ts).
#
#   PRIVATUS_APP=~/projects/analytics/web ./scripts/refresh-tracker-fixtures.sh
#
# It copies two files, as committed at PRIVATUS_APP_REF (default HEAD):
#   tracker/src/pa.js  the source            -> tracker/test/fixtures/pa.src.js
#   public/js/pa.js    the minified build    -> tracker/test/fixtures/pa.min.js
# The app builds the second from the first with `bin/rails tracker:build` and commits both.
# Set PRIVATUS_APP_REF=worktree to copy the files as they are on disk, uncommitted changes included.
# The source commit and date are written to tracker/test/fixtures/README.md.
set -e
if [ -z "$PRIVATUS_APP" ]; then
  echo "Set PRIVATUS_APP to the app repo, e.g. PRIVATUS_APP=~/projects/analytics/web $0" >&2
  exit 1
fi
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT="$ROOT/tracker/test/fixtures"
REF=${PRIVATUS_APP_REF:-HEAD}
mkdir -p "$OUT"

copy() { # copy <path in app> <fixture name>
  if [ "$REF" = worktree ]; then
    cp "$PRIVATUS_APP/$1" "$OUT/$2"
  else
    git -C "$PRIVATUS_APP" show "$REF:$1" > "$OUT/$2"
  fi
}
copy tracker/src/pa.js pa.src.js
copy public/js/pa.js pa.min.js

if [ "$REF" = worktree ]; then
  COMMIT=$(git -C "$PRIVATUS_APP" rev-parse HEAD)
  if git -C "$PRIVATUS_APP" diff --quiet HEAD -- tracker/src/pa.js public/js/pa.js; then
    STATE="as committed"
  else
    STATE="with uncommitted changes on top"
  fi
else
  COMMIT=$(git -C "$PRIVATUS_APP" rev-parse "$REF")
  STATE="as committed"
fi
DATE=$(git -C "$PRIVATUS_APP" show -s --format=%cI "$COMMIT")

cat > "$OUT/README.md" <<README
# Tracker fixtures

Copies of the real tracker from the Privatus app repo. \`test/interaction.test.ts\` and
\`test/retry.test.ts\` run them in jsdom, so these tests work without the app repo.

| Fixture | Copied from (app repo) |
|---|---|
| \`pa.src.js\` | \`tracker/src/pa.js\`, the source |
| \`pa.min.js\` | \`public/js/pa.js\`, the minified file that sites load (built by \`bin/rails tracker:build\`) |

Source commit: \`$COMMIT\` ($STATE)
Commit date: $DATE
Copied on: $(date -u +%Y-%m-%d)

Do not edit these files by hand. To update them, run from the repo root:

    PRIVATUS_APP=~/projects/analytics/web ./scripts/refresh-tracker-fixtures.sh
README
echo "Copied pa.js from $COMMIT ($STATE) into tracker/test/fixtures"
