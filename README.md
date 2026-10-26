# Privatus Analytics for JavaScript

**Simple, private website analytics for your JavaScript site or app.** No
cookies, honest numbers, and a dashboard you understand in seconds.

## Why Privatus Analytics

**Google Analytics is slow, confusing and hungry for data.** It sends what your
visitors do to Google. In many countries it means showing a cookie pop-up (the
box that asks visitors to accept cookies), and many people click "reject", so
you never see them. Bots pad the numbers that are left.

**Privatus Analytics fixes that.** It counts visits to your site or app without
cookies and never stores IP addresses. Bots are filtered out before they are
counted. Your data is never sold or shared.

What you get:

- **A dashboard you understand in seconds.** Visitors, top pages and where
  people came from, all on one screen.
- **No cookie pop-up needed for our analytics.** We set no cookies and store no
  personal data. Laws differ by country, so check your own legal advice.
- **Honest numbers.** Known bots and fake traffic are left out on every plan.
- **A fast site.** The tracking script is about 3 KB, tiny next to most tracking
  tags.
- **Data you own.** We never sell it or show you ads, and you can pull it out
  any time through the API.

**Start free.** The Free plan has 10,000 events a month and 3 sites, with no
card. Every new account also gets 14 days of Pro free, with no card. [Create
your account](https://privatusanalytics.com).

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
| Gatsby | [`gatsby-plugin-privatus`](gatsby) |
| Any other site or app | [`@privatus-analytics/tracker`](tracker) |

Every package only adds the browser script. None of them sends events from your
server or sets cookies. `html-core` is shared code that is bundled into the
server and site packages, and is never published on its own.

## Development

```sh
npm install
npm run build
npm test
```

## License

MIT. See [LICENSE](LICENSE).
