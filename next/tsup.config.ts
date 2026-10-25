import { defineConfig } from 'tsup'

export default defineConfig({
  // Client entry: marked "use client" for the App Router.
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  external: ['react', 'next', '@privatus-analytics/tracker'],
  banner: { js: '"use client";' },
})
