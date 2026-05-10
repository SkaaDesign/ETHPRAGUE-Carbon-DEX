# Carbon DEX — Team Scope

> ETHPrague 2026 hackathon project. This doc is the single source of truth for scope. Updated 2026-05-08 after team review.
>
> **Status:** Day 1 — scope locked. Next: distribute to team, scaffold contracts + frontend wireframes. Pitch, Q&A, role-detail, cut-list deferred until after core works.

---

## 1. The project in one line

**Carbon trading where the regulator is a first-class participant, not a hostile force.**

A regulator-supervised on-chain DEX for EU-compliance-style carbon credits. Verified companies trade tokenized carbon allowances. A "regulator" role can mint, freeze, blacklist, and audit — but cannot front-run or extract value mid-trade. Every contract is publicly verified.

---

## 2. Why this idea has a seam to walk through

The on-chain carbon space looks crowded but isn't where we're going.

|  | **Voluntary market** | **Compliance market (EU ETS, ~€800B/yr)** |
|---|---|---|
| Permissionless / crypto-native | Toucan, Klima, MOSS, C3 — crashed 2022, junk credits, no regulator | **EMPTY ← us** |
| Permissioned / TradFi-native | ACX, Senken, JPM Project Carbon | EEX, ICE, Nasdaq — incumbents with no on-chain presence |

Toucan/Klima got crushed in 2022 because they bridged junk Verra credits with no oversight. We are not them. We target the compliance market they architecturally cannot enter (because permissionless + regulators don't mix).

Regulatory framing for backup:
- **Carbon credits are explicitly carved out of MiCA.** They're regulated under **MiFID II** + the **EU ETS Directive**.
- Our DEX is designed to fit *that* framework, not to evade it.

---

## 3. Locked architectural decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Exchange model | **Custom CPMM (constant-product, Uniswap V2-style math)** — Updated 2026-05-09 (was "Uniswap V2 fork"). Same `x*y=k` math; written fresh in Solidity 0.8.x to avoid V2's 0.5.16 multi-version compile pain and to keep whitelist + pause hooks clean. |
| 2 | Market segment | **B2B compliance** |
| 3 | Settlement currency | **Mock EUR ERC-20 token, name `EURS`** |
| 4 | Regulator simulated as | **Generic "EU ETS Authority"** |
| 5 | Permission model | **Hard whitelist** — only addresses in `ComplianceRegistry` can hold or trade credits |
| 6 | Carbon credit token standard | **ERC-20** — single fungible token. Updated 2026-05-09 (was ERC-1155). Composes natively with the CPMM (any constant-product AMM works with ERC-20 pairs; ERC-1155 would force a per-id wrapper); matches real EU ETS within-Phase fungibility. Vintage / sector / origin metadata moves to issuance and retirement event payloads. |

---

## 3.5. Where Carbon DEX sits in the ETS landscape

Carbon DEX is the **on-chain settlement layer for the EU ETS secondary market.** It does *not* replace the EU registry. We sit downstream of allowance issuance (free allocation + EEX auction) and upstream of compliance surrender. This framing holds across all roadmap stages — the contracts don't change between v1 and v3.

| Stage | Token issuance | Trading layer | Status |
|---|---|---|---|
| **v1 — Wrapped secondary** *(this prototype)* | Licensed custodian holds real EUAs in Union Registry; mints 1:1 backed tokens on-chain (wBTC pattern). MiCA + DLT Pilot Regime path. | Carbon DEX (these contracts) | **Demoable today**; needs custodian for production |
| **v2 — Native settlement** | Union Registry interoperates with public chain; allowances issued natively as tokens by the Commission / national administrators. | Carbon DEX (unchanged) | EU policy decision, 1–5 yr arc |
| **v3 — Native auction** | Auction itself moves on-chain (sealed-bid or Dutch via smart contract); cuts EEX/ECC out. | Carbon DEX + auction layer | After v2; longest-horizon |

**Why this framing matters:**
- The same trading + surrender + supervision logic works at every stage. Our contracts are durable across the roadmap.
- We pre-empt the *"are you replacing the EU registry?"* question with an honest *"no — we're the secondary market; here's how the rest connects."*
- The bridge gap (custodian-wrap in v1) is acknowledged, not hidden. Faking native issuance for the demo and pretending there's no bridge is the failure mode.

**For the live demo:** the issuance event executed by the regulator represents either custodian-wrap (real EUA arrives → backed token issued) or native issuance (v2/v3 sovereign mint). On-chain it's the same primitive (`CarbonCredit.mint` called by `Regulator`); the upstream story differs. We don't pick on stage; the narrator clarifies if asked. **Issuance is a calendar-driven process, not a discretionary regulator action** — see `design/happy-flow.md §7` for the UI implication (scheduled-events panel vs authority-controls panel).

For real EU ETS regulator powers, allocation calendar, surrender mechanics, and Union Registry architecture, see `research/eu-ets-reality-check.md`.

---

## 4. Architecture — what we're building

### Repo layout

```
ethereum-test-realm/
├── contracts/                  # Foundry project
│   ├── src/
│   │   ├── CarbonCredit.sol
│   │   ├── ComplianceRegistry.sol
│   │   ├── CarbonDEX.sol
│   │   ├── Regulator.sol
│   │   ├── Retirement.sol
│   │   └── EURS.sol            # mock settlement token
│   ├── script/                 # forge scripts: deploy, seed, demo flow
│   └── test/                   # forge tests (unit + fuzz)
├── web/                        # Next.js + viem
│   ├── app/
│   │   ├── company/            # company role
│   │   ├── regulator/          # regulator role
│   │   └── public/             # public observer
│   └── lib/
│       └── contracts.ts        # ABI bindings, addresses
├── handoffs/                   # cross-machine session handoffs (existing)
└── BRIEF.md                    # this file
```

### Contract spec (function-level)

#### `CarbonCredit.sol`
- **Standard:** ERC-20 — single fungible token. Updated 2026-05-09 (was ERC-1155).
- **Why ERC-20 not ERC-1155:** the constant-product AMM expects ERC-20 token pairs natively; ERC-1155 would force a per-id wrapper. Real EU ETS treats EUAs as fungible commodities within a phase (a 2024 EUA satisfies a 2026 surrender obligation — banking is unrestricted intra-Phase 4). Modelling them as separate token ids over-segregates what is fungible by law.
- **Where the metadata lives:** vintage / sector / origin / methodology travel on **issuance and retirement event payloads**, not on the token. Provenance is recoverable from event logs without bloating the token contract.
- **Key state:** standard ERC-20 (`balanceOf`, `totalSupply`, `allowance`); `MINTER_ROLE` gated to `Regulator`; transfers gated by `ComplianceRegistry.isVerified()` on both `from` and `to`.
- **Key functions:** `mint(to, amount, vintage, sector, originCountry, issuanceRef)` (regulator-only; emits `CreditMinted` carrying full provenance), `transfer` / `transferFrom` (whitelist-gated), `burnFrom(from, amount)` (called by `Retirement.sol`).
- **Key events:** `CreditMinted(to, amount, vintage, sector, originCountry, issuanceRef)`, `CreditRetired(from, amount, beneficiary, reasonURI)`. Standard ERC-20 `Transfer` and `Approval` events also fire.

#### `ComplianceRegistry.sol`
- **Purpose:** the on-chain whitelist of who can hold/trade.
- **Key state:** `mapping(address => CompanyRecord)` with KYC status, country, allowance type, frozen flag.
- **Key functions:** `register(address, CompanyRecord)` (regulator-only), `freeze(address)`, `unfreeze`, `isVerified(address) → bool`.
- **Key events:** `CompanyRegistered`, `CompanyFrozen`, `CompanyUnfrozen`.

#### `CarbonDEX.sol`
- **Standard:** Custom constant-product AMM (Uniswap V2-style `x*y=k` math, written fresh in Solidity 0.8.x). Single pool: `EURS ↔ CarbonCredit`. Updated 2026-05-09 — see §3 row 1 for rationale (avoids V2's 0.5.16 multi-version compile pain).
- **Modification 1:** every `swap` and `addLiquidity` checks `ComplianceRegistry.isVerified(msg.sender)`. Non-whitelisted reverts with custom error.
- **Modification 2:** `emergencyPause()` gated to `Regulator` address — when triggered, swaps revert until unpaused.
- **Key events:** `Swap`, `LiquidityAdded`, `LiquidityRemoved`, `Paused`, `Unpaused`.

#### `Regulator.sol`
- **Purpose:** the authority contract. Holds the regulator's powers; in production these would be split across roles, for the demo a single contract.
- **Powers:** issue allowances (executes scheduled allocation events — pre-computed upstream from sector benchmark × historical activity; on-chain primitive is `CarbonCredit.mint`; **not** a discretionary act), freeze a company (via `ComplianceRegistry.freeze`), pause the DEX, audit (read-only — emits events for every supervised action).
- **Cannot:** trade on the DEX, take fees, front-run, redirect transfers.
- **Key events:** `RegulatoryAction(actionType, target, reason, timestamp)` — single audit-log stream.

#### `Retirement.sol`
- **Purpose:** burning credits and emitting permanent, immutable proof-of-offset.
- **Key function:** `retire(amount, beneficiary, reasonURI)` — calls `CarbonCredit.burnFrom(msg.sender, amount)`; emits a permanent `Retired` event with off-chain reason URI (e.g. corporate sustainability report). `beneficiary` identifies whose emissions the surrender covers (often `msg.sender`, but allows third-party retirement on behalf of a beneficiary).
- **Key event:** `Retired(from, amount, beneficiary, reasonURI, timestamp)` — the proof companies cite in disclosures. Vintage isn't re-recorded here; under within-Phase fungibility, retirement isn't tied to a specific vintage. Vintage attribution can be reconstructed off-chain by aggregating `CreditMinted` events for the relevant compliance period.

#### `EURS.sol`
- **Purpose:** mock settlement currency for the demo.
- **Standard:** plain ERC-20.
- **Mint pattern:** anyone can mint to themselves up to a cap (faucet-style for demo). Production = real EUR stablecoin (EURC).

### Frontend — three views, one app

```
/company    — Connect wallet → see KYC status → trade EURS↔credits → view portfolio → retire credits
/regulator  — Mint form, KYC management, live trade feed, freeze button, full audit log
/public     — Market depth, all trades, all retirements, regulator action log (read-only)
```

Every action shows: tx hash, Sourcify-verified contract badge, plain-English description, ENS name where applicable.

**Canonical architecture diagram (Lin):** a single self-explanatory three-role diagram — Company A ↔ DEX ↔ Company B with the Regulator overhead (arrows for `mint`, `pause`, `audit`) and the retirement burn flowing out. Lives in the public view header, the pitch slide, and on screen during the live demo. The visual anchor judges should be able to redraw from memory after the presentation.

---

## 5. The demo flow — happy path (primary, 3 beats)

Spine of the live demo. Three screens on stage (`/company`, `/regulator`, `/public`). **Updated 2026-05-09 — single-actor narrative.** Company A (`cement-mainz.verified-entity.eth`) is the protagonist on `/company` for the entire flow. Company B (`aluminium-bratislava.verified-entity.eth`) exists on-chain as the unseen counterparty in Beat 2 — never appears in any UI. This collapses to one Company laptop, no role-switching, full-lifecycle storytelling.

The narrative is *"an efficient cement producer received their free allocation, sold their surplus on the secondary market, and retired the rest against verified emissions."* That's exactly what cap-and-trade is designed to incentivise.

1. **Issuance event executes.** The 2026 free-allocation event fires (pre-computed from sector benchmark × historical activity). Company A receives 1,000 EUAs from the EU ETS Authority — vintage 2026, sector Industry, origin DE; metadata travels on the `CreditMinted` event. Sourcify-verified contract addresses visible. `/company` balance, `/regulator` scheduled-events panel + audit log, and `/public` total supply all update.
2. **Trade.** Company A — an efficient operator with surplus allowances — sells 200 EUAs on the DEX, receiving ~13,422 EURS at €70 spot price. Company B (`aluminium-bratislava.eth`, off-stage) buys those 200 from the pool, paying ~13,503 EURS (~€80 spread = LP fee, accruing to liquidity providers — banks/prop firms in production; deployer in this demo). Trade streams to the regulator dashboard with provenance arrows; public ticker and price chart tick. The Company A view shows their sale receipt; B's purchase appears only as a /public ticker tick.
3. **Surrender.** Company A calls `retire(800, companyA, reasonURI)` — surrenders all 800 remaining EUAs against verified emissions. Burned forever. Permanent retirement certificate issued (copyable URL for sustainability disclosure). Of the 1,000 EUAs Company A received, 200 went to the secondary market and 800 were destroyed — Company A's wallet ends at zero.

**Closing visual:** the cap-accounting widget on `/public` shows supply has actually contracted — `1,000 issued · 800 retired · 200 still in circulation` (those 200 sit in B's wallet, off-stage). Make this the final shot — it's the *"this actually does what cap-and-trade is supposed to do"* moment. **80% supply contraction** in a single compliance cycle is a much sharper visual than the previous 20%-buyer-only flow it replaces.

Detailed three-screen choreography with narration timing lives in `design/happy-flow.md`. (Note: that file still references the older two-actor flow and will be cleaned up later — UI was already built against the single-actor narrative; this section is the source of truth for the demo.)

---

## 5b. Demo alternate — freeze flow (drama version)

For runs where we want regulator enforcement as the climax. Insert two beats between Beat 2 (trade) and Beat 3 (surrender):

- **2.5 Flag.** Regulator's review surfaces a sanctions-exposure / fraud pattern on Company A. Regulator calls `ComplianceRegistry.freeze(companyA)`. Audit log: `FREEZE` entry.
- **2.75 Block.** Company A attempts the surrender transaction — reverts on-chain (`CC_SenderNotVerified`). Visible on `/company` as a failed-transaction toast and on `/regulator` + `/public` audit log.

Resume Beat 3 against an unfrozen state (regulator unfreezes after investigation) or end the demo at Block — narrator's choice. Updated 2026-05-09 — target is now Company A (since they're our on-screen protagonist), preserving the visual "the regulator stops the protagonist's next move."

> **Why the freeze is prospective, not mid-flight:** EVM trades are atomic — there is no in-flight window. The freeze stops *future* trades. This is *more faithful* to real EU ETS, not less: per `research/eu-ets-reality-check.md` §1, the Union Registry has **no transfer-reversal primitive** even after the 2010-11 phishing thefts (the Commission suspended *future* spot trading EU-wide for ~10 days rather than rollback). Reg. 2019/1122 Art. 30 lets national administrators suspend account access for up to 4 weeks — that's our `freeze`. Forward-only is the regulator's actual toolkit.

> **Sanctions narration caveat:** research found no public evidence of a discrete EU action specifically freezing named Russian operator accounts in 2022. The actual mechanic is automatic application of sanctions regulations (Council Reg. 2022/328 onwards) to any Union Registry holdings of listed entities, executed by national administrators. Don't assert *"the regulator froze Russian operators"* without that qualifier — prefer *"EU sanctions regulations automatically freeze sanctioned holdings."*

**Trade-off:** adds ~60s and one transition. Use when the regulator-as-first-class-participant differentiator is the harder sell.

---

## 6. Toolchain

| Layer | Choice | Notes |
|---|---|---|
| Contract dev | **Foundry** (`forge`, `anvil`, `cast`) | Native fuzz testing. Install at kickoff. |
| Frontend | **Next.js (App Router) + viem** | viem replaces ethers.js |
| Contract verification | **Sourcify** | In scope — story-coherent + prize |
| Identity | **ENS** | In scope — makes demo readable + prize |
| Chain (live demo) | **Decide during build (Fredrik + Parth)** | Recommendation: Base Sepolia |
| Wallet | **Decide when frontend dev starts** | RainbowKit (classic) vs Privy (email login) |
| Hosting (frontend demo) | Vercel | Standard |

---

## 7. Day plan (granularity = days, not hours)

| Phase | Goal |
|---|---|
| **Day 1 (today)** | Scope locked. Distribute brief. Foundry installed. Repo scaffolds (Foundry + Next.js). Frontend wireframes drafted. File-level contract scaffolds with empty function bodies and event signatures. |
| **Day 2 (build)** | Contracts implemented + tested locally. DEX functional on anvil. Frontend connected. Sourcify verification. ENS names registered for demo accounts. Demo runs end-to-end on local. |
| **Day 3 (polish + ship)** | Testnet deploy. Demo rehearsal. Pitch finalised. Submission written. |

Stretch features (Account Abstraction, Apify live price feed) only revisited if Day 3 morning is calm.

---

## 8. Team

| Person | Role-in-real-life | Likely contribution |
|---|---|---|
| **Fredrik** | Team lead, Claude manager | Direction, contracts oversight via Claude Code, integration glue. Does not write code himself. |
| **Parth** | CS major | Dev — contracts and/or frontend implementation |
| **Nahin** | Business | Pitch, narrative, regulatory framing, judge Q&A prep |
| **Lin** | UI/UX | Wireframes, visual design, demo staging |
| *(virtual)* | Claude Code | Contract drafting, frontend code, this doc, pitch drafts |

Specific role split (who owns which contracts, who writes which view) deferred to first team call.

---

## 9. Prize stack

Targeting these naturally; not optimising for any single one. Building the core well = most of these fall out.

| Prize / track | Amount | In scope? |
|---|---|---|
| Network Economy | $2,500 | Earned by core build |
| Future Society | $2,500 | Earned by core build |
| Sourcify | $4,000 | **Yes** — verify all contracts, badge in UI |
| ENS | up to $4,000 | **Yes** — subdomain scheme: `eu-ets-authority.eth` for the regulator, `verified-entity.eth` as the institutional namespace, `cement-mainz.verified-entity.eth` / `aluminium-bratislava.verified-entity.eth` for verified companies. |
| Best UX Flow | $500 | Stretch (account abstraction) |
| Best Privacy by Design | $500 | Skipped V1 (would need zk) |
| Apify | $3,700 | Stretch (live ETS price feed) |

---

## 10. Competitive landscape — for Q&A backup

Don't re-discover this. Team should be familiar enough to handle judge Q&A:

- **Toucan Protocol** (2021) — bridged Verra credits. Killed by Verra's May 2022 ban on tokenizing retired credits.
- **KlimaDAO** (2021) — OHM-fork bonded against carbon. Token down ~99%.
- **MOSS, C3, Flowcarbon, Senken** — variants. Some defunct, some pivoted away from crypto.
- **JPMorgan Project Carbon, MSCI, EEX, ACX** — TradFi tokenization explorations. Permissioned ledgers, not DEXes, no regulator-as-participant design.

Standard rebuttal: *"They bridged voluntary credits, permissionless, no regulator. We target compliance carbon, which requires KYC and regulator oversight, and a completely different contract architecture. They architecturally cannot enter this market."*

---

## 11. Resolved trade-offs

All §11 architecture-open items from the previous draft are now resolved:

| Item | Resolution |
|---|---|
| Permission model | **Hard whitelist** — only verified addresses can hold or trade |
| Sourcify integration | **In scope** — story-coherent (regulator needs verifiable contracts) and high-value prize |
| ENS integration | **In scope** — subdomain scheme: regulator owns `verified-entity.eth` and issues subdomains (`cement-mainz.verified-entity.eth`) to verified companies; regulator itself uses bare `eu-ets-authority.eth`. Bonus: institutional structure visible on-chain — judges can tell at a glance which addresses are verified entities just from the ENS name. |
| Account Abstraction | **Stretch only** — small prize, demo-fragility risk if half-shipped, wallet popups acceptable for crypto-native judges |
| Apify (live ETS price feed) | **Stretch only** — purely cosmetic; dashboard number that doesn't change demo's emotional shape; live API call adds failure surface |
| Chain for live demo | Decide during build (Fredrik + Parth) — recommendation Base Sepolia |
| Wallet integration | Decide when frontend dev starts — RainbowKit if classic, Privy if pursuing UX prize |

---

## 12. What's locked, what's open

| Locked | Still open (resolved later in build) |
|---|---|
| Project thesis + tagline | Pitch script |
| 5 architectural decisions (§3) | Judge Q&A |
| Contract spec (file-level, §4) | Cut-list (depends on Day 2 progress) |
| 5-step demo flow (§5) | Final role split |
| Toolchain core (Foundry, viem, Next.js, Sourcify, ENS) | Chain choice |
| Repo layout | Wallet UX choice |
| Day-level day plan (§7) | Stretch decisions (AA, Apify) |
| ENS + Sourcify in scope |  |
| AA + Apify in stretch |  |

---

## 13. First actions when team is together

1. Everyone reads this doc.
2. Confirm or push back on §3 locked decisions and §11 resolutions.
3. Pick rough role split (who's most comfortable doing what).
4. Install Foundry on whoever's machine writes contracts (Fredrik's, with Claude Code).
5. Scaffold the empty repo structure (`forge init`, Next.js init).
6. Lin starts wireframes for the three views.
7. Nahin starts MiCA/MiFID one-pager + reads competitive landscape.
8. End of Day 1: file-level scaffolds for all six contracts, all three frontend views, wireframes locked.

---

## 14. Presentation guidance (apply at pitch + demo polish, not now)

Audit of Lin & Nahin's `ethprague_presentation_takeaways.md` (synthesised from 15 past ETHRes/ETHPrague winner one-pagers) surfaced these items. **None block building.** Apply when we draft the pitch deck and demo narration on Day 3.

### Tagline polish
Current: *"Carbon trading where the regulator is a first-class participant, not a hostile force."*
Polish (Day 3): prepend "**first**" — *"the first DEX where the regulator is a first-class on-chain participant"* — makes the claim falsifiable, which judges respond to.

### Pitch structure (4-part spine)
Open with: *"Compliance carbon is a €800B/yr market. None of it trades on-chain. Here's why, and here's what we built."* Then:
1. **Problem** — opaque trading, regulators audit with spreadsheets after the fact
2. **Gap** — Toucan/Klima failed in voluntary; nobody touched compliance because permissionless ≠ regulator-friendly
3. **Solution** — Carbon DEX with regulator as first-class on-chain participant
4. **Proof** — live demo

### Demo narration
Default to **happy flow** (§5): three beats — issuance → trade → surrender. Use §5b's freeze flow inserts only when the venue calls for the regulator-power emphasis. The `/regulator` dashboard is visible throughout all three beats, not as a separate "regulator sees provenance" step — the provenance arrow that lights up during Beat 2 (trade) is the regulator-sees-everything moment.

### Hero action per role (for narration only)
- **Regulator:** issuance (Beat 1) is the hero action in happy flow — legitimate authority, not only enforcement. In §5b alternate, the freeze becomes the hero.
- **Company B:** surrender (Beat 3) — the offset proof. Same in both flows.
- **Company A:** receives allocation (Beat 1); no further hero action; exists as foil.

Reframes the regulator's first visible on-chain action as legitimate authority (issuance) rather than only enforcement (freeze). Doesn't change contracts — only the pitch script.

### Pre-empt the "isn't on-chain carbon dead?" objection
Add a single deck slide: *"You're thinking of the wrong market."* Show voluntary vs. compliance split. Disarm before judges raise it.

### Numbers to memorise (whoever pitches)
- EU ETS market size: **~€800B annual volume** (combined spot + derivatives — verify before pitch)
- Compliance vs voluntary: **~375× larger**
- EU-regulated companies subject to ETS: **10,000+**
- Phase 4 cap (2024): **~1.39 Gt CO₂** | Linear Reduction Factor: **4.4%/yr** | EUA price: **~€65–70** | Surrender deadline: **30 September** | Excess-emission penalty: **€100/t shortfall** (effective price ceiling)
- EEX auction cadence: **~1–1.5M EUAs/day**, Mon/Tue/Thu/Fri-DE
- Demo facts (happy flow): **1,000 EUAs issued to Company A · 200 sold on DEX (~13,422 EURS) · 800 retired · 200 still in circulation** (§5b adds 1 live freeze)

### "What we punted" slide
Honest scope acknowledgement builds credibility. List: real EU registry oracle, production-grade KYC, zk-privacy on trades, account abstraction, real fiat on/off-ramp, MiCA compliance audit.

### ENS framing for Q&A
Takeaway #12 warns against bolt-on bounty features. Pre-prepared answer if a judge asks about ENS being a prize-grab: *"Institutional identity for institutional roles. The regulator and verified emitters need legible identities — `eu-ets-authority.eth` is a primitive that ENS makes natural. Not a bolt-on; it's the addressing layer for the compliance market."*

### Derivatives Q&A
*"What about futures and options?"* — *"Spot only in V1. Real EU ETS is dominated by derivatives — futures and options on EEX and ICE Endex run roughly 10–15× spot volume — and the legitimate uses (hedging, capital planning, liquidity) are real. Adding a perpetual or fixed-date forward on top of our spot DEX is mechanical, not architectural — it's the natural next layer. EU ETS itself developed in that order: spot launched 2005, derivatives matured afterward. We chose not to make a speculative market our V1 contribution."*

### Regulator-MEV Q&A
*"Isn't an on-chain regulator just MEV?"* — *"No, and the architecture is more faithful to real EU ETS than the question assumes. Our regulator has mint, freeze, and audit powers — never trade, take fees, or reorder transactions. EVM atomicity means no mid-flight intercept window; freezes are forward-only. That matches real EU ETS enforcement exactly: Reg. 2019/1122 Art. 30 lets national administrators suspend account access for up to 4 weeks, but the Union Registry has no transfer-reversal primitive. Even after the 2010-11 phishing thefts (~€7M of EUAs stolen), the Commission suspended *future* spot trading EU-wide for ~10 days rather than rollback. Forward-only freeze is the regulator's actual toolkit — we matched it deliberately."* (Source: `research/eu-ets-reality-check.md` §1.)

### Bridge / "how do EUAs get on-chain?" Q&A
*"How do real EUAs get into your DEX? You can't just mint EU regulatory instruments."* — *"Correct — that's the bridge problem, and we name it explicitly. v1 production runs through a licensed custodian under MiCA + the EU's DLT Pilot Regime: real EUAs sit in the custodian's Union Registry account; 1:1 backed tokens flow through our contracts (the wBTC pattern, well-precedented). v2 — 1–5 year arc — the Union Registry itself migrates on-chain and the bridge goes away. The trading + surrender + supervision logic in our contracts is the same regardless of which model is upstream. For the demo, `Regulator.mint()` collapses both — we don't pretend native issuance exists today, but the on-chain layer is real and reusable."* (See §3.5 for the full v1/v2/v3 roadmap.)

### Aesthetic
Institutional / Scandinavian-industrial. No crypto-kitsch, no gradients, no marketing language. Judges from TradFi or policy backgrounds respond to clean, sparse, structured design — the brief already aligns Lin to this.

### Multi-prize coherence
Don't pad the pitch with bolt-on bounty justifications. Sourcify is story-coherent (regulator-needs-verifiable-contracts) and ENS is defensible (above). Don't add anything else for prize-chasing — takeaway #12 explicitly warns against it.

*Source: `ethprague_presentation_takeaways.md` at repo root.*
