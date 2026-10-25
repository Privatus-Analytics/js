# syntax=docker/dockerfile:1
# Conformance example site (Docusaurus). Build with the package folder as the context:
#   docker build -f example/Dockerfile .
#
# The package bundles the shared HTML rules from the monorepo's html-core folder
# when it is built, and that folder is outside this build context. A plain build
# takes it from the monorepo on GitHub (main). To test your local copy, pass the
# monorepo folder as the "workspace" context:
#   docker build --build-context workspace=.. -f example/Dockerfile .
#
# A static site reads its settings when it is built, not when it is served, so the
# site id and script host are build arguments. Their defaults are the values the
# conformance suite uses.
FROM scratch AS workspace
ADD https://github.com/Privatus-Analytics/js.git#main /

# Build the package from this folder's source and pack it, the way npm would ship it.
FROM node:22-slim AS package
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
WORKDIR /ws
COPY --from=workspace tsconfig.base.json ./
COPY --from=workspace html-core/package.json html-core/tsconfig.json html-core/
COPY --from=workspace html-core/src/ html-core/src/
COPY package.json tsconfig.json tsup.config.ts README.md LICENSE docusaurus/
COPY src/ docusaurus/src/
# Only the build tools from the package's dev dependencies, and html-core linked in.
RUN node -e 'const p = require("./docusaurus/package.json"); const keep = ["tsup", "typescript", "@types/node"]; \
      const d = Object.fromEntries(Object.entries(p.devDependencies).filter(([k]) => keep.includes(k))); \
      require("fs").writeFileSync("package.json", JSON.stringify({ private: true, devDependencies: d }))' \
 && npm install \
 && mkdir -p node_modules/@privatus-analytics && ln -s ../../html-core node_modules/@privatus-analytics/html-core \
 && mkdir /out && cd docusaurus && npx tsup && npm pack --pack-destination /out

FROM node:22-slim AS site
ARG PRIVATUS_SITE_ID=pa_CONFORMANCE1
ARG PRIVATUS_SCRIPT_HOST=http://mock:4000
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false \
    PRIVATUS_SITE_ID=$PRIVATUS_SITE_ID PRIVATUS_SCRIPT_HOST=$PRIVATUS_SCRIPT_HOST
WORKDIR /example
COPY --from=package /out/ /pkg/
COPY example/package.json ./
RUN npm install --no-package-lock && npm install --no-package-lock /pkg/*.tgz
COPY example/ ./
RUN sh build.sh /site

FROM nginx:1.27-alpine
COPY example/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=site /site /usr/share/nginx/html
EXPOSE 8080
