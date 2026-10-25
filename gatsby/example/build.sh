#!/bin/sh
# Builds the site and copies it to one folder ($1).
# Gatsby has no step that adds the tag to finished HTML, so there is no /auto page
# and nginx answers 404 for it.
set -e
out="$1"
cd "$(dirname "$0")"
npx gatsby build --no-color
cp -R public "$out"
