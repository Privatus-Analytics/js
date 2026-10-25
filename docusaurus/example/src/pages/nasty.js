import React from 'react'
import { NASTY } from '../nasty'

// The page props come from the plugin (see docusaurus.config.js). The button's
// attribute is set in JSX, and React escapes it.
export default function Nasty() {
  return (
    <main>
      <h1>Nasty</h1>
      <button type="button" data-privatus-event="Nasty value" data-privatus-prop-nasty={NASTY}>
        Nasty
      </button>
    </main>
  )
}
