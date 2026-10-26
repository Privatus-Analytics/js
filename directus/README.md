# directus-extension-privatus-analytics

Your team writes and publishes content in Directus. But to see if anyone reads
it, they have to leave Directus and log into another dashboard. This extension
puts your [Privatus Analytics](https://privatusanalytics.com) numbers right on a
Directus dashboard. Everyone sees today's visitors, pageviews and top pages
next to the content they manage, without one more login.

## What you get

A **Privatus Analytics** panel for Directus Insights dashboards. It shows:

* **Visitors** and **pageviews** for the period you pick, with the change in
  percent from the period before.
* Your **top pages**, with their pageviews.

You pick the site and the period (today, yesterday, the last 7, 30 or 90 days,
this month, last month, this year or the last 12 months). Add several panels
to compare sites or periods side by side.

Privatus Analytics counts visits to your website without cookies. This panel
only reads your reports. It does not track anyone in Directus.

## Requirements

* Directus 10.10 or later. Tested on Directus 11 and 12.
* A Privatus Analytics account with your website added as a site. There is a
  free plan. Sign up at https://privatusanalytics.com. Your website needs the
  Privatus Analytics script to count visits:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_XXXXXXXXXX"></script>
```

## Install

**From the Directus Marketplace:** open **Settings**, **Marketplace**, search
for `privatus` and click **Install**.

**With npm:** in your Directus project folder run

```sh
npm install directus-extension-privatus-analytics
```

and restart Directus. With Docker, add the package to your image, or copy the
package folder into `extensions/` in your Directus project.

## Set up

1. In Privatus Analytics, open **Workspace settings**, **API tokens** and create
   a token. Give it only the `analytics.read` permission and limit it to the
   site you want to show.
2. In Directus, open **Insights**, open a dashboard (or create one) and click
   the pencil to edit it.
3. Add a panel and choose **Privatus Analytics**.
4. Paste the token, fill in the site id (it starts with `pa_`, you find it in
   Privatus Analytics under **Site settings**, **Tracking**), pick a period
   and how many top pages to show.
5. Save the dashboard.

### About the token

Directus saves panel settings with the dashboard. So anyone who can edit the
dashboard can see the token. That is why the token should only have the
`analytics.read` permission and only the sites you want to show. Then the most
it can do is read those reports. You can revoke it in Privatus Analytics at any
time.

The panel calls `https://privatusanalytics.com` from the browser of the person
looking at the dashboard. Directus allows this out of the box. If you made your
own `CONTENT_SECURITY_POLICY_DIRECTIVES__CONNECT_SRC` setting, add
`https://privatusanalytics.com` to it.

## Development

From the root of the [monorepo](https://github.com/Privatus-Analytics/js):

```sh
npm install
npm run build -w directus
npm test -w directus      # tests the built dist/index.js
npm run validate -w directus
```

## License

MIT
