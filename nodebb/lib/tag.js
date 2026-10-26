'use strict'

// Builds the Privatus Analytics script tag. Kept apart from NodeBB so it can be tested alone.

const SCRIPT_SRC = 'https://privatusstats.com/js/pa.js'
const SITE_ID = /^pa_[A-Za-z0-9]+$/

function isSiteId(value) {
  return SITE_ID.test(String(value || '').trim())
}

function buildTag(siteId) {
  const id = String(siteId || '').trim()
  if (!isSiteId(id)) return ''
  return `<script defer src="${SCRIPT_SRC}" data-site="${id}"></script>`
}

// NodeBB saves a checkbox as "on" or "off".
function isOn(value) {
  return value === true || value === 'on' || value === 'true' || value === '1' || value === 1
}

module.exports = { SCRIPT_SRC, isSiteId, buildTag, isOn }
