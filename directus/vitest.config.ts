import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // The Directus app gives extensions its own copy of the SDK, where
    // definePanel returns the config as it is. The test does the same.
    alias: { '@directus/extensions-sdk': fileURLToPath(new URL('./test/sdk-shim.js', import.meta.url)) },
  },
  test: { environment: 'happy-dom', include: ['test/**/*.test.ts'] },
})
