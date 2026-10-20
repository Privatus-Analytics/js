import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/runtime.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2018',
  external: ['@nuxt/kit', '#imports', '@privatus/tracker'],
})
