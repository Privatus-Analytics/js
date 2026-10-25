import { eventData } from '@privatus-analytics/next/server'
import { NASTY } from '../../shared'

export default function Nasty() {
  return (
    <>
      <h1>Nasty values</h1>
      <button type="button" {...eventData('Nasty value', { nasty: NASTY })}>
        Nasty
      </button>
    </>
  )
}
