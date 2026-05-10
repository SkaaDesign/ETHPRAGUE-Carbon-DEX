// EU ETS spot-price scraper.
//
// Single-shot actor: hits Trading Economics' free guest commodities feed,
// finds the EUA row, normalises it, and pushes one record to the default
// dataset. Designed to run on a schedule (hourly is plenty for a hackathon
// demo); each run produces one new dataset item, and Carbon DEX's frontend
// reads the latest one via the Apify REST API.
//
// No browser launch, no anti-bot evasion — Trading Economics' guest endpoint
// returns JSON directly. This keeps the actor dependency-light and predictable
// at demo-time, which matters more than maximum data fidelity.

import { Actor, log } from "apify";
import { gotScraping } from "got-scraping";

interface FeedRow {
  Symbol?: string;
  Name?: string;
  Last?: number | string;
  Unit?: string;
  Date?: string;
}

interface SpotRecord {
  price: number;
  currency: string;
  source: string;
  url: string;
  fetchedAt: string;
}

interface ActorInput {
  feedUrl?: string;
  symbolPattern?: string;
}

await Actor.init();

const input = (await Actor.getInput<ActorInput>()) ?? {};
const feedUrl =
  input.feedUrl ??
  "https://api.tradingeconomics.com/markets/commodity?c=guest:guest&f=json";
const symbolPattern = new RegExp(input.symbolPattern ?? "carbon|eua", "i");

log.info(`Fetching commodity feed`, { feedUrl });

const response = await gotScraping(feedUrl, {
  responseType: "text",
  retry: { limit: 3 },
  timeout: { request: 15_000 },
});

if (response.statusCode !== 200) {
  await Actor.fail(
    `Feed responded with HTTP ${response.statusCode}. Body: ${response.body.slice(0, 200)}`,
  );
}

let rows: FeedRow[];
try {
  rows = JSON.parse(response.body) as FeedRow[];
} catch (err) {
  await Actor.fail(
    `Could not JSON-parse feed body: ${(err as Error).message}. Body: ${response.body.slice(0, 200)}`,
  );
  throw err; // unreachable, but TS doesn't know Actor.fail exits
}

const eua = rows.find((row) => {
  const tag = `${row.Symbol ?? ""} ${row.Name ?? ""}`;
  return symbolPattern.test(tag);
});

if (!eua) {
  log.warning(`No EUA row found in feed (${rows.length} rows). Sample symbols:`, {
    samples: rows.slice(0, 6).map((r) => `${r.Symbol} · ${r.Name}`),
  });
  await Actor.fail("EUA row not present in commodity feed; tighten symbolPattern or pick a different feed.");
}

const priceNumber =
  typeof eua!.Last === "number" ? eua!.Last : Number(eua!.Last);

if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
  await Actor.fail(`Parsed Last value is not a positive number: ${eua!.Last}`);
}

const record: SpotRecord = {
  price: priceNumber,
  currency: "EUR",
  source: "Trading Economics",
  url: "https://tradingeconomics.com/commodity/carbon",
  fetchedAt: new Date().toISOString(),
};

log.info(`Pushing record`, record);
await Actor.pushData(record);

await Actor.exit();
