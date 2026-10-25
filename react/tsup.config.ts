import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2018',
  external: ['react', '@privatus-analytics/tracker'],
  banner: { js: '"use client";' },
})
