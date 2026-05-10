# carbon-dex-spot-scraper

Apify actor that scrapes the current EU Allowance (EUA) spot price from Trading Economics' free guest commodities feed and pushes one record to the default dataset.

The frontend (`web/lib/apify-spot.ts`) reads the latest dataset item over the Apify REST API and renders a comparison line on `/public` next to the on-chain pool spot price. Graceful no-op when the dataset is empty or the env vars are missing.

## What it produces

One record per run, shape:

```jsonc
{
  "price": 68.43,
  "currency": "EUR",
  "source": "Trading Economics",
  "url": "https://tradingeconomics.com/commodity/carbon",
  "fetchedAt": "2026-05-10T19:42:11.123Z"
}
```

## Local run

Use **bun** to install — one of the upstream Apify packages (`apify-client`)
ships a `npx only-allow pnpm` preinstall that breaks plain `npm install`. Bun
skips lifecycle scripts by default, so the install just works.

```bash
cd apify/spot-scraper
bun install
bunx apify run --purge
# → check storage/datasets/default/000000001.json
```

## Deploy to Apify

```bash
# 1. one-time login (opens browser → confirm Apify session)
bunx apify login

# 2. push the actor (uploads source, builds Docker image on Apify)
bunx apify push
```

> Prefer a global install? `npm install -g apify-cli` (bypasses the local
> install dance entirely), then use bare `apify login` / `apify push`.

After the build finishes, the actor appears in the Apify console. Note the actor ID (e.g. `your-username/carbon-dex-spot-scraper`).

## Run + schedule it

In the Apify console, open the actor → **Schedules** → New schedule → cron `0 * * * *` (hourly). That keeps the dataset fresh.

For the demo: a single manual run before stage is enough — the frontend reads `runs/last/dataset/items` so any successful run is sufficient.

## Wiring the frontend

Add to `web/.env.local`:

```bash
APIFY_TOKEN=apify_api_…           # personal token from https://console.apify.com/settings/integrations
APIFY_SPOT_ACTOR_ID=username~carbon-dex-spot-scraper
```

> Use the actor's *technical* ID with `~` separator (visible in the URL of the actor page), not the display name.

The frontend's server-side fetch caches the response for one hour via Next's `revalidate`, so the public observer never blocks on Apify and never hits rate limits during the demo.
