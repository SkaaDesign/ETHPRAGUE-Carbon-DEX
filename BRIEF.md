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
| 1 | Exchange model | **AMM (Uniswap V2 fork)** |
| 2 | Market segment | **B2B compliance** |
| 3 | Settlement currency | **Mock EUR ERC-20 token, name `EURS`** |
| 4 | Regulator simulated as | **Generic "EU ETS Authority"** |
| 5 | Permission model | **Hard whitelist** — only addresses in `ComplianceRegistry` can hold or trade credits |
| 6 | Carbon credit token standard | **ERC-20** — single fungible token. Updated 2026-05-09 (was ERC-1155). Composes natively with the V2 fork; matches real EU ETS within-Phase fungibility. Vintage / sector / origin metadata moves to issuance and retirement event payloads. |

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
- **Why ERC-20 not ERC-1155:** the V2 fork only handles ERC-20 pairs natively; ERC-1155 would force a per-id wrapper or a non-V2 AMM. Real EU ETS treats EUAs as fungible commodities within a phase (a 2024 EUA satisfies a 2026 surrender obligation — banking is unrestricted intra-Phase 4). Modelling them as separate token ids over-segregates what is fungible by law.
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
- **Standard:** Uniswap V2 fork, single pool: `EURS ↔ CarbonCredit`.
- **Modification 1:** every `swap` and `addLiquidity` checks `ComplianceRegistry.isVerified(msg.sender)`. Non-whitelisted reverts with custom error.
- **Modification 2:** `emergencyPause()` gated to `Regulator` address — when triggered, swaps revert until unpaused.
- **Key events:** `Swap`, `LiquidityAdded`, `LiquidityRemoved`, `Paused`, `Unpaused`.

#### `Regulator.sol`
- **Purpose:** the authority contract. Holds the regulator's powers; in production these would be split across roles, for the demo a single contract.
- **Powers:** mint credits (calls `CarbonCredit.mint`), pause DEX, blacklist a company, audit (read-only — emits events for every supervised action).
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

## 5. The demo flow (locked — 5 steps)

Spine of the project. Everything we build serves this.

1. **Regulator mints 1,000 carbon credits to Company A** (verified emitter). Sourcify-verified contract address shown on screen.
2. **Company B swaps EURS for credits** on the DEX. Trade appears in the regulator dashboard in real time.
3. **Regulator sees full provenance** — who, what, when, on-chain.
4. **Regulator's review flags Company B** (suspected sanctions exposure or fraud pattern). Regulator calls `freeze(companyB)` on `ComplianceRegistry`. **Company B's next swap attempt reverts on-chain — frozen.** Live freeze visible on stage as the failed transaction.
5. **Company B retires the credit.** Burned forever. Permanent on-chain offset proof displayed.

Three laptops on stage = three roles. Regulator wields the freeze button live.

> **Why the freeze is prospective, not mid-flight:** EVM trades are atomic — a swap completes in a single transaction with no in-flight window in which to intercept. The regulator's freeze therefore stops *future* trades by Company B (and similarly, the DEX-wide `pause()` stops future trades by anyone). It does not unwind a confirmed trade. This matches how compliance-market enforcement actually works: investigations and freezes are post-hoc, applied to subsequent activity. Whether real EU ETS administrators have additional mid-flight powers in the centralized Union Registry is a separate research question (see HANDOFF §8) — our contracts are mechanically post-hoc by EVM design.

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
| **Fredrik** | TwinCurrent founder, Claude manager | Direction, contracts oversight via Claude Code, integration glue. Does not write code himself. |
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
| ENS | up to $4,000 | **Yes** — `eu-ets-authority.eth`, `company-a.eth`, etc. |
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
| ENS integration | **In scope** — bonus reason: makes the demo readable on stage (`eu-ets-authority.eth froze company-b.eth's trade` >>> raw hex) |
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

### Demo narration (4 beats, not 5)
Mint → trade → freeze → retire. The "regulator sees provenance" beat from §5 collapses into the trade beat — the regulator dashboard is shown *during* the trade, not as a separate step. Tighter, no time lost.

### Hero action per role (for narration only)
- **Regulator:** freeze (the climax)
- **Company B:** retire (the offset proof)
- **Company A:** seller — no hero action; exists as foil

Mint becomes setup, not hero. Doesn't change contracts or demo flow — only the pitch script.

### Pre-empt the "isn't on-chain carbon dead?" objection
Add a single deck slide: *"You're thinking of the wrong market."* Show voluntary vs. compliance split. Disarm before judges raise it.

### Numbers to memorise (whoever pitches)
- EU ETS market size: **~€800B annual volume**
- Compliance vs voluntary: **~375× larger**
- EU-regulated companies subject to ETS: **10,000+**
- Demo facts: 1,000 credits minted, 1 trade, 1 retirement, 1 live freeze

### "What we punted" slide
Honest scope acknowledgement builds credibility. List: real EU registry oracle, production-grade KYC, zk-privacy on trades, account abstraction, real fiat on/off-ramp, MiCA compliance audit.

### ENS framing for Q&A
Takeaway #12 warns against bolt-on bounty features. Pre-prepared answer if a judge asks about ENS being a prize-grab: *"Institutional identity for institutional roles. The regulator and verified emitters need legible identities — `eu-ets-authority.eth` is a primitive that ENS makes natural. Not a bolt-on; it's the addressing layer for the compliance market."*

### Derivatives Q&A
*"What about futures and options?"* — *"Spot only in V1. Real EU ETS is dominated by derivatives — futures and options on EEX and ICE Endex run roughly 10–15× spot volume — and the legitimate uses (hedging, capital planning, liquidity) are real. Adding a perpetual or fixed-date forward on top of our spot DEX is mechanical, not architectural — it's the natural next layer. EU ETS itself developed in that order: spot launched 2005, derivatives matured afterward. We chose not to make a speculative market our V1 contribution."*

### Regulator-MEV Q&A
**Deferred until research is done** (HANDOFF §8). Our contracts are post-hoc by EVM design — there is no mempool-watching primitive, no front-run hook, no transaction-ordering capability. The framing of *whether this is faithful to real EU ETS or a deliberate divergence* depends on what powers the Union Registry administrators actually have. Don't lock pitch language for this Q&A entry until that's known.

### Aesthetic
Institutional / Scandinavian-industrial. No crypto-kitsch, no gradients, no marketing language. Judges from TradFi or policy backgrounds respond to clean, sparse, structured design — the brief already aligns Lin to this.

### Multi-prize coherence
Don't pad the pitch with bolt-on bounty justifications. Sourcify is story-coherent (regulator-needs-verifiable-contracts) and ENS is defensible (above). Don't add anything else for prize-chasing — takeaway #12 explicitly warns against it.

*Source: `ethprague_presentation_takeaways.md` at repo root.*
