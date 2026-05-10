// Live-chain state reader.
//
// Two modes:
//   - LIVE     → reads current state from the deployed Sepolia contracts;
//               beat is derived from how many events have fired.
//   - SIM      → uses stateAt(beat) from demo-state.ts for explorability.
//
// `getStateForRoute(searchParams)` is the single entry point each route
// calls. If `?beat=N` is present in the URL, it returns simulation state
// at that beat. If absent, it reads live chain state. If chain reads
// fail (RPC down, missing env, etc.), it falls back to Beat 3 simulation
// so the route still renders something sensible.

import {
  createPublicClient,
  http,
  hexToString,
  type Address,
  type PublicClient,
} from "viem";
import { sepolia } from "viem/chains";

import {
  SEPOLIA,
  CARBON_CREDIT_ABI,
  CARBON_DEX_ABI,
  RETIREMENT_ABI,
  EURS_ABI,
  ensFor,
} from "./contracts";

import {
  stateAt,
  beatFromSearchParams,
  fmt,
  TRADE_PROCEEDS_EURS,
  BUYER_COST_EURS,
  LP_FEE_EURS,
  QTY_TRADE,
  type Beat,
  type DemoState,
  type AuditEntry,
} from "./demo-state";

// ─────────────────────────────────────────────────────────────────────────
// Public client (server-side only — Next.js server components run here)
// ─────────────────────────────────────────────────────────────────────────

let _client: PublicClient | undefined;
function getClient(): PublicClient {
  if (_client) return _client;
  _client = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  });
  return _client;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const CLOCKS: Record<Beat, string> = {
  0: "14:30",
  1: "14:32",
  2: "14:38",
  3: "15:04",
};

const SPOT_PRICE_INITIAL = 70;
const EFFECTIVE_PRICE = TRADE_PROCEEDS_EURS / QTY_TRADE;
const SLIPPAGE_PCT =
  ((SPOT_PRICE_INITIAL - EFFECTIVE_PRICE) / SPOT_PRICE_INITIAL) * 100;

// Mints to these addresses are deploy-time plumbing (LP seed to deployer,
// B's pre-loaded inventory for the bidirectional bot) and are excluded
// from the audit log + supply counter so the demo narrative stays clean.
const ADMIN_MINT_RECIPIENTS = new Set<string>([
  SEPOLIA.wallets.regulator.toLowerCase(),
  SEPOLIA.wallets.companyB.toLowerCase(),
]);

// ERC-20 18-decimal → display number (truncates fractional)
function toUnits(wei: bigint): number {
  return Number(wei / 10n ** 18n);
}

// bytes2 → 2-char ASCII (e.g. 0x4445 → "DE")
function bytes2ToString(b: `0x${string}`): string {
  try {
    const decoded = hexToString(b).replace(/\0+$/, "");
    if (!/^[\x20-\x7e]*$/.test(decoded)) return b;
    return decoded;
  } catch {
    return b;
  }
}

// bytes32 → null-terminated ASCII when printable, otherwise short hex.
// Defensive: deploy-time refs are sometimes random bytes, not text — those
// must not render as garbled UTF-8 mojibake.
function bytes32ToString(b: `0x${string}`): string {
  try {
    const decoded = hexToString(b).replace(/\0+$/, "");
    if (decoded && /^[\x20-\x7e]+$/.test(decoded)) return decoded;
    return `${b.slice(0, 10)}…${b.slice(-4)}`;
  } catch {
    return `${b.slice(0, 10)}…${b.slice(-4)}`;
  }
}

function shortHash(h: `0x${string}` | string): string {
  return `${h.slice(0, 6)}…${h.slice(-3)}`;
}

// Back-compute event time from latest block + 12s/block Sepolia cadence.
// Avoids per-block getBlock RPC calls; accurate within a few seconds even
// for older events, plenty for an audit-log timestamp.
function tsFromBlock(
  blockNumber: bigint,
  latestNumber: bigint,
  latestTs: number,
): string {
  const ago = Number(latestNumber - blockNumber) * 12;
  const eventSec = latestTs - ago;
  const d = new Date(eventSec * 1000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Event fetch (last ~7 days on Sepolia ≈ 50,000 blocks at 12s)
// ─────────────────────────────────────────────────────────────────────────

async function fetchAllEvents() {
  const client = getClient();
  // getBlock() returns full block (with timestamp) — same RPC cost as
  // getBlockNumber(), but unlocks per-event clock display via back-compute.
  const latestBlock = await client.getBlock();
  const latest = latestBlock.number;
  const latestTs = Number(latestBlock.timestamp);
  const fromBlock = latest > 50_000n ? latest - 50_000n : 0n;

  const [mintLogs, swapLogs, retireLogs] = await Promise.all([
    client.getContractEvents({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      eventName: "CreditMinted",
      fromBlock,
      toBlock: latest,
    }),
    client.getContractEvents({
      address: SEPOLIA.contracts.CarbonDEX,
      abi: CARBON_DEX_ABI,
      eventName: "Swap",
      fromBlock,
      toBlock: latest,
    }),
    client.getContractEvents({
      address: SEPOLIA.contracts.Retirement,
      abi: RETIREMENT_ABI,
      eventName: "Retired",
      fromBlock,
      toBlock: latest,
    }),
  ]);

  return { mintLogs, swapLogs, retireLogs, latest, latestTs };
}

type FetchedEvents = Awaited<ReturnType<typeof fetchAllEvents>>;

// Real allocations (filters out LP-seed mints to deployer + B's pre-loaded
// inventory). The audit log + supply counter both consume this set.
function realMints(events: FetchedEvents) {
  return events.mintLogs.filter(
    (l) =>
      !ADMIN_MINT_RECIPIENTS.has(
        (l.args.to as Address).toLowerCase(),
      ),
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log construction
// ─────────────────────────────────────────────────────────────────────────

// Build the audit log from ALL events on chain (not just one of each kind),
// sorted newest-first with real per-block timestamps. Filters out admin
// plumbing mints (LP seed, B inventory) so the demo narrative stays clean.
function buildAuditFromEvents(events: FetchedEvents): AuditEntry[] {
  type Sortable = { blockNumber: bigint; logIndex: number; entry: AuditEntry };
  const items: Sortable[] = [];
  const ts = (b: bigint) => tsFromBlock(b, events.latest, events.latestTs);

  for (const l of realMints(events)) {
    items.push({
      blockNumber: l.blockNumber,
      logIndex: l.logIndex,
      entry: {
        id: `m-${l.blockNumber}-${l.logIndex}`,
        ts: ts(l.blockNumber),
        hash: shortHash(l.transactionHash),
        txHash: l.transactionHash,
        kind: "ISSUE",
        amount: `${fmt(toUnits(l.args.amount as bigint))} EUA`,
        to: ensFor(l.args.to as Address),
        meta: `vintage ${l.args.vintage} · sector ${bytes2ToString(l.args.sector as `0x${string}`)} · origin ${bytes2ToString(l.args.originCountry as `0x${string}`)} · ref ${bytes32ToString(l.args.issuanceRef as `0x${string}`)}`,
      },
    });
  }

  for (const l of events.swapLogs) {
    const sender = l.args.sender as Address;
    const amountIn = toUnits(l.args.amountIn as bigint);
    const amountOut = toUnits(l.args.amountOut as bigint);
    const isEURSIn = l.args.isEURSIn as boolean;
    // Sender perspective: outAmount = what they gave up, inAmount = received.
    const outAmount = isEURSIn
      ? `${fmt(amountIn)} EURS`
      : `${fmt(amountIn)} EUA`;
    const inAmount = isEURSIn
      ? `${fmt(amountOut)} EUA`
      : `${fmt(amountOut)} EURS`;
    // Effective price is always EURS-per-EUA regardless of swap direction.
    const eff = isEURSIn
      ? amountOut > 0
        ? amountIn / amountOut
        : 0
      : amountIn > 0
        ? amountOut / amountIn
        : 0;
    items.push({
      blockNumber: l.blockNumber,
      logIndex: l.logIndex,
      entry: {
        id: `s-${l.blockNumber}-${l.logIndex}`,
        ts: ts(l.blockNumber),
        hash: shortHash(l.transactionHash),
        txHash: l.transactionHash,
        kind: "SWAP",
        from: ensFor(sender),
        to: ensFor(SEPOLIA.contracts.CarbonDEX),
        outAmount,
        inAmount,
        meta: `effective ${eff.toFixed(2)} EURS/EUA · counterparty verified`,
      },
    });
  }

  for (const l of events.retireLogs) {
    items.push({
      blockNumber: l.blockNumber,
      logIndex: l.logIndex,
      entry: {
        id: `r-${l.blockNumber}-${l.logIndex}`,
        ts: ts(l.blockNumber),
        hash: shortHash(l.transactionHash),
        txHash: l.transactionHash,
        kind: "RETIRE",
        amount: `${fmt(toUnits(l.args.amount as bigint))} EUA`,
        from: ensFor(l.args.from as Address),
        meta: `beneficiary: ${ensFor(l.args.beneficiary as Address)} · reasonURI: ${l.args.reasonURI || "—"}`,
      },
    });
  }

  // Newest first — block desc, then logIndex desc as tie-breaker.
  items.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber)
      return Number(b.blockNumber - a.blockNumber);
    return b.logIndex - a.logIndex;
  });

  return items.map((s) => s.entry);
}

// ─────────────────────────────────────────────────────────────────────────
// Aggregate counters from event sums
// ─────────────────────────────────────────────────────────────────────────

function cumulativeIssued(events: FetchedEvents): number {
  return realMints(events).reduce(
    (sum, l) => sum + toUnits(l.args.amount as bigint),
    0,
  );
}

function cumulativeRetired(events: FetchedEvents): number {
  return events.retireLogs.reduce(
    (sum, l) => sum + toUnits(l.args.amount as bigint),
    0,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Current chain reads (balances, reserves)
// ─────────────────────────────────────────────────────────────────────────

async function readCurrentSnapshot() {
  const client = getClient();
  const [coBalEUA, coBalEURS, coBalEUA_B, reserves] = await Promise.all([
    client.readContract({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "balanceOf",
      args: [SEPOLIA.wallets.companyA],
    }),
    client.readContract({
      address: SEPOLIA.contracts.EURS,
      abi: EURS_ABI,
      functionName: "balanceOf",
      args: [SEPOLIA.wallets.companyA],
    }),
    client.readContract({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "balanceOf",
      args: [SEPOLIA.wallets.companyB],
    }),
    client.readContract({
      address: SEPOLIA.contracts.CarbonDEX,
      abi: CARBON_DEX_ABI,
      functionName: "getReserves",
    }),
  ]);

  return {
    coBal: toUnits(coBalEUA),
    coEurs: toUnits(coBalEURS),
    coBalB: toUnits(coBalEUA_B),
    poolEurs: toUnits(reserves[0]),
    poolEua: toUnits(reserves[1]),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE state assembly
// ─────────────────────────────────────────────────────────────────────────

async function fetchLiveState(): Promise<DemoState> {
  const events = await fetchAllEvents();

  // Beat derived from real (non-admin) events. LP-seed mint to deployer
  // exists from deploy time; without filtering, beat would jump to 1
  // before the user clicks Issue, which would be a lie.
  const realMintCount = realMints(events).length;
  const beat: Beat =
    events.retireLogs.length > 0
      ? 3
      : events.swapLogs.length > 0
        ? 2
        : realMintCount > 0
          ? 1
          : 0;

  const reads = await readCurrentSnapshot();
  const supply = cumulativeIssued(events);
  const retired = cumulativeRetired(events);

  return {
    beat,
    clock: CLOCKS[beat],
    supply,
    retired,
    inCirculation: supply - retired,
    coBal: reads.coBal,
    coEurs: reads.coEurs,
    coBalB: reads.coBalB,
    poolEua: reads.poolEua,
    poolEurs: reads.poolEurs,
    spotPriceInitial: SPOT_PRICE_INITIAL,
    spotPrice: reads.poolEua > 0 ? reads.poolEurs / reads.poolEua : 0,
    effectivePrice: EFFECTIVE_PRICE,
    slippagePct: SLIPPAGE_PCT,
    tradeProceedsEurs: TRADE_PROCEEDS_EURS,
    buyerCostEurs: BUYER_COST_EURS,
    lpFeeEurs: LP_FEE_EURS,
    audit: buildAuditFromEvents(events),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────

export type RouteState = {
  state: DemoState;
  /** True when state was read from the live Sepolia chain.
   *  False when sim'd via stateAt(beat) (URL has ?beat=N or chain read failed). */
  isLive: boolean;
  /** Error message when chain read failed and sim was used as fallback. */
  error?: string;
};

export async function getStateForRoute(
  searchParams: URLSearchParams,
): Promise<RouteState> {
  // Explicit ?beat=N forces simulation mode (lets reviewers walk all 4 states
  // even when the chain only sits at Beat 3).
  if (searchParams.has("beat")) {
    const beat = beatFromSearchParams(searchParams);
    return { state: stateAt(beat), isLive: false };
  }

  // Otherwise, read live from Sepolia. On failure, return the empty pre-demo
  // state (zeros + empty audit) and let ChainErrorBanner surface the error
  // verbatim. We deliberately do NOT fall back to populated sim numbers
  // (stateAt(3)) — those would look like real demo data and mask the failure.
  // Stage backup is `?beat=N` only — explicit opt-in, never auto.
  try {
    const state = await fetchLiveState();
    return { state, isLive: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chain-state] live fetch failed:", msg);
    return { state: stateAt(0), isLive: false, error: msg };
  }
}
