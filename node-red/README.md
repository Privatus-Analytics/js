# node-red-contrib-privatus-analytics

**Put your website stats to work in your Node-RED flows.**

Checking your stats means leaving Node-RED and logging into another dashboard.
And nobody wants to copy numbers by hand each morning.

These nodes get your visitors, top pages and live visitors from Privatus
Analytics, right inside your flows. A webhook node starts a flow when Privatus
Analytics tells you something happened, like an alert or a site going down. It
checks that the call really came from Privatus Analytics first.

So you can post a daily report to your team chat, show numbers on a wall screen
or send an alert when something changes. The numbers are honest too. Privatus
Analytics counts visits without cookies, so there is no cookie pop-up for your
analytics, and it leaves bots out.

**Free plan, no card:** 10,000 events a month (an event is a page view or an action you track) on up to 3 sites. [Start free at privatusanalytics.com](https://privatusanalytics.com).

## What you get

| Node | What it does |
| --- | --- |
| **privatus stats** | Visitors, visits, pageviews, bounce rate, visit time and revenue for a site and a period. It can also compare with the period before. |
| **privatus breakdown** | The top pages, sources, countries, devices, campaigns or events for a period. |
| **privatus realtime** | How many people are on the site right now, and the top pages, sources and countries of the last 30 minutes. |
| **privatus webhook** | Starts a flow when Privatus Analytics sends a webhook. It checks the signature and refuses fake or old calls. |

Privatus Analytics counts visits without cookies. These nodes only read your
reports through the Privatus Analytics API. They never send visits or events.
Visits are counted by the tracking script on your website:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_XXXXXXXXXX"></script>
```

## Install

In Node-RED, open the menu, then **Manage palette**, **Install**, and search for
`node-red-contrib-privatus-analytics`.

Or run this in your Node-RED folder (usually `~/.node-red`) and restart Node-RED:

```sh
npm install node-red-contrib-privatus-analytics
```

You need Node-RED 3.0 or later and Node.js 18 or later.

## Set up

1. In Privatus Analytics, open **Workspace settings**, **API tokens** and create a token.
   A token with only the `analytics.read` permission is enough. You can also
   limit the token to some sites.
2. Drop a **privatus stats** node into a flow and open it.
3. Next to **Account**, click the pencil and paste your token. Node-RED keeps it
   in its credentials file, not in the flow itself, so it is not in exports.
4. Fill in your **Site id**. It starts with `pa_`. You find it in Privatus
   Analytics under **Site settings**, **Tracking**.

## Example: post yesterday's numbers every morning

The palette has a ready flow. Open the menu, **Import**, **Examples**,
**node-red-contrib-privatus-analytics**, **daily-stats-and-alerts**.

It does this:

```
[inject every day at 08:00] -> [privatus stats: yesterday] -> [privatus breakdown: top 5 pages] -> [function] -> [debug]
```

and the function writes a message like this:

```
Yesterday: 1204 visitors (+12.1%), 3310 pageviews.
Top pages:
1. / (980 views)
2. /pricing (402 views)
```

Swap the debug node for a Slack, email, Telegram or Discord node to send it.

## Using the nodes

All three API nodes start when a message comes in. The settings in the node are
the default, and the message can change them:

| Message property | Meaning |
| --- | --- |
| `msg.site` | A site id, such as `pa_7Q2K9XH3AB`. One node can serve many sites. |
| `msg.period` | `today`, `yesterday`, `24h`, `7d`, `14d`, `28d`, `30d`, `90d`, `mtd`, `last_month`, `qtd`, `last_quarter`, `ytd`, `12mo`, `last_year`, `all` or `custom` |
| `msg.from`, `msg.to` | Dates like `2026-10-01` for the `custom` period. |
| `msg.compare` | `previous_period` or `previous_year` adds the earlier numbers and the change in percent. |
| `msg.filters` | Only count some visits, for example `[["country","is","US"],["page","starts_with","/blog"]]`. |
| `msg.dimension` | Breakdown only: `page`, `referrer`, `channel`, `country`, `device`, `utm_campaign`, `event` and more. |
| `msg.limit` | Breakdown only: how many rows, 1 to 1000. The default is 10. |

The result is in `msg.payload`:

**privatus stats**

```json
{
  "period": { "from": "2026-10-25", "to": "2026-10-25" },
  "metrics": {
    "visitors": 1204, "visits": 1390, "pageviews": 3310, "views_per_visit": 2.38,
    "bounce_rate": 41.2, "visit_duration": 52000, "revenue": 0
  },
  "change": { "visitors": 12.1, "pageviews": 8.4 }
}
```

`bounce_rate` is a percent. `visit_duration` is in milliseconds. `revenue` is
in cents. `change` is only there when you ask for a comparison.

**privatus breakdown** gives `msg.payload.rows`, a list with the top values
first. Each row has `value` (the page, source or country) and `share` (its
percent of the total). Page rows have `pageviews` and `visits`. Source and
country rows have `visitors`, `visits`, `pageviews` and more.

**privatus realtime** gives `msg.payload.live_visitors` (visitors in the last
5 minutes) and `top_pages`, `top_referrers` and `top_countries` for the last
30 minutes.

If a call fails, the node raises an error you can catch with a **catch** node.
`msg.statusCode` has the HTTP status, for example 401 for a wrong token.

Full details of every number are in the
[Privatus Analytics API docs](https://privatusanalytics.com/docs/api).

## Webhooks

1. Drop a **privatus webhook** node into a flow. Pick a URL path, for example
   `/privatus/webhook`. The node shows the full address under the path.
2. Your Node-RED must be reachable from the internet over HTTPS.
3. In Privatus Analytics, open **Workspace settings**, **Webhooks**, add an endpoint with
   that address and pick the events you want.
4. Copy the secret (it starts with `whsec_`) into the node and deploy.

Each webhook from Privatus Analytics has a `Privatus-Signature` header like
`t=1761436800,v1=5f2b...`. The node works out an HMAC-SHA256 code from the time,
a dot and the exact body, using your secret, and compares it with `v1`. It also
refuses a webhook whose time is more than 5 minutes away from now. That stops
someone from sending you an old webhook again. A refused webhook gets status 401
and your flow does not run.

A good webhook gets status 200 right away and sends a message with:

* `msg.payload`: the body, with `id`, `event`, `created_at`, `workspace_id` and `data`
* `msg.event` and `msg.topic`: the event name, such as `alert.triggered` or `uptime.down`
* `msg.delivery`: the delivery id. A retry of the same delivery has the same id.
* `msg.headers`: the request headers

## Privacy

These nodes send your API token and the site, period and filters you choose to
`https://privatusanalytics.com`, and nothing else. They do not track anyone.

## Development

From the root of the [monorepo](https://github.com/Privatus-Analytics/js):

```sh
npm install
npm test -w node-red
npm run validate -w node-red   # the Node-RED Flow Library checks
```

## License

MIT
