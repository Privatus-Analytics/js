#!/bin/sh
# Builds the site twice and puts the pages in one folder ($1).
#   main  every page, with the {% privatusAnalyticsTag %} shortcode in the layout
#   auto  /auto: the plugin's transform puts the tag in a layout without the shortcode
# The transform is for the whole site, so it gets its own build.
set -e
out="$1"
cd "$(dirname "$0")"
EXAMPLE_BUILD=main npx @11ty/eleventy --quiet --output="$out"
EXAMPLE_BUILD=auto npx @11ty/eleventy --quiet --output=/tmp/auto
cp /tmp/auto/auto/index.html "$out/auto/index.html"
