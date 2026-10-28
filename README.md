# Privatus Analytics for JavaScript

**Real visitor numbers for your JavaScript site or app. No cookies, no cookie pop-up, no bots.**

You want to know if people use your JavaScript site or app. But Google Analytics
uses cookies, so in many countries you must show a cookie pop-up first (the box
that asks visitors to say yes to cookies). Many people click no, so they never
show up in your numbers. Bots add fake visits on top.

These packages add the Privatus Analytics script to your site or app. There is
one for each popular framework, from React and Next.js to Express and Astro. The
script sets no cookies and keeps no IP addresses. Bots are filtered out before
they are counted.

So you see how many real people came, which pages they looked at and where they
came from, on one simple dashboard. A report comes to your inbox each week, and
you can set alerts for when traffic jumps or drops. And you don't need a cookie
pop-up for your analytics.

**Free plan, no card:** 10,000 events a month (an event is a page view or an action you track) on up to 3 sites. [Start free at privatusanalytics.com](https://privatusanalytics.com).

- **No cookies.** No cookies and no hidden IDs on your visitors' devices, and no IP
  addresses are kept. Laws differ by country, so check your own legal advice.
- **Real people, not bots.** Known bots, data centers and spam visits are left
  out on every plan.
- **Small and fast.** The script is about 3 KB when compressed.

## The packages

Each folder is its own npm package. Pick the one for your framework.

| Framework | Package |
|---|---|
| React | [`@privatus-analytics/react`](react) |
| Next.js | [`@privatus-analytics/next`](next) |
| Vue | [`@privatus-analytics/vue`](vue) |
| Nuxt | [`@privatus-analytics/nuxt`](nuxt) |
| Svelte and SvelteKit | [`@privatus-analytics/svelte`](svelte) |
| Astro | [`@privatus-analytics/astro`](astro) |
| Express | [`@privatus-analytics/express`](express) |
| Fastify | [`@privatus-analytics/fastify`](fastify) |
| Hono | [`@privatus-analytics/hono`](hono) |
| NestJS | [`@privatus-analytics/nestjs`](nestjs) |
| Eleventy | [`eleventy-plugin-privatus`](eleventy) |
| Docusaurus | [`docusaurus-plugin-privatus`](docusaurus) |
| VitePress and Vite | [`vitepress-plugin-privatus`](vitepress) |
| Rspress | [`rspress-plugin-privatus`](rspress) |
| Gatsby | [`gatsby-plugin-privatus`](gatsby) |
| Any other site or app | [`@privatus-analytics/tracker`](tracker) |
| NodeBB forums | [`nodebb-plugin-privatus-analytics`](nodebb) |
| Directus dashboards (reads your stats) | [`directus-extension-privatus-analytics`](directus) |
| Node-RED flows (reads your stats) | [`node-red-contrib-privatus-analytics`](node-red) |

Every package that adds the browser script only adds that script. None of them
sends events from your server or sets cookies. The Directus and Node-RED
packages only read your reports. `html-core` is shared code that is bundled into the
server and site packages, and is never published on its own.

## Development

```sh
npm install
npm run build
npm test
```

## License

MIT. See [LICENSE](LICENSE).
