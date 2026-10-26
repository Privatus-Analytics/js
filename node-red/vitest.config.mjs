import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['test/**/*.test.mjs'], fileParallelism: false, testTimeout: 15000 },
})
