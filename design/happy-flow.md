# Carbon DEX — Happy-Flow Demo Spec

> Design handoff for Lin / the design session. Self-contained — no external context needed.
> Pair this with `BRIEF.md` (full project scope) and `research/eu-ets-reality-check.md` (regulator-mechanics research) only if you want depth.
>
> **What this doc replaces:** the freeze-centric flow in `BRIEF.md §5`. That flow is preserved as §5b (alternate / drama version). The flow described here is the **primary live demo**.
>
> **Date:** 2026-05-09. Last decision change: pivoted `CarbonCredit` from ERC-1155 to ERC-20.

---

## 1. One-line context

**Carbon DEX is the on-chain settlement layer for the EU ETS secondary market.** It does *not* replace the EU registry — it sits *downstream of allowance issuance* and *upstream of compliance surrender*. Companies bring in already-allocated EUAs (free allocation OR EEX auction settlement, both via a custodian wrap or native issuance), trade them on-chain, and burn them against verified emissions. The regulator participates **as a first-class on-chain actor** with mint, freeze, and audit powers — that's the project's differentiator.

---

## 2. The three screens at a glance

| Route | Audience | Always-on / interactive | Primary purpose |
|---|---|---|---|
| **`/company`** | Verified emitters (Company A, Company B) | Interactive — connect wallet, sign txs | Issuance receipt → swap → surrender |
| **`/regulator`** | EU ETS Authority operator | Interactive — buttons (mint, freeze, pause), but mostly observational dashboard | Live audit log + compliance roster + supervisory actions |
| **`/public`** | Anyone — judges, observers, sustainability reporters | **Read-only, no wallet required** | Total supply, all trades, all retirements, regulator action log |

**Three laptops on stage** for the live demo. One per screen. The Company laptop switches between Company A and Company B as the flow progresses (single-window, visible tab/role switch).

---

## 3. Cast of characters (ENS names — make these prominent on every screen)

| Address | ENS | Role |
|---|---|---|
| `0x...A` | `cement-mainz.eth` | **Company A** — verified cement producer, receives free allocation, sits as foil (decorative; no hero action in happy flow) |
| `0x...B` | `aluminium-bratislava.eth` | **Company B** — verified aluminium smelter, hero of the demo: buys credits, surrenders against emissions |
| `0x...R` | `eu-ets-authority.eth` | **Regulator** — issues, audits, can freeze. In the happy flow, performs only the issuance action live |
| `0x...P` | (pool address, label "Carbon DEX Pool") | **AMM pool** — pre-seeded liquidity off-stage; narrate as "protocol-bootstrap liquidity from market makers" |

**Use ENS, not hex.** A hex address on the regulator dashboard kills the institutional aesthetic.

---

## 4. Design-system constraints (locked, do not relitigate)

- **Direction:** Scandinavian / institutional. IBM Plex Sans + Fraunces (display) + IBM Plex Mono (data / addresses / hashes).
- **No crypto-kitsch.** No gradients, no glassmorphism, no neon, no animated tokens floating around. Judges from TradFi or policy backgrounds respond to clean, sparse, structured design.
- **Generous whitespace.** Tabular data preferred over cards-with-icons.
- **Accent colour for state changes only** — don't paint the whole UI with brand colour. Use colour to flag *new* / *frozen* / *retired* / *audit alert*.
- **Audit aesthetic.** Think: ECB monthly bulletin, Eurostat dashboard, EEX trading screen — not Aave, not Uniswap.

---

## 5. Token model — what's true now

**`CarbonCredit` is ERC-20** (changed from ERC-1155 on 2026-05-09). Single fungible token. Total supply on-chain = total in circulation. Burn on retirement = real supply contraction, observable via `totalSupply`.

**Vintage / sector / origin metadata lives on events**, not on the token:
- `CreditMinted(address indexed to, uint256 amount, uint16 vintage, uint8 sector, bytes2 originCountry, uint256 issuanceRef)` — emitted by `Regulator.mint()`
- `CreditRetired(address indexed from, uint256 amount, uint16 vintage, address indexed beneficiary, string reasonURI)` — emitted by `Retirement.retire()`

**Implication for design:** wallet balances show a single number ("Company B balance: 200 EUAs"). Provenance ("vintage 2026, cement, DE") is shown in **transaction-detail panels** by reading the corresponding `CreditMinted` event for the original issuance. The `/public` view should let any visitor click an address and see its full mint/transfer/retire history derived from event logs.

This matches real EU ETS behaviour: EUAs are fungible within Phase 4 (2021-2030); the registry tracks unit identifiers off-screen for accounting but the unit itself is fungible.

---

## 6. The happy flow — three beats

Each beat is one transaction. Total stage time: ~3 minutes if narrated tightly. One narrator (Nahin), three operators (Company-A clicker, Company-B clicker, Regulator clicker). The Public screen is observational only — operator just keeps it visible.

### Beat 1 — Issuance event

> **Narration:** *"It's the start of compliance year 2026. The EU ETS has run its February allocation event. Company A — `cement-mainz.eth`, a verified cement producer — receives 1,000 vintage-2026 EUAs from the EU ETS Authority."*

| Screen | What happens |
|---|---|
| **`/company`** *(Company A)* | Wallet balance: **0 → 1,000 EUAs**. Toast / inline notification: *"Allocation received: 1,000 EUAs from `eu-ets-authority.eth`. Vintage 2026 · sector: Industry · origin: DE."* Clickable: tx hash, Sourcify-verified contract badge. New holdings line in portfolio table. |
| **`/regulator`** | Audit log streams a fresh entry at top: **`ISSUE`** · `1,000 EUAs → cement-mainz.eth` · `vintage 2026, cement, DE` · timestamp · tx hash. Issuance counter ticks `0 → 1,000`. Compliance roster shows both companies as **✅ Verified, not frozen**. Live trade feed: empty. |
| **`/public`** | Total on-chain supply: **0 → 1,000**. Vintage-2026 panel populates. Public allocation log entry visible. Cap-accounting widget (top right): `1,000 issued · 0 retired · 1,000 in circulation`. No wallet connection required to see any of this. |

### Beat 2 — Secondary-market trade

> **Narration:** *"Company B — `aluminium-bratislava.eth`, an aluminium smelter — emitted above its allocation this year. They need 200 more EUAs to stay compliant. They have euros; they need credits. They head to the on-chain DEX."*

| Screen | What happens |
|---|---|
| **`/company`** *(switches to Company B)* | Swap form on screen. Input: "Buy 200 EUAs". Quote: **~14,000 EURS** in (price ~€70/EUA, slippage 0.2%). Company B confirms, signs in wallet. Wallet updates: **0 → 200 EUAs**, EURS balance drops by ~14,000. Receipt panel slides in: tx hash, Sourcify badge, swap details. |
| **`/regulator`** | Live trade feed lights up at top: **`SWAP`** · `aluminium-bratislava.eth` ⇄ `Carbon DEX Pool` · `200 EUAs out · 14,028 EURS in` · `price 70.14 EURS/EUA` · ✅ both counterparties verified, not frozen · tx hash. Provenance arrow visible (origin → pool → Company B). Issuance↔surrender ledger: `1,000 issued · 0 retired · 1,000 active · 200 in Company B's wallet`. |
| **`/public`** | Public ticker: trade row appears with timestamp, ENS names (no hex), price. Pool depth widget updates. Price chart ticks at €70.14. Cumulative volume +200 EUAs. |

### Beat 3 — Surrender (retire)

> **Narration:** *"End of compliance year. Company B's verified emissions report comes in: 200 tonnes CO₂ from their smelter. They surrender 200 EUAs against those emissions — burned forever. The cap holds; the on-chain supply has actually contracted by 200."*

| Screen | What happens |
|---|---|
| **`/company`** *(Company B)* | Surrender form. Pre-filled: *"Retire 200 EUAs · beneficiary: Company B emissions Q4-2026 · reason URI: `ipfs://...sustainability-report-2026.pdf`"*. Confirms, signs. Wallet: **200 → 0 EUAs**. Permanent **retirement certificate** issued — copyable URL for the sustainability report; QR code for the disclosure filing. Tone: *certificate*, not *transaction*. This is the artefact a corporate sustainability officer cites. |
| **`/regulator`** | Audit log: **`RETIRE`** · `200 EUAs · aluminium-bratislava.eth` · `beneficiary: Company B Q4-2026 emissions` · `reasonURI: ipfs://...` · tx hash. Surrender counter ticks `0 → 200`. Compliance status for Company B: **✅ in good standing for 200 tCO₂ surrendered.** |
| **`/public`** | Total on-chain supply: **1,000 → 800** (200 permanently destroyed). Cap-accounting widget: `1,000 issued · 200 retired · 800 in circulation`. **Permanent retirement record viewable by anyone.** This is the closing visual — *"this actually does what cap-and-trade is supposed to do."* |

---

## 7. Per-screen visual hierarchy (what to emphasise)

### `/company`
- **Wallet balance** is the single biggest element on the screen at any moment. Big number, IBM Plex Mono, accent colour when changing.
- **One primary action button** at any time (Connect / Swap / Retire). No secondary CTAs competing.
- **Provenance panel**: clickable badge near the balance opens a side-panel showing where the tokens in this wallet came from (read from `CreditMinted` and transfer events). Dotted-line provenance graph.
- **Receipts** are first-class — each completed action produces a copyable, citation-friendly receipt. This is what a corporate disclosure officer needs.

### `/regulator`
- **Audit log** is the spine of the screen — top-down stream, newest on top, monospaced, expandable rows. Like a trading-desk blotter, not a social feed.
- **Compliance roster** in a side rail: every verified address, ENS name, status (verified / frozen / blacklisted), last-action timestamp. Click → drilldown.
- **Counter widgets** (issued / retired / in-circulation / pool depth) at the top — institutional KPI strip.
- **Action buttons** (mint, freeze, pause) deliberately under-decorated — these are *powers*, not *features*. Place them in a "Authority controls" panel with a slight gravitas (small label like *"Use sparingly. All actions logged immutably."*).
- **No live trade feed pyrotechnics.** No pulses, no sound, no glow. A new row enters at the top — full stop.

### `/public`
- **No wallet button.** First thing a judge should notice: they can read this without connecting anything. Make this loudly visible.
- **Cap-accounting widget** (issued / retired / in-circulation) is the single most important element on this screen — it's the proof that the system actually contracts supply.
- **Trade ticker** + **retirement record** are equally weighted in the body.
- **Click any address → full history page** (mints received, trades, retirements). Same data the regulator has, just unauthenticated.
- **Prominent footer link to Sourcify-verified contract addresses.**

---

## 8. What's NOT in the live demo (deliberately)

These are scope-honest omissions. Have answers ready for Q&A but no UI for any of them.

| Omission | Why |
|---|---|
| The freeze flow | Saved for §5b. Live demo is happy-path only (per primary demo strategy A). |
| Auction mechanism | Auctions happen upstream of us (EEX Leipzig). Our `Regulator.mint()` represents either free allocation or post-auction custodian-wrap. |
| Allocation calendar (Feb 28 / 30 Sept) | Implied by narration, not visualised. Could be a future "Mechanics" artboard for the pitch deck. |
| Free-allocation benchmark calculation | Off-chain; we just receive the result. |
| Verified emissions oracle | We trust the narrator that "Company B emitted 200 tCO₂"; no oracle. |
| Cross-vintage banking | Doesn't appear in a single-vintage demo. Mention in Q&A: *"a 2024 EUA satisfies a 2026 surrender; banking is unrestricted intra-Phase 4."* |
| Bridge / custodian wrap | Out of demo, in the pitch slide. The DEX is what's on-chain regardless of bridge model. |

---

## 9. Numbers worth showing on screen (defensible if a judge asks)

These can appear in dashboard widgets (especially `/regulator` and `/public`) to ground the system in real EU ETS context. All sourced from `research/eu-ets-reality-check.md`.

| Metric | Value | Where it could live |
|---|---|---|
| EU ETS Phase 4 cap (2024) | ~1.39 GtCO₂ | `/public` "real-world cap" widget |
| Linear Reduction Factor | 4.4% / yr (from 2024) | tooltip / pitch only |
| EU ETS price (current) | ~€65–70 / EUA | DEX price reference |
| Surrender deadline | 30 September | regulator dashboard countdown |
| EEX auction cadence | Mon / Tue / Thu / Fri-DE, ~1–1.5M EUAs/day | Q&A only |
| Excess-emission penalty | €100 / tonne | implicit price ceiling reference |

Keep this restrained — overloading the public view with macro stats is its own form of clutter.

---

## 10. Decisions already made (do not relitigate)

| Decision | Status | Source |
|---|---|---|
| `CarbonCredit` is **ERC-20**, not ERC-1155 | Locked 2026-05-09 (resolves Uniswap V2 fork composition) | This file, `BRIEF.md §4` |
| AMM = **Uniswap V2 fork**, single `EURS ↔ CarbonCredit` pool | Locked | `BRIEF.md §3` |
| Whitelist: hard, gated by `ComplianceRegistry.isVerified()` | Locked | `BRIEF.md §3` |
| Settlement currency = **mock `EURS` ERC-20** | Locked | `BRIEF.md §3` |
| Regulator persona = generic **"EU ETS Authority"** | Locked | `BRIEF.md §3` |
| Demo chain = **Sepolia L1** (native ENS, fewer moving pieces) | Locked 2026-05-08 | memory |
| Use **ENS** everywhere a hex address would otherwise show | Locked | `BRIEF.md §6` |
| All contracts **Sourcify-verified**, badge in UI | Locked | `BRIEF.md §6, §9` |
| Demo strategy: **happy flow primary**, freeze flow as alternate (B from prior triage) | Provisional — confirm | This file |

---

## 11. Open design questions

These are genuinely undecided. Lin / design Claude can take a swing.

1. **Single Company screen with role-switch, or two split-screen Company panes?** The latter avoids confusion when audience sees "the Company laptop" change identity mid-demo. Trade-off: visual clutter vs narrative clarity.
2. **Cap-accounting widget format on `/public`** — flat counters, animated bar, or a small horizontal sankey (issued → in-pool → in-wallets → retired)?
3. **Retirement certificate visual** — receipt-style (rectangular, plain), credential-style (verifiable-credential card), or PDF-export-style (auditable doc)? The third pushes hardest on the institutional aesthetic.
4. **Provenance graph on `/company`** — always visible mini, or click-to-expand?
5. **Narration timing aids** — does the regulator screen need a small "stage cue" panel for the operator, or is the audit log self-pacing?

---

## 12. What to ship (design deliverables expected back)

Not blocking, but useful framing for what the design pass should produce:

1. **Three screen mockups** (`/company`, `/regulator`, `/public`) at the moment of **Beat 2** (mid-demo, the busiest state)
2. **Three screen mockups** at the moment of **Beat 3 conclusion** (closing visual — the cap-accounting "200 retired" state on `/public` is the money shot)
3. **One-row component spec** for the audit log (how a single row looks across `ISSUE`, `SWAP`, `RETIRE`, `FREEZE`, `PAUSE` types)
4. **Retirement certificate** mock (the artefact Company B walks away with)

---

*If anything here looks wrong, push back to Fredrik before shipping. Decisions in §10 are firm; everything else is open to design judgement.*
