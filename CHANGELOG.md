# Changelog

Plain-English log of scope and infrastructure changes since the locked baseline. Maintained so the team (Parth, Nahin, Lin) can see what shifted between sessions without diffing git.

**Tagged checkpoints**
- `scope-v1` → commit `d33d5a9` (2026-05-08) — original locked scope. Always available as a clean reference.

---

## In flight

- **`.gitignore` follow-up:** scope Foundry-side names (`lib/`, `dependencies/`, `out/`, `cache/`, `broadcast/`, `.foundry/`) to `contracts/`. Now more important — Parth's contracts live at `contracts/` on `origin/main`, and `web/lib/contracts.ts` is in BRIEF §4. Patch pending.
- **Branch reconciliation:** `docs/scope-update` (this branch) carries today's research, ERC-20 pivot, happy flow, and bridge framing. `origin/main` carries Parth's contracts (`c40abad`, `995fad9`). Eventually opens a PR `docs/scope-update` → `main` to integrate.
- **Frontend scaffold:** Next.js + viem init in `web/` not yet started.

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
