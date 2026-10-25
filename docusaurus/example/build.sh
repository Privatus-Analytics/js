#!/bin/sh
# Builds the site four times and puts the pages in one folder ($1). The plugin's
# settings are for the whole site, so each setting needs its own build:
#   main       / and /event
#   nasty      /nasty: the page props also hold the nasty value
#   off        /off: the tag forced off, queue stub on
#   off-plain  /off-plain: the tag forced off, queue stub off
# Each build's JavaScript files have their own hashed names, so they are copied
# next to each other and every page loads its own build's files.
# Docusaurus has no step that adds the tag to finished HTML, so there is no /auto
# page and nginx answers 404 for it.
# SKIP_HTML_MINIFICATION: a normal build shortens (minifies) the inline scripts in
# every page, which turns the official queue stub into shorter code that does the
# same thing. The suite compares the stub letter by letter, so this build keeps the
# plugin's own output. (The JavaScript bundles are still minified.)
set -e
export SKIP_HTML_MINIFICATION=true
out="$1"
cd "$(dirname "$0")"
EXAMPLE_BUILD=main npx docusaurus build --out-dir "$out" >/dev/null
for name in nasty off off-plain; do
  EXAMPLE_BUILD=$name npx docusaurus build --out-dir "/tmp/$name" >/dev/null
  cp -R "/tmp/$name/assets/." "$out/assets/"
  rm -rf "$out/$name"
  mkdir -p "$out/$name"
  cp "/tmp/$name/$name/index.html" "$out/$name/index.html"
done
