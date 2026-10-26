# Changelog

## 1.0.1 - 2026-10-26

- README: a new intro that starts with the problem Privatus Analytics solves.

## 1.0.0 - 2026-10-26

- Initial release of `node-red-contrib-privatus-analytics`.
- `privatus stats`, `privatus breakdown` and `privatus realtime` nodes that read the Privatus Analytics REST API with an API token kept in a config node.
- `privatus webhook` node that receives Privatus Analytics webhooks and checks the `Privatus-Signature` header (HMAC-SHA256, 5 minute window).
- An example flow in `examples/`.
