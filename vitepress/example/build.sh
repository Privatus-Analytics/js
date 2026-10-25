#!/bin/sh
# Builds the VitePress site and a plain Vite app, and puts the pages in one folder ($1).
#   site/      /, /event, /nasty, /off and /off-plain, with privatusTransformHead
#   auto-app/  /auto: a plain Vite page, where privatusVitePlugin adds the tag
# VitePress itself has no step that adds the tag to finished HTML. The Vite plugin
# is that step for plain Vite apps, so /auto tests it.
set -e
out="$1"
cd "$(dirname "$0")"
npx vitepress build site --outDir "$out" >/dev/null
npx vite build auto-app --outDir /tmp/auto --logLevel warn
mkdir -p "$out/auto"
cp /tmp/auto/index.html "$out/auto/index.html"
