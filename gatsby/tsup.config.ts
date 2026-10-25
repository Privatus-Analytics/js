import { defineConfig } from 'tsup'

export default defineConfig({
  // Gatsby requires gatsby-ssr.js and gatsby-node.js from the package root.
  // Those files load these CommonJS builds.
  entry: ['src/gatsby-ssr.ts', 'src/gatsby-node.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  target: 'es2018',
  // The shared HTML rules (../html-core, private) are bundled in, so the package has no
  // Privatus dependency. tsconfig paths point the type bundler at the same source.
  noExternal: ['@privatus/html-core'],
})
