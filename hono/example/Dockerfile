# syntax=docker/dockerfile:1
# Conformance example app (Hono). Build with the package folder as the context:
#   docker build -f example/Dockerfile .
#
# The package bundles the shared HTML rules from the monorepo's html-core folder
# when it is built, and that folder is outside this build context. A plain build
# takes it from the monorepo on GitHub (main). To test your local copy, pass the
# monorepo folder as the "workspace" context:
#   docker build --build-context workspace=.. -f example/Dockerfile .
FROM scratch AS workspace
ADD https://github.com/Privatus-Analytics/js.git#main /

# Build the package from this folder's source and pack it, the way npm would ship it.
FROM node:22-slim AS package
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
WORKDIR /ws
COPY --from=workspace tsconfig.base.json ./
COPY --from=workspace html-core/package.json html-core/tsconfig.json html-core/
COPY --from=workspace html-core/src/ html-core/src/
COPY package.json tsconfig.json tsup.config.ts README.md LICENSE hono/
COPY src/ hono/src/
# The package's own dev dependencies, without the test tools, and html-core linked in.
RUN node -e 'const p = require("./hono/package.json"); const d = { ...p.devDependencies }; \
      for (const k of Object.keys(d)) if (k.startsWith("@privatus-analytics/") || k === "vitest" || k === "jsdom") delete d[k]; \
      require("fs").writeFileSync("package.json", JSON.stringify({ private: true, devDependencies: d }))' \
 && npm install \
 && mkdir -p node_modules/@privatus-analytics && ln -s ../../html-core node_modules/@privatus-analytics/html-core \
 && mkdir /out && cd hono && npx tsup && npm pack --pack-destination /out

FROM node:22-slim
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
WORKDIR /app
COPY --from=package /out/ /pkg/
COPY example/package.json ./
RUN npm install --no-package-lock --omit=dev /pkg/*.tgz && npm install --no-package-lock --omit=dev
COPY example/ .
EXPOSE 8080
CMD ["node", "app.js"]
