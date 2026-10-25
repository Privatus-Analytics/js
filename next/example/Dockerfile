# syntax=docker/dockerfile:1
# Conformance example app (Next.js, App Router). Build with the package folder as the context:
#   docker build -f example/Dockerfile .
#
# The package bundles the shared HTML rules from the monorepo's html-core folder
# when it is built, and it depends on @privatus-analytics/tracker from the tracker
# folder. Both are outside this build context. A plain build takes them from the
# monorepo on GitHub (main). To test your local copies, pass the monorepo folder
# as the "workspace" context:
#   docker build --build-context workspace=.. -f example/Dockerfile .
FROM scratch AS workspace
ADD https://github.com/Privatus-Analytics/js.git#main /

# Build the tracker and this package from source and pack them, the way npm would ship them.
FROM node:22-slim AS package
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
WORKDIR /ws
COPY --from=workspace tsconfig.base.json ./
COPY --from=workspace html-core/package.json html-core/tsconfig.json html-core/
COPY --from=workspace html-core/src/ html-core/src/
COPY --from=workspace tracker/package.json tracker/tsconfig.json tracker/tsup.config.ts tracker/README.md tracker/LICENSE tracker/
COPY --from=workspace tracker/src/ tracker/src/
COPY package.json tsconfig.json tsup.config.ts README.md LICENSE next/
COPY src/ next/src/
# The packages' own dev dependencies, without the test tools, and the workspace packages linked in.
RUN node -e 'const d = {}; for (const f of ["./next/package.json", "./tracker/package.json"]) Object.assign(d, require(f).devDependencies); \
      for (const k of Object.keys(d)) if (k.startsWith("@privatus-analytics/") || k === "vitest" || k === "jsdom") delete d[k]; \
      require("fs").writeFileSync("package.json", JSON.stringify({ private: true, devDependencies: d }))' \
 && npm install \
 && mkdir -p node_modules/@privatus-analytics \
 && ln -s ../../html-core node_modules/@privatus-analytics/html-core \
 && ln -s ../../tracker node_modules/@privatus-analytics/tracker \
 && mkdir /out \
 && (cd tracker && npx tsup && npm pack --pack-destination /out) \
 && (cd next && npx tsup && npm pack --pack-destination /out)

FROM node:22-slim
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=package /out/ /pkg/
COPY example/package.json ./
RUN npm install --no-package-lock /pkg/*.tgz
COPY example/ .
RUN npx next build
EXPOSE 8080
CMD ["sh", "-c", "exec npx next start --hostname 0.0.0.0 --port ${PORT:-8080}"]
