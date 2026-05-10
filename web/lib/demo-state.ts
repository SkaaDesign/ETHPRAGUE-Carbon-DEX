// Port of design/source/carbon-dex/project/happy-path/state.jsx with
// main-session resolution numbers (single-actor narrative, retire-all-800).
//
// Single protagonist: cement-mainz.verified-entity.eth.
//   Beat 0  awaiting (allocation queued, on-chain registry empty)
//   Beat 1  receives 1,000 EUA (regulator issuance event)
//   Beat 2  sells 200 surplus EUA into pool → 13,422 EURS in
//   Beat 3  retires ALL remaining 800 EUA (no banking, full surrender)
//
// Company B exists only as the unseen pool counterparty (the 200 EUA sold
// into the pool eventually settle into B's wallet — never visible in UI).
//
// Closing visual: 1,000 issued · 800 retired · 200 still circulating (the
// 200 sit in pool / B's wallet, off-stage).
//
// This module is the single source of truth the three routes read from
// while contracts aren't wired. When viem reads from anvil/Sepolia land,
// we replace `stateAt(beat)` with event-derived state — same shape.

export type Beat = 0 | 1 | 2 | 3;

export const ACTORS = {
  CO: {
    ens: 'cement-mainz.verified-entity.eth',
    addr: '0xA1F8…7c2D',
    label: 'Verified emitter — Cement, DE',
    sector: 'Industry · Cement',
    origin: 'DE',
  },
  REG: {
    ens: 'eu-ets-authority.eth',
    addr: '0xE7c0…ETS9',
    label: 'EU ETS Authority',
  },
  POOL: {
    ens: 'Carbon DEX Pool',
    addr: '0xD3C0…f10a',
    label: 'AMM pool · EURS ⇄ EUA',
  },
} as const;

// Pool initial state (matches main session's DemoLocal.s.sol seed).
const POOL_EURS_INITIAL = 350_000;
const POOL_EUA_INITIAL = 5_000;
const SPOT_PRICE_INITIAL = POOL_EURS_INITIAL / POOL_EUA_INITIAL; // 70.00

// Demo-flow constants (locked per main-session resolution).
export const QTY_ISSUE = 1_000;
export const QTY_TRADE = 200; // EUA sold by cement-mainz in Beat 2
export const QTY_RETIRE = 800; // EUA retired by cement-mainz in Beat 3 (all remaining)
export const TRADE_PROCEEDS_EURS = 13_422; // V2 math: A sells 200 EUA into 350k/5k pool, 0.3% fee
export const BUYER_COST_EURS = 13_503; // V2 math: B buys 200 EUA from the post-A pool (5,200/336,578), 0.3% fee
export const LP_FEE_EURS = BUYER_COST_EURS - TRADE_PROCEEDS_EURS; // ~81 EURS — the spread accrues to the pool, paid to LPs (banks / market makers)

// Derived numbers
const POOL_EUA_AFTER_TRADE = POOL_EUA_INITIAL + QTY_TRADE; // 5,200
const POOL_EURS_AFTER_TRADE = POOL_EURS_INITIAL - TRADE_PROCEEDS_EURS; // 336,578
const EFFECTIVE_PRICE = TRADE_PROCEEDS_EURS / QTY_TRADE; // 67.11
const SLIPPAGE_PCT =
  ((SPOT_PRICE_INITIAL - EFFECTIVE_PRICE) / SPOT_PRICE_INITIAL) * 100; // ~4.13

// Cement-mainz EURS balance baseline (pre-trade).
const CO_EURS_INITIAL = 8_400;

const CLOCKS: Record<Beat, string> = {
  0: '14:30',
  1: '14:32',
  2: '14:38',
  3: '15:04',
};

// Discriminated union — each audit kind has its own shape so components
// render the right template per kind without runtime type checks.
export type AuditEntry =
  | {
      id: string;
      ts: string;
      hash: string;
      txHash?: string;
      kind: 'ISSUE';
      amount: string; // "1,000 EUA"
      to: string; // "cement-mainz.verified-entity.eth"
      meta: string; // "vintage 2026 · sector cement · origin DE · ref 2026-FA-DE-001"
    }
  | {
      id: string;
      ts: string;
      hash: string;
      txHash?: string;
      kind: 'SWAP';
      from: string; // "cement-mainz.verified-entity.eth"
      to: string; // "Carbon DEX Pool"
      outAmount: string; // "200 EUA"
      inAmount: string; // "13,422 EURS"
      meta: string;
    }
  | {
      id: string;
      ts: string;
      hash: string;
      txHash?: string;
      kind: 'RETIRE';
      amount: string; // "800 EUA"
      from: string; // "cement-mainz.verified-entity.eth"
      meta: string;
    }
  | {
      id: string;
      ts: string;
      hash: string;
      txHash?: string;
      kind: 'FREEZE' | 'PAUSE';
      target: string;
      reason: string;
    };

export type DemoState = {
  beat: Beat;
  clock: string;
  // Aggregate counters
  supply: number; // EUAs issued by regulator (cumulative, real allocations only — LP/B-inventory mints excluded)
  retired: number; // EUAs surrendered (burned)
  inCirculation: number; // supply - retired
  // cement-mainz wallet
  coBal: number; // EUA
  coEurs: number; // EURS
  // aluminium-bratislava wallet — read live from chain so the b-bot's
  // counter-trades visibly move B's balance on /public + /regulator rosters.
  coBalB: number; // EUA
  // Pool reserves
  poolEua: number;
  poolEurs: number;
  // Pricing
  spotPriceInitial: number; // 70.00 — pool spot before any swap (constant)
  spotPrice: number; // poolEurs / poolEua at this beat (changes after Beat 2)
  effectivePrice: number; // 67.11 (constant — Beat 2's settled price for A's sell)
  slippagePct: number; // 4.13 — A's price impact vs initial spot
  tradeProceedsEurs: number; // 13,422 — what A receives (constant)
  buyerCostEurs: number; // 13,503 — what B pays for the matching 200-EUA purchase (constant)
  lpFeeEurs: number; // 81 — the spread A→B that accrues to the pool LP (constant)
  // Audit log — newest first
  audit: AuditEntry[];
};

export function stateAt(beat: Beat): DemoState {
  const supply = beat >= 1 ? QTY_ISSUE : 0;
  const retired = beat >= 3 ? QTY_RETIRE : 0;
  const inCirculation = supply - retired;

  // cement-mainz EUA holdings: 0 → 1000 → 800 (sold 200) → 0 (retired 800)
  const coBal =
    beat >= 3 ? 0 : beat >= 2 ? QTY_ISSUE - QTY_TRADE : beat >= 1 ? QTY_ISSUE : 0;

  // cement-mainz EURS: gains TRADE_PROCEEDS_EURS at Beat 2; unchanged at Beat 3
  const coEurs = beat >= 2 ? CO_EURS_INITIAL + TRADE_PROCEEDS_EURS : CO_EURS_INITIAL;

  // Pool reserves: change only at Beat 2 (200 EUA in, 13,422 EURS out)
  const poolEua = beat >= 2 ? POOL_EUA_AFTER_TRADE : POOL_EUA_INITIAL;
  const poolEurs = beat >= 2 ? POOL_EURS_AFTER_TRADE : POOL_EURS_INITIAL;
  const spotPrice = poolEurs / poolEua;

  const audit: AuditEntry[] = [];
  if (beat >= 3) {
    audit.push({
      id: 'a3',
      ts: '15:04:11',
      hash: '0x9ae1…c4f',
      kind: 'RETIRE',
      amount: '800 EUA',
      from: ACTORS.CO.ens,
      meta: 'beneficiary: Q4-2026 emissions · reasonURI: ipfs://QmYz…2026.pdf',
    });
  }
  if (beat >= 2) {
    audit.push({
      id: 'a2',
      ts: '14:38:47',
      hash: '0x2c4f…81b',
      kind: 'SWAP',
      from: ACTORS.CO.ens,
      to: ACTORS.POOL.ens,
      outAmount: '200 EUA',
      inAmount: '13,422 EURS',
      meta: `effective ${EFFECTIVE_PRICE.toFixed(2)} EURS/EUA · spot ${SPOT_PRICE_INITIAL.toFixed(2)} before · slippage ${SLIPPAGE_PCT.toFixed(2)}% · counterparty verified`,
    });
  }
  if (beat >= 1) {
    audit.push({
      id: 'a1',
      ts: '14:32:03',
      hash: '0x4d1a…7e2',
      kind: 'ISSUE',
      amount: '1,000 EUA',
      to: ACTORS.CO.ens,
      meta: 'vintage 2026 · sector cement · origin DE · ref 2026-FA-DE-001',
    });
  }

  return {
    beat,
    clock: CLOCKS[beat],
    supply,
    retired,
    inCirculation,
    coBal,
    coEurs,
    coBalB: 820, // sim-only — real chain value comes from chain-state.ts
    poolEua,
    poolEurs,
    spotPriceInitial: SPOT_PRICE_INITIAL,
    spotPrice,
    effectivePrice: EFFECTIVE_PRICE,
    slippagePct: SLIPPAGE_PCT,
    tradeProceedsEurs: TRADE_PROCEEDS_EURS,
    buyerCostEurs: BUYER_COST_EURS,
    lpFeeEurs: LP_FEE_EURS,
    audit,
  };
}

export const NARRATION: Record<Beat, { tag: string; text: string }> = {
  0: {
    tag: 'Beat 00 · Pre-demo',
    text: '"Compliance year 2026 begins. The annual free-allocation event is queued and confirmed. The on-chain registry is empty."',
  },
  1: {
    tag: 'Beat 01 · Issuance',
    text: '"Pre-computed weeks earlier from sector benchmark × historical activity, the 2026 free-allocation event fires. Cement-mainz.eth, a verified cement producer, receives 1,000 EUAs."',
  },
  2: {
    tag: 'Beat 02 · Secondary trade',
    text: '"Cement-mainz emitted less than its allocation. They sell 200 surplus EUAs into the on-chain pool — 13,422 EURS received."',
  },
  3: {
    tag: 'Beat 03 · Surrender',
    text: '"End of compliance year. Verified emissions: 800 tCO₂. Cement-mainz surrenders all 800 remaining EUAs — burned forever. The cap holds; on-chain supply has actually contracted by 800."',
  },
};

export const BEAT_LABELS: Record<Beat, string> = {
  0: '00 Pre-demo',
  1: '01 Issuance',
  2: '02 Trade',
  3: '03 Retire',
};

export function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

// Parse a beat from URL search params (?beat=0..3). Falls back to the
// most-advanced beat (3) so the closing visual is the default render —
// matching how the design canvas presents the final state as the lead shot.
export function beatFromSearchParams(params: URLSearchParams): Beat {
  const raw = params.get('beat');
  if (raw === null) return 3;
  const n = parseInt(raw, 10);
  if (n === 0 || n === 1 || n === 2 || n === 3) return n;
  return 3;
}

export function isBeat(n: unknown): n is Beat {
  return n === 0 || n === 1 || n === 2 || n === 3;
}
