// The nasty value from the conformance contract. It lives in a JavaScript file because
// VitePress puts the frontmatter inside a <script> block of the page, where a
// "</script>" in it would end that block.
export const NASTY = '</script><script>window.__pwned=1</script>\u2028\u2029&<>"\''
