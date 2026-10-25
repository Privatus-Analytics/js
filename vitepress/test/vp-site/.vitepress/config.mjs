// The test puts the real helpers' output on globalThis before it calls build(),
// so this config needs no imports.
const given = globalThis.__privatusVitePress || {}

export default {
  title: 'Test docs',
  outDir: given.outDir,
  head: given.head || [],
  transformHead: given.transformHead,
  vite: { plugins: given.vitePlugins || [], logLevel: 'silent' },
}
