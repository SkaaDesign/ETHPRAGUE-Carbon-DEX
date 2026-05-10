// Apify-sourced EU ETS spot price.
//
// Reads the latest record from the carbon-dex-spot-scraper actor's default
// dataset (apify/spot-scraper/, scrapes Trading Economics' free guest feed
// and pushes one record per run). Server-side only; never exposed to the
// client bundle. Cached for one hour via Next's `fetch` revalidation so the
// public observer never blocks on Apify and never trips rate limits during
// the demo.
//
// Returns null when:
//   - APIFY_TOKEN or APIFY_SPOT_ACTOR_ID env vars are missing
//   - the actor has never run (no dataset items yet)
//   - the API call fails or times out
//   - the response shape doesn't match what the actor pushes
//
// Callers MUST treat null as "hide the surface entirely" — never crash the
// page over a missing scrape.
//
// To wire it up:
//   1. Deploy the actor (see apify/spot-scraper/README.md)
//   2. Add to web/.env.local:
//        APIFY_TOKEN=apify_api_…
//        APIFY_SPOT_ACTOR_ID=username~carbon-dex-spot-scraper

export interface SpotPrice {
  price: number;
  currency: string;
  source: string;
  /** ISO-8601 timestamp of when the actor recorded this value. */
  fetchedAt: string;
  /** Public source URL — link out to it for transparency. */
  sourceUrl?: string;
}

const REVALIDATE_SECONDS = 60 * 60; // 1 hour
const FETCH_TIMEOUT_MS = 4_000; // never block server render past this

export async function fetchApifySpot(): Promise<SpotPrice | null> {
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_SPOT_ACTOR_ID;
  if (!token || !actorId) return null;

  // Apify expects the technical actor id with `~` between username + name.
  // Allow callers to set either `username/name` or `username~name`; normalise.
  const safeActorId = actorId.replace(/\//g, "~");
  const url = `https://api.apify.com/v2/acts/${safeActorId}/runs/last/dataset/items?clean=true&limit=1&desc=true&token=${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const items: unknown = await res.json();
    if (!Array.isArray(items) || items.length === 0) return null;
    const item = items[0] as Record<string, unknown>;
    const price = typeof item.price === "number" ? item.price : Number(item.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      price,
      currency: typeof item.currency === "string" ? item.currency : "EUR",
      source: typeof item.source === "string" ? item.source : "Apify",
      fetchedAt:
        typeof item.fetchedAt === "string"
          ? item.fetchedAt
          : new Date().toISOString(),
      sourceUrl: typeof item.url === "string" ? item.url : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Spread between an on-chain pool spot and the off-chain reference price.
 *  Positive = pool is *above* market; negative = pool is *below* market. */
export function spreadPct(poolSpot: number, refSpot: number): number {
  if (refSpot <= 0) return 0;
  return ((poolSpot - refSpot) / refSpot) * 100;
}

/** Human-readable "1h ago", "12m ago" — keeps the comparison line honest about
 *  freshness without dragging in dayjs/date-fns for one helper. */
export function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
