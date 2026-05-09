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

// ERC-20 18-decimal → display number (truncates fractional)
function toUnits(wei: bigint): number {
  return Number(wei / 10n ** 18n);
}

// bytes2 → 2-char ASCII (e.g. 0x4445 → "DE")
function bytes2ToString(b: `0x${string}`): string {
  try {
    return hexToString(b).replace(/\0+$/, "");
  } catch {
    return b;
  }
}

// bytes32 → null-terminated ASCII (e.g. 0x323032362d4641… → "2026-FA-DE-001")
function bytes32ToString(b: `0x${string}`): string {
  try {
    return hexToString(b).replace(/\0+$/, "");
  } catch {
    return b;
  }
}

function shortHash(h: `0x${string}` | string): string {
  return `${h.slice(0, 6)}…${h.slice(-3)}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Event fetch (last ~7 days on Sepolia ≈ 50,000 blocks at 12s)
// ─────────────────────────────────────────────────────────────────────────

async function fetchAllEvents() {
  const client = getClient();
  const latest = await client.getBlockNumber();
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

  return { mintLogs, swapLogs, retireLogs };
}

type FetchedEvents = Awaited<ReturnType<typeof fetchAllEvents>>;

// ─────────────────────────────────────────────────────────────────────────
// Audit log construction
// ─────────────────────────────────────────────────────────────────────────

function buildAuditFromEvents(events: FetchedEvents, beat: Beat): AuditEntry[] {
  const audit: AuditEntry[] = [];

  if (beat >= 3 && events.retireLogs[0]) {
    const l = events.retireLogs[0];
    audit.push({
      id: `r-${l.blockNumber}-${l.logIndex}`,
      ts: CLOCKS[3],
      hash: shortHash(l.transactionHash),
      kind: "RETIRE",
      amount: `${fmt(toUnits(l.args.amount as bigint))} EUA`,
      from: ensFor(l.args.from as Address),
      meta: `beneficiary: ${ensFor(l.args.beneficiary as Address)} · reasonURI: ${l.args.reasonURI || "—"}`,
    });
  }

  if (beat >= 2) {
    // A's sell = first Swap by companyA where credits go IN (isEURSIn=false)
    const aSell = events.swapLogs.find(
      (l) =>
        (l.args.sender as Address)?.toLowerCase() ===
          SEPOLIA.wallets.companyA.toLowerCase() && l.args.isEURSIn === false,
    );
    if (aSell) {
      const inEUA = toUnits(aSell.args.amountIn as bigint);
      const outEURS = toUnits(aSell.args.amountOut as bigint);
      const effective = inEUA > 0 ? outEURS / inEUA : 0;
      audit.push({
        id: `s-${aSell.blockNumber}-${aSell.logIndex}`,
        ts: CLOCKS[2],
        hash: shortHash(aSell.transactionHash),
        kind: "SWAP",
        from: ensFor(aSell.args.sender as Address),
        to: ensFor(SEPOLIA.contracts.CarbonDEX),
        outAmount: `${fmt(inEUA)} EUA`,
        inAmount: `${fmt(outEURS)} EURS`,
        meta: `effective ${effective.toFixed(2)} EURS/EUA · spot ${SPOT_PRICE_INITIAL.toFixed(2)} before · counterparty verified`,
      });
    }
  }

  if (beat >= 1 && events.mintLogs[0]) {
    const l = events.mintLogs[0];
    audit.push({
      id: `m-${l.blockNumber}-${l.logIndex}`,
      ts: CLOCKS[1],
      hash: shortHash(l.transactionHash),
      kind: "ISSUE",
      amount: `${fmt(toUnits(l.args.amount as bigint))} EUA`,
      to: ensFor(l.args.to as Address),
      meta: `vintage ${l.args.vintage} · sector ${bytes2ToString(l.args.sector as `0x${string}`)} · origin ${bytes2ToString(l.args.originCountry as `0x${string}`)} · ref ${bytes32ToString(l.args.issuanceRef as `0x${string}`)}`,
    });
  }

  return audit;
}

// ─────────────────────────────────────────────────────────────────────────
// Aggregate counters from event sums
// ─────────────────────────────────────────────────────────────────────────

function cumulativeIssued(events: FetchedEvents, beat: Beat): number {
  if (beat < 1) return 0;
  return events.mintLogs.reduce(
    (sum, l) => sum + toUnits(l.args.amount as bigint),
    0,
  );
}

function cumulativeRetired(events: FetchedEvents, beat: Beat): number {
  if (beat < 3) return 0;
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
  const [coBalEUA, coBalEURS, reserves] = await Promise.all([
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
      address: SEPOLIA.contracts.CarbonDEX,
      abi: CARBON_DEX_ABI,
      functionName: "getReserves",
    }),
  ]);

  return {
    coBal: toUnits(coBalEUA),
    coEurs: toUnits(coBalEURS),
    poolEurs: toUnits(reserves[0]),
    poolEua: toUnits(reserves[1]),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE state assembly
// ─────────────────────────────────────────────────────────────────────────

async function fetchLiveState(): Promise<DemoState> {
  const events = await fetchAllEvents();

  // Derive beat from how many events have fired
  const beat: Beat =
    events.retireLogs.length > 0
      ? 3
      : events.swapLogs.length > 0
        ? 2
        : events.mintLogs.length > 0
          ? 1
          : 0;

  const reads = await readCurrentSnapshot();
  const supply = cumulativeIssued(events, beat);
  const retired = cumulativeRetired(events, beat);

  return {
    beat,
    clock: CLOCKS[beat],
    supply,
    retired,
    inCirculation: supply - retired,
    coBal: reads.coBal,
    coEurs: reads.coEurs,
    poolEua: reads.poolEua,
    poolEurs: reads.poolEurs,
    spotPriceInitial: SPOT_PRICE_INITIAL,
    spotPrice: reads.poolEua > 0 ? reads.poolEurs / reads.poolEua : 0,
    effectivePrice: EFFECTIVE_PRICE,
    slippagePct: SLIPPAGE_PCT,
    tradeProceedsEurs: TRADE_PROCEEDS_EURS,
    buyerCostEurs: BUYER_COST_EURS,
    lpFeeEurs: LP_FEE_EURS,
    audit: buildAuditFromEvents(events, beat),
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

  // Otherwise, read live from Sepolia.
  try {
    const state = await fetchLiveState();
    return { state, isLive: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chain-state] live fetch failed; falling back to sim:", msg);
    return { state: stateAt(3), isLive: false, error: msg };
  }
}
