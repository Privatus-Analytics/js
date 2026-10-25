#!/bin/sh
# Installs, builds, tests and typechecks every package in a pinned Node image, with the
# workspace's own npm scripts. The repo is copied into the container, so nothing is
# written to your checkout and your local Node does not matter. Usage: ./run-docker.sh
#
# The tracker tests that run the real pa.js use copies in tracker/test/fixtures/, so the
# app repo is not needed. scripts/refresh-tracker-fixtures.sh updates those copies.
set -e
docker run --rm -v "$PWD":/src:ro -w /app node:22-slim sh -c 'set -e
  tar -C /src --exclude=node_modules --exclude=dist --exclude=.git -cf - . | tar -xf -
  npm ci --no-audit --no-fund
  npm run build
  npm test
  npm run typecheck
  # The built packages load the way their tools load them.
  node -e "
    require(\"./express/dist/index.cjs\"); require(\"./fastify/dist/index.cjs\"); require(\"./hono/dist/index.cjs\")
    require(\"reflect-metadata\"); require(\"./nestjs/dist/index.cjs\")
    if (typeof require(\"./eleventy/dist/index.cjs\").privatusPlugin !== \"function\") process.exit(1)
    if (typeof require(\"./docusaurus/dist/index.cjs\").default !== \"function\") process.exit(1)
    if (typeof require(\"./gatsby/gatsby-ssr.js\").onRenderBody !== \"function\") process.exit(1)
    if (typeof require(\"./gatsby/gatsby-node.js\").pluginOptionsSchema !== \"function\") process.exit(1)
    if (typeof require(\"./next/dist/server.cjs\").PrivatusAnalyticsTag !== \"function\") process.exit(1)
    console.log(\"CommonJS entry points load.\")"
  for p in express fastify hono nestjs eleventy docusaurus vitepress gatsby; do
    npm pack --dry-run --json -w "$p" | node -e "
      const [r] = JSON.parse(require(\"fs\").readFileSync(0, \"utf8\"))
      console.log(r.name + \"@\" + r.version + \": \" + r.files.map((f) => f.path).join(\", \"))"
  done
'
