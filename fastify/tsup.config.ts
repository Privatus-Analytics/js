import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2018',
  // The shared HTML rules (../html-core, private) are bundled in, so the package has no
  // Privatus dependency. tsconfig paths point the type bundler at the same source.
  noExternal: ['@privatus/html-core'],
})
