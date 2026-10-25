#!/bin/sh
# Installs, builds, tests and typechecks every package in a pinned Node image, with the
# workspace's own npm scripts. The repo is copied into the container, so nothing is
# written to your checkout and your local Node does not matter. Usage: ./run-docker.sh
#
# Two @privatus-analytics/tracker test files read the real pa.js from the app repo, four folders
# above tracker/test (tracker/src/pa.js and public/js/pa.js). Inside the container
# that is the filesystem root. If the app repo is not on this machine, point
# PRIVATUS_APP at it: PRIVATUS_APP=~/projects/privatus-app ./run-docker.sh
set -e
APP_MOUNTS=""
if [ -n "$PRIVATUS_APP" ]; then
  APP_MOUNTS="-v $PRIVATUS_APP/tracker:/tracker:ro -v $PRIVATUS_APP/public:/public:ro"
fi
# shellcheck disable=SC2086
docker run --rm -v "$PWD":/src:ro $APP_MOUNTS -w /app node:22-slim sh -c 'set -e
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
    console.log(\"CommonJS entry points load.\")"
  for p in express fastify hono nestjs eleventy docusaurus vitepress gatsby; do
    npm pack --dry-run --json -w "$p" | node -e "
      const [r] = JSON.parse(require(\"fs\").readFileSync(0, \"utf8\"))
      console.log(r.name + \"@\" + r.version + \": \" + r.files.map((f) => f.path).join(\", \"))"
  done
'
