import { defineConfig } from 'tsup'

export default defineConfig([
  {
    // Client entry: marked "use client" for the App Router.
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    external: ['react', 'next', '@privatus-analytics/tracker'],
    banner: { js: '"use client";' },
  },
  {
    // Server entry (@privatus-analytics/next/server): no "use client", so Server Components
    // can render the tag and call eventData and clickData. The shared HTML rules
    // (../html-core, private) are bundled in.
    entry: { server: 'src/server.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    target: 'es2018',
    external: ['react', 'next'],
    noExternal: ['@privatus-analytics/html-core'],
  },
])
