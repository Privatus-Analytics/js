# nodebb-plugin-privatus-analytics

You want to know how many people read your forum and how they found it. But
most analytics tools follow your members around with cookies and need a
pop-up to ask for permission first. This plugin adds
[Privatus Analytics](https://privatusanalytics.com) to your NodeBB forum
instead. It counts visits without cookies, so there is nothing stored on your
members' devices. You set it up in one minute from the admin panel, with no
code and no theme changes.

## What you get

* The Privatus Analytics script on every forum page, added for you.
* A settings page in the admin panel for your site id.
* An option to leave out visits from logged-in administrators, so your own
  clicks do not change the numbers.
* Page changes inside the forum are counted too. NodeBB loads new pages
  without a full reload, and the script notices each one.

Then you see your visitors, top topics, where people came from and which
countries they are in, in your Privatus Analytics dashboard.

The plugin only adds this one script tag to your pages:

```html
<script defer src="https://privatusstats.com/js/pa.js" data-site="pa_XXXXXXXXXX"></script>
```

It sets no cookies and sends nothing from your server.

## Requirements

* NodeBB 3 or 4.
* A Privatus Analytics account. There is a free plan. Sign up at
  https://privatusanalytics.com and add your forum as a site.

## Install

In the NodeBB admin panel, open **Extend**, **Plugins**, **Find Plugins**,
search for `privatus`, and click **Install**. Then turn the plugin on and
rebuild and restart NodeBB when it asks.

Or install it from the command line in your NodeBB folder:

```sh
npm install nodebb-plugin-privatus-analytics
./nodebb activate nodebb-plugin-privatus-analytics
./nodebb build
./nodebb restart
```

## Set up

1. In Privatus Analytics, open **Site settings**, **Tracking** and copy your
   site id. It starts with `pa_`.
2. In the NodeBB admin panel, open **Plugins**, **Privatus Analytics**.
3. Paste the site id.
4. Turn on **Do not count visits from logged-in administrators** if you want.
5. Click **Save**.

That is all. Open your forum in a private window and you will see yourself in
the Privatus Analytics realtime view.

To stop tracking, clear the site id and save, or turn the plugin off.

## How it works

NodeBB themes print a block of custom HTML in the `<head>` of every forum page
(the same block as **Appearance**, **Custom Content**, **Custom Header** in the
admin panel). The plugin uses the `filter:middleware.renderHeader` hook to put
the script tag at the start of that block. Your own custom header stays as it
is. The admin panel itself is never tracked.

The built-in themes (Harmony and Persona) print this block. A custom theme
that removed it from `header.tpl` will not show the tag.

If you also pasted the Privatus Analytics script into the custom header
yourself, remove it there, or visits are counted twice.

## Privacy

The script sets no cookies and stores nothing in the browser. See the
[privacy documentation](https://privatusanalytics.com/docs/privacy) for what
is collected. Check with your own lawyer for the rules in your country.

If your forum has a privacy policy, it should say which tools handle your
visitors' data. You can paste this:

> This forum uses [Privatus Analytics](https://privatusanalytics.com/privacy-analytics)
> to count visits. It does not use cookies and does not follow you from one
> website to another. Your IP address is used for a moment to count visits and
> is never stored.

## Development

From the root of the [monorepo](https://github.com/Privatus-Analytics/js):

```sh
npm install
npm test -w nodebb
```

## License

MIT
