// Shared simulation state — happy-path screens.
// Company A (cement-mainz.eth) is the sole protagonist:
//   Beat 0  awaiting · 1000 allocation queued
//   Beat 1  receives 1000 EUA (issuance)
//   Beat 2  sells 200 EUA → 14,028 EURS on DEX (excess allocation)
//   Beat 3  retires 200 EUA against verified emissions

const ACTORS = {
  CO: {
    ens: 'cement-mainz.eth',
    addr: '0xA1F8…7c2D',
    label: 'Verified emitter — Cement, DE',
    sector: 'Industry · Cement',
    origin: 'DE',
  },
  REG: { ens: 'eu-ets-authority.eth', addr: '0xE7c0…ETS9', label: 'EU ETS Authority' },
  POOL: { ens: 'Carbon DEX Pool', addr: '0xD3X0…f10a', label: 'AMM pool · EURS ⇄ EUA' },
};

const PRICE = 70.14;
const QTY_ISSUE = 1000;
const QTY_TRADE = 200;
const QTY_RETIRE = 200;
const POOL_EUA_BEFORE = 12420;

function stateAt(beat) {
  const supply = beat >= 1 ? QTY_ISSUE : 0;
  const retired = beat >= 3 ? QTY_RETIRE : 0;
  const inCirculation = supply - retired;

  // Company A holdings move: 0 → 1000 → 800 (sold 200) → 600 (retired 200)
  const coBal = beat >= 3 ? (QTY_ISSUE - QTY_TRADE - QTY_RETIRE)
              : beat >= 2 ? (QTY_ISSUE - QTY_TRADE)
              : beat >= 1 ? QTY_ISSUE : 0;
  const coEurs = beat >= 2 ? 8400 + Math.round(QTY_TRADE * PRICE) : 8400;

  // Pool absorbs the 200 EUA Company A sells in beat 2
  const poolEua = beat >= 2 ? POOL_EUA_BEFORE + QTY_TRADE : POOL_EUA_BEFORE;
  const poolEurs = beat >= 2 ? POOL_EUA_BEFORE * PRICE - Math.round(QTY_TRADE * PRICE) : POOL_EUA_BEFORE * PRICE;

  const clockMins = ['14:30', '14:32', '14:38', '15:04'];
  const clock = clockMins[beat] || clockMins[0];

  // Audit log entries (newest first)
  const audit = [];
  if (beat >= 3) audit.push({
    id: 'a3', ts: '15:04:11', kind: 'RETIRE',
    body: <><strong>200 EUA</strong> · cement-mainz.eth · <span className="meta">beneficiary: Q4-2026 emissions · reasonURI: ipfs://QmYz…2026.pdf</span></>,
    hash: '0x9ae1…c4f',
  });
  if (beat >= 2) audit.push({
    id: 'a2', ts: '14:38:47', kind: 'SWAP',
    body: <><strong>cement-mainz.eth</strong> ⇄ Carbon DEX Pool · <strong>200 EUA</strong> sold · 14,028 EURS received · <span className="meta">price 70.14 EURS/EUA · slippage 0.18% · counterparty verified</span></>,
    hash: '0x2c4f…81b',
  });
  if (beat >= 1) audit.push({
    id: 'a1', ts: '14:32:03', kind: 'ISSUE',
    body: <><strong>1,000 EUA</strong> → cement-mainz.eth · <span className="meta">vintage 2026 · sector cement · origin DE · ref 2026-FA-DE-001</span></>,
    hash: '0x4d1a…7e2',
  });

  return { beat, clock, supply, retired, inCirculation, coBal, coEurs, poolEua, poolEurs, audit, price: PRICE };
}

const NARRATION = [
  { tag: 'Beat 00 · Pre-demo', text: '"Compliance year 2026 begins. The annual free-allocation event is queued and confirmed. The on-chain registry is empty."' },
  { tag: 'Beat 01 · Issuance', text: '"Pre-computed weeks earlier from sector benchmark × historical activity, the 2026 free-allocation event fires. Cement-mainz.eth, a verified cement producer, receives 1,000 EUAs."' },
  { tag: 'Beat 02 · Secondary trade', text: '"Cement-mainz emitted less than its allocation. They sell 200 EUAs into the on-chain pool — 14,028 EURS received."' },
  { tag: 'Beat 03 · Surrender', text: '"End of compliance year. Verified emissions: 200 tCO₂. Cement-mainz surrenders 200 EUAs — burned forever. The cap holds; on-chain supply has actually contracted."' },
];

const BEAT_LABELS = ['00 Pre-demo', '01 Issuance', '02 Trade', '03 Retire'];

function fmt(n) { return n.toLocaleString('en-US'); }

Object.assign(window, { ACTORS, PRICE, QTY_ISSUE, QTY_TRADE, QTY_RETIRE, stateAt, NARRATION, BEAT_LABELS, fmt });
