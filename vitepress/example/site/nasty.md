<script setup>
import { NASTY } from './nasty.js'
</script>

# Nasty

The page props go through the plugin (see `.vitepress/config.mjs`). VitePress
has no event helper, so the button's attribute is bound with Vue, which
escapes it.

<button type="button" data-privatus-event="Nasty value" :data-privatus-prop-nasty="NASTY">Nasty</button>
