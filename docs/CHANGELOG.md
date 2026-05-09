# Changelog

Plain-English log of scope and infrastructure changes since the locked baseline. Maintained so the team (Parth, Nahin, Lin) can see what shifted between sessions without diffing git.

**Tagged checkpoints**
- `scope-v1` → commit `d33d5a9` (2026-05-08) — original locked scope. Always available as a clean reference.

---

## In flight

- **Deploy.s.sol** — single Foundry script that deploys all 6 contracts in order, wires the role grants (DEX → registry, MINTER/BURNER on CarbonCredit, REGULATOR on registry, PAUSER on DEX, OPERATOR on Regulator), pre-seeds Company A + Company B + DEX in the registry, and seeds initial liquidity. Mirrors the deploy-time wiring assumed by every test's setUp().
- **End-to-end happy-flow script** — `Demo.s.sol` runs BRIEF §5 against a local anvil (issue → swap → retire) so Lin's UI work has a live chain to point at.
- **Branch reconciliation:** `docs/scope-update` carries 11 commits of scope work + 6 contracts. `origin/main` carries Parth's contracts (`c40abad`, `995fad9`). PR `docs/scope-update` → `main` reconciles when ready.
- **Frontend scaffold:** Next.js + viem init in `web/` not yet started.

---

## 2026-05-09 (evening) — All 6 contracts implemented + tested

**Branch:** `docs/scope-update`. Six commits, contract-by-contract — `76fab3d`, `e25aad9`, `810b409`, `34c2891`, `90edc00`, plus this one.

### Summary

| Contract | What it is | Tests | Commit |
|---|---|---|---|
| `EURS` | Mock EUR ERC-20 with faucet (settlement currency) | 5 | `76fab3d` |
| `ComplianceRegistry` | KYC whitelist + freeze flag (Reg. 2019/1122 Art. 30 analogue) | 12 | `e25aad9` |
| `CarbonCredit` | EUA token (ERC-20 + role-gated mint/burn + transfer whitelist hooks) | 12 | `810b409` |
| `Retirement` | Surrender interface (calls CarbonCredit.burnFrom + emits Retired event) | 7 | `34c2891` |
| `CarbonDEX` | Custom CPMM, x*y=k math + whitelist + pause | 12 | `90edc00` |
| `Regulator` | Orchestrator: holds privileged roles on the other 3 + audit-log event stream | 10 | this commit |
| **Total** | | **58** | |

All 58 tests pass in ~11ms on anvil. CPMM invariant test (`test_Swap_PreservesKInvariantUpToFee`) confirms `k` only grows or stays constant after every swap — the canonical AMM correctness check.

### Deploy-time wiring (for the next commit's Deploy.s.sol)

Each contract has explicit role grants required at deploy:

- **ComplianceRegistry** — register DEX address as Trader (so DEX can hold CarbonCredit, since CC's transfers are whitelist-gated)
- **CarbonCredit.MINTER_ROLE** → Regulator contract
- **CarbonCredit.BURNER_ROLE** → Retirement contract
- **ComplianceRegistry.REGULATOR_ROLE** → Regulator contract
- **CarbonDEX.PAUSER_ROLE** → Regulator contract
- **Regulator.OPERATOR_ROLE** → operator wallet (the EU ETS Authority signer that clicks buttons)

Test setUp() in every suite demonstrates the pattern; Deploy.s.sol will codify it for testnet.

### Stack-level sanity checks (passed)

- ERC-20 transfers blocked when sender or recipient is unverified (CC tests)
- ERC-20 transfers blocked when either side is frozen (CC tests)
- DEX swaps blocked when caller unverified or DEX paused (DEX tests)
- DEX swaps preserve x*y=k invariant within fee tolerance (DEX test)
- Retirement burns from msg.sender even when called via beneficiary != msg.sender (Retirement test)
- Regulator's full happy-flow path (register → issue) executes end-to-end (Regulator test_HappyFlow)

---

## 2026-05-09 (later) — OpenZeppelin install + AMM architecture decision

**Branch:** `docs/scope-update`. Two commits: `0bde70b` (OZ install) + this one (BRIEF update + CHANGELOG).

### For Parth (dev)

- **OpenZeppelin v5.6.1** installed as git submodule at `contracts/lib/openzeppelin-contracts/`. Pinned to a clean release tag (Solidity ^0.8.20). Imports in our contracts will look like `import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";`. Configured `ignore = dirty` in `.gitmodules` for OZ — its repo has nested submodules (their own dev-time test deps) we deliberately don't init since we only import from `contracts/`.
- **AMM architecture: custom CPMM, NOT Uniswap V2 fork.** BRIEF §3 row 1 + §4 `CarbonDEX.sol` updated. Same constant-product math (`x*y=k`); written fresh in Solidity 0.8.x rather than installing V2's 0.5.16 codebase + juggling multi-version compilation. Whitelist + pause hooks integrate cleanly as Solidity modifiers. **No Uniswap dependency installed** — `CarbonDEX.sol` will be ~150 LOC of our own code, tested against reference V2 outputs to verify the math.
- **Pitch line for "is this Uniswap V2?"** — *"same `x*y=k` math, written in modern Solidity. V2 itself is on 0.5.16 which doesn't compose with our 0.8.x stack — porting was higher-risk than writing the formula directly."*

### Repo plumbing

- **No new dependencies beyond OZ** for the AMM. Custom CPMM lives in our own code.

---

## 2026-05-09 (afternoon) — Foundry scaffold + docs reshuffle

**Branch:** `docs/scope-update`. One commit covering both.

### For Parth (dev)

- **`contracts/` scaffolded** via `forge init --no-git`. Empty `src/`, `test/`, `script/` ready for our six contracts. Dev loop is `forge build` → `forge test` against anvil (Foundry's instant local EVM simulator — milliseconds per test).
- **forge-std submodule** properly tracked at the parent repo level (`.gitmodules` at repo root, not inside `contracts/`). When cloning fresh: `git submodule update --init --recursive` to fetch dep code into `contracts/lib/forge-std/`.
- **`.gitignore` updated:** `contracts/lib/` is no longer ignored — Foundry deps live there as git submodules, which require tracking via `.gitmodules`. Build artefacts (`out/`, `cache/`, `broadcast/`, `.foundry/`) stay ignored. Comment in `.gitignore` explains.
- **`forge init` gotcha logged** in `docs/fredrik/learned.md`: by default `forge init` creates a nested `.git/`, which orphans the submodule from the parent repo's view. Fix: `forge init --no-git`, then add forge-std as a submodule from the parent repo root.
- **Counter.sol boilerplate removed** from `src/`, `test/`, `script/`.

### For Lin (UI / demo staging)

- **No content changes.** `design/happy-flow.md` moved to `docs/design/happy-flow.md`.

### For Nahin (pitch / Q&A)

- **No content changes.** `BRIEF.md`, `HANDOFF.md`, `ethprague_presentation_takeaways.md`, `research/eu-ets-reality-check.md` all moved into `docs/`. Same content, new paths.

### Repo plumbing

- **All docs reshuffled into `docs/`** to declutter root. Root now: `README.md` (tiny pointer), `contracts/`, `docs/`. The README at root links into `docs/` for GitHub landing-page discoverability.
- **`docs/fredrik/`** is gitignored (Fredrik's personal learning trail; not for the team).
- **`BUILD-STATUS.md`** now at `docs/BUILD-STATUS.md`. Tracks the build punchlist; flip ❌ → ✅ as items land.

---

## 2026-05-09 — Research, ERC-20 pivot, happy-flow demo, bridge framing

**Branch:** `docs/scope-update`. Six commits (`f11938a` … `6eb278b`).

### For Nahin (pitch / Q&A)

- **`research/eu-ets-reality-check.md`** landed. Six-question primary-source brief on EU ETS regulator behaviour. Cites EUR-Lex (2003/87/EC, 2019/1122, 2010/23/EU), Europol, Commission climate.ec.europa.eu. Use for judge Q&A defensibility on national administrator powers, 2010 VAT carousel fraud, 2022 Russian-linked freeze (low-medium confidence — public reporting thin), institutional tokenisation sketches (JPM Kinexys / CIX / ACX / Carbonplace), MiFID II venue requirements, Union Registry architecture.
- **BRIEF §14 Regulator-MEV Q&A** — deferred stub replaced with the actual answer. Forward-only freeze is *more* faithful to real EU ETS, not less; cites Reg. 2019/1122 Art. 30 + the 2010-11 phishing precedent (Commission suspended *future* trading rather than reverse settled transfers).
- **BRIEF §14 Bridge Q&A (new)** — pre-empts *"how do real EUAs get on-chain?"* with the v1 wrapped / v2 native / v3 auction roadmap.
- **BRIEF §14 Demo narration / Hero action / Numbers updated** for happy-flow primary. Regulator's hero action reframes from freeze → **issuance** (Beat 1). Numbers section gains research-backed Phase 4 figures: cap ~1.39 Gt, LRF 4.4%/yr, EUA price ~€65–70, surrender deadline 30 Sept, €100/t penalty, EEX cadence ~1–1.5M EUAs/day. **The €800B market-size figure is flagged for verification before pitch** — research didn't pin it.
- **Sanctions narration caveat:** research found no public evidence of a discrete EU action specifically freezing named Russian operator accounts in 2022; mechanic is automatic application of sanctions regulations (Council Reg. 2022/328) executed by national administrators. **Don't assert "the regulator froze Russian operators"** — say "EU sanctions regulations automatically freeze sanctioned holdings."

### For Lin (UI / demo staging)

- **`design/happy-flow.md`** added — self-contained design spec for the live demo. Three beats × three screens (`/company`, `/regulator`, `/public`) with cast in ENS, design-system constraints (Scandinavian / institutional, IBM Plex + Fraunces, no crypto-kitsch), token-model note, what's-NOT-in-this-demo list, and open design questions for your judgement.
- **BRIEF §5 rewritten as happy flow** (3 beats — issuance, trade, surrender). **Freeze flow preserved as §5b alternate.** Closing visual: cap-accounting widget on `/public` showing `1,000 issued · 200 retired · 800 in circulation`.
- **Government-flavoured framing for the regulator UI:** issuance is *not* a discretionary action button — it's a **calendar-driven process**. Two distinct panels on `/regulator`: a **Scheduled allocation events panel** (pre-computed entries with status `SCHEDULED → CONFIRMED → EXECUTED`; the regulator clicks `Execute` to fire the year's allocation) and an **Authority controls panel** (discretionary powers only: freeze, unfreeze, pause). A regulator who could mint allowances on a whim would be ultra vires; we model real-world separation. User-facing language drops "mint" in favour of "issuance" / "issuance event"; the contract primitive stays `CarbonCredit.mint`.
- Decisions in `design/happy-flow.md §10` are firm; everything else is open to design judgement.

### For Parth (dev)

- **`CarbonCredit` pivots from ERC-1155 → ERC-20.** Two reasons: (1) the V2 fork doesn't compose with ERC-1155 natively — would have forced a per-id wrapper or non-V2 AMM; (2) real EU ETS treats EUAs as fungible within a Phase (a 2024 EUA satisfies a 2026 surrender). Vintage / sector / origin / methodology metadata moves to event payloads on `CreditMinted` and `CreditRetired`. Provenance still recoverable from event logs.
- **`Retirement.retire()` signature changed** — drops `tokenId` param. New: `retire(amount, beneficiary, reasonURI)`.
- **Heads-up on reconciliation:** if your contracts on `origin/main` already implement ERC-1155, they need adjustment when this branch merges into `main`.
- **BRIEF §3.5 (new)** pins where Carbon DEX sits — secondary market settlement layer, **not** registry replacement. Same contracts compose across the v1 wrapped / v2 native / v3 auction roadmap.

### Repo plumbing

- **New branch `docs/scope-update`** carries today's work. Local `main` (with `ef5aacc` CHANGELOG) is 1 ahead of `origin/main`; `origin/main` is 2 ahead with Parth's contracts. PR `docs/scope-update` → `main` reconciles when ready.
- **`design/`** folder added — new lane for design handoff materials.
- **`research/`** folder added — for research artefacts.

---

## 2026-05-08 — Scope tightening + research scoping

**Commits:** `d33d5a9` (scope-v1) → `5382a7d`

### For Nahin (pitch / Q&A)

- **Demo narration changed.** BRIEF §5 step 4 was rewritten. The old wording implied the regulator stops a trade mid-flight; EVM trades are atomic, so there's no in-flight intercept window. The freeze now correctly stops Company B's *next* trade (the failed transaction is the on-stage moment), not an in-flight one. A short paragraph after the 5-step list explains the post-hoc model.
- **New Q&A — Derivatives.** BRIEF §14 has a settled answer to *"What about futures and options?"* — spot only in V1; derivatives are the natural next layer; EU ETS itself launched spot first (2005) before derivatives matured. Use this verbatim if asked.
- **New Q&A — Regulator-MEV — but explicitly deferred.** BRIEF §14 has a stub for the *"isn't an on-chain regulator just MEV?"* question, marked deferred until the §8 research lands. **Do not bake regulator-power claims into your pitch yet** — we don't yet know which powers real EU ETS administrators actually have.
- **New research task.** HANDOFF §8 lists six grounded questions (national admin powers, 2010 VAT fraud, 2022 Russian freeze, JPM/MSCI/EEX, MiFID II, Union Registry). Output → `research/eu-ets-reality-check.md`. You'll use this for judge Q&A defensibility.

### For Lin (UI / demo staging)

- **Freeze beat changed shape.** The on-stage moment is now *"Company B's next swap fails on screen with a revert"*, not a paused-mid-trade animation. Wireframes for the regulator dashboard and the demo choreography may want to reflect this — the regulator clicks freeze, then Company B's *next* transaction visibly reverts. Two beats, not one.

### For Parth (dev)

- **Foundry installed.** v1.7.1 on Fredrik's primary machine via Git Bash (the official installer is a bash script — PowerShell `iex` won't parse it). Path persisted in `~/.bashrc`. HANDOFF §5 install command was corrected accordingly.
- **Hardened `.gitignore`** — Foundry, Node/Next.js, env, editor, OS noise. **Known follow-up:** `lib/` (and a few others) need scoping to `contracts/` to avoid matching `web/lib/`. Not breaking anything until scaffolds exist.
- **Demo chain locked: Sepolia L1.** Picked over the BRIEF §6 recommendation of Base Sepolia. Rationale: native ENS (no cross-chain CCIP-Read), single client in viem, fewer moving pieces. Slow blocks (~12s) coverable with narration.
- **No code yet.** `forge init contracts/` and Next.js init in `web/` come next.

### Repo plumbing

- **`scope-v1` tag** points at `d33d5a9` — the pre-edit baseline. Use this as the canonical "what was originally locked" reference.
- **HANDOFF.md**: install command corrected; §8 added (research task spec); style cheat sheet renumbered to §9.

---

*This file is the team-readable summary. For the precise diff of any change, `git diff scope-v1..main` is authoritative.*
