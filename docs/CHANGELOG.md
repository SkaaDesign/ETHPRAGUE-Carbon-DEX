# Changelog

Plain-English log of scope and infrastructure changes since the locked baseline. Maintained so the team (Parth, Nahin, Lin) can see what shifted between sessions without diffing git.

**Tagged checkpoints**
- `scope-v1` → commit `d33d5a9` (2026-05-08) — original locked scope. Always available as a clean reference.

---

## In flight

- **Frontend ENS strings** — `web/lib/demo-state.ts` + `web/app/company/page.tsx` + `web/app/regulator/page.tsx` still use flat names (`cement-mainz.eth` etc.). Next frontend pass should switch to subdomain scheme to match BRIEF. Not blocking the merge.
- **Sepolia onboarding** — Alchemy account + RPC URL + faucet ETH for the deployer wallet. Then `forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --verify --verifier sourcify`.
- **ENS registrations on Sepolia** — subdomain scheme: `eu-ets-authority.eth` (regulator), `verified-entity.eth` (institutional namespace), `cement-mainz.verified-entity.eth` + `aluminium-bratislava.verified-entity.eth` (verified companies). See `contracts/script/addresses.example.json`.
- **Frontend wiring to live contracts** — Happy Path UI is built against `stateAt(beat)` simulation; next step is replacing `stateAt` calls with viem event reads once Sepolia addresses land. Three routes already shape-correct — only the data source changes.
- **`docs/design/happy-flow.md` cleanup** — non-blocking. The doc still references the old two-actor flow; UI was already built against the new single-actor narrative (BRIEF §5 is the source of truth). Sync when convenient.
- **Parth ping + merge** — `docs/scope-update` → `main` PR. Will tag Parth's last commit as `parth-archive` before merge.

---

## 2026-05-10 — Pre-merge consolidation: Parth lifts + delete `my-smart-contract/`

**Branch:** `docs/scope-update`. Two commits: one for lifts, one for the deletion + merge from origin/main.

### What this is

Final pre-merge cleanup. Brings origin/main into our branch (so the eventual PR is a clean fast-forward), lifts the bits worth keeping from Parth's parallel work, deletes his `my-smart-contract/` folder so main has a single source of truth (`contracts/`).

### Lifts from Parth (written fresh, attributed)

- **`contracts/script/addresses.example.json`** — deployment-address registry template, modelled on Parth's `my-smart-contract/script/addresses.json` (commit `2e36c93`). Adds Sepolia placeholder section + an `ens.namespace` field to make the subdomain scheme explicit. Real `addresses.json` (gitignored) gets populated post-deploy.
- **ENS subdomain naming scheme** — Parth proposed `cement-mainz.verified-entity.eth` (subdomain-on-namespace) instead of bare `cement-mainz.eth`. Adopted across BRIEF (§5, §9 prize stack, §11 trade-offs), HANDOFF (§5 next-moves), CHANGELOG, and Demo.s.sol comments. Rationale: `verified-entity.eth` becomes the regulator-owned institutional namespace; subdomains are issued to verified companies on registration. Makes the institutional structure visible on-chain — judges can tell at a glance which addresses are verified entities just from the ENS name. The regulator itself stays bare: `eu-ets-authority.eth`.

### What we did NOT lift

Reviewed Parth's recent commits (parallel work since the consolidation snapshot):
- `9accc31` — converted his `CarbonCredit` from ERC-1155 → ERC-20 (matches our pivot, but his version still lacks vintage/sector/origin event metadata)
- `7e5447e` — unit tests
- `f9e6f68` + `251e52c` + `ee249a7` — local-chain seeding scripts
- `3962fb4` — retirement-contract fix

None of these supersede our 72-test version with full Regulator scope, audit-log event stream, exact-output swaps, or DA-reviewed CPMM. Our version remains canonical.

### Folder deletion

`git rm -r my-smart-contract/` — Parth's standalone Foundry project removed from the branch. After merge, main has a single contracts directory: `contracts/`. His work is preserved at the tag `parth-archive` (set at `2e36c93` — his last commit on origin/main pre-merge) so anyone can `git checkout parth-archive` to see his version.

### Frontend follow-up flagged

Frontend's `web/lib/demo-state.ts` + page.tsx files still use flat ENS names. Updating to subdomain scheme is non-blocking but should land on the next frontend pass. Note added to CHANGELOG In flight.

### Merge mechanics

Did `git merge origin/main` to bring Parth's commits onto our branch first (so the eventual PR reads as a clean fast-forward + branch deletes). Created merge commit `84bd740`. No conflicts — Parth's work was all in `my-smart-contract/`; our work was in `contracts/` + `docs/` + `web/`. Disjoint.

---

## 2026-05-09 (late night) — Frontend Happy Path screens recreated from Claude-design bundle

**Branch:** `docs/scope-update`. Forked-session team `carbon-dex-frontend` (lead + 3 builders + 1 reviewer) recreated the design from `design/source/carbon-dex/` near pixel-perfect. Eight commits across three phases.

### Team structure

| Role | Agent type | Output |
|---|---|---|
| `team-lead` | (this session) | Phase 1 foundation + Phase 3 consolidation |
| `da-reviewer` | devils-advocate | T8 review of T1+T2; PROCEED verdict, ~10 nits surfaced |
| `public-builder` | general-purpose | T4 — `/public` route |
| `regulator-builder` | general-purpose | T5 — `/regulator` route |
| `company-builder` | general-purpose | T6 — `/company` route |

### Phase 1 — Foundation (lead)

- **`design/source/carbon-dex/`** committed as repo reference (5.4 MB; the Claude-design handoff bundle including chats, project files, and reference images).
- **`web/lib/demo-state.ts`** — TypeScript port of design's `state.jsx` with the main-session resolution numbers (1,000 issued / 200 sold / 800 retired; trade proceeds 13,422 EURS at 350k/5k pool with 0.3% fee). Discriminated union for `AuditEntry` so audit-log components switch on `entry.kind`. `beatFromSearchParams()` defaults to Beat 3 (closing visual).
- **`web/app/globals.css`** — full design-token palette (~50 named tokens) ported from `happy-path/styles.css`. Two visual languages distinguished: Editorial Calm tokens (regulator + company) and EEA Editorial tokens (public observer). Audit-log kind chips, status pills, accent variants all expressed.
- **`web/app/layout.tsx`** — five Google Fonts loaded: IBM Plex Sans + IBM Plex Mono + Fraunces (Editorial Calm) and Source Sans 3 + Source Serif 4 (EEA Editorial).
- **`web/components/ui.tsx`** + **`BeatSwitcher.tsx`** — shared primitives: `EditorialShell`, `EEAShell`, `Eyebrow`, `CTAButton` (5 variants), `StatusPill` (3 kinds), `KindChip` (5 kinds), `SourcifyBadge`, `TxLink`, `EUFlag`. BeatSwitcher is the dev affordance for stepping through `?beat=0..3` on any route.

### Phase 2 — Three routes in parallel (builders)

- **`/public`** — EEA Editorial. EU-flag header, breadcrumbs, gradient hero with Source Serif h1, three-cell cap-accounting tile, segmented cap bar (cement-mainz / pool / retired), live ledger with newest-first beat-driven rows, verified-entities roster, no-wallet footer. Closing visual at Beat 3 reads `1,000 issued · 800 retired · 200 in circulation` — the cap-and-trade money shot.
- **`/regulator`** — Editorial Calm. KPI strip (4 counters), scheduled allocation events table with EXECUTED/CONFIRMED/SCHEDULED status pills, audit log with ISSUE/SWAP/RETIRE kind chips and `flash-slow` on the freshest row, compliance roster.
- **`/company`** — Editorial Calm with beat-driven content. Always-on identity tile (avatar + ENS + Verified pill) and balance with delta animations. Beat 0 awaiting tile → Beat 1 allocation receipt with copper RECEIVED toast → Beat 2 swap-settled receipt (200 EUA → 13,422 EURS) → Beat 3 retirement certificate with embossed seal, 7-row filing dl, scannable QR pattern, headline `800 EUA permanently destroyed`. Holdings strip at the bottom.

### Phase 3 — Lead consolidation

- DA nits applied: `0xD3X0…` → `0xD3C0…` (hex-correct decorative pool address); `font-feature-settings: ss01,ss02` → `calt,kern,liga` (Plex Sans doesn't expose ss01/ss02).
- Final `bun run build`: green. All routes dynamic (server-rendered on `?beat=` reads). TypeScript clean.

### One git-history quirk worth knowing

Two builder commits raced on `git add` in the shared working tree:

| Commit | Subject says | Actually contains |
|---|---|---|
| `5b4f119` | Recreate /public — EEA Editorial | `web/app/regulator/page.tsx` (regulator-builder's content) |
| `4ca8e3f` | Recreate /public — EEA Editorial *(the actual content)* | `web/app/public/page.tsx` (public-builder's content) |

Both files have correct content in HEAD; only the commit subjects are mis-paired for one of them. Documented here so the team knows when reading log.

### What's NOT yet wired

- Live contract reads — frontend uses `stateAt(beat)` simulation (port of designer's intended demo flow). Swap to viem reads when Sepolia addresses land.
- Wallet connection through-flow tested only structurally (RainbowKit ConnectButton mounts; no real signing yet).
- Beat-switcher always visible — should hide in production (small env-flag fix).

---

## 2026-05-09 (night) — Single-actor demo flow + via_ir compile

**Branch:** `docs/scope-update`. One commit covering BRIEF §5 + §5b + demo facts in §14 + both demo scripts.

### Decision: Company A is the single protagonist

Old flow (collapsed): Company A receives 1,000 → Company B buys 200 → Company B retires 200. Two-actor, role-switching laptop, 200 EUA supply contraction (20%).

New flow: Company A receives 1,000 → Company A sells 200 surplus on the DEX (Company B is the off-stage buyer) → Company A retires the remaining 800 against verified emissions. **Single protagonist on /company; B exists on-chain only.** 800 EUA supply contraction (80%).

**Why:** matches what cap-and-trade actually rewards (efficient operators net-sell, less efficient ones net-buy). Cleaner stage choreography (one Company laptop, no role switch). Bigger supply-contraction visual for the closing shot. Matches the design fork's instinct (Claude Design's UI was already built single-actor).

### What changed

- **BRIEF.md §5 — happy flow rewritten** to single-actor narrative. Beat 2 split into 2a (A sells, ~13,422 EURS in) and 2b (B buys off-stage, ~13,503 EURS out, ~80 EURS LP fee accrues). Beat 3 retires all 800 (was 200). Closing visual: `1,000 issued · 800 retired · 200 still circulating in B's wallet`.
- **BRIEF.md §5b freeze flow** updated — freeze target is now Company A (not B), since A is the on-screen protagonist. Visual stays the same: regulator clicks freeze; A's next transaction reverts.
- **BRIEF.md §14 demo facts** updated to match.
- **`script/DemoLocal.s.sol` rewritten** — Beat 2 now does both legs (A sells via `swapCreditForEURS`, B buys via `swapEURSForCreditExactOut`). Beat 3 retires `balanceOf(companyA)` (the full remaining 800). Verified end-to-end on anvil — 800 EUA destroyed, 200 left with B, A's wallet at zero.
- **`script/Demo.s.sol` (parameterised) rewritten** — same flow, multi-key signature: requires `OPERATOR_PK`, `COMPANY_A_PK`, `COMPANY_B_PK` env vars. Idempotent (safe to re-run against an existing deployment). Realistic for Sepolia where each role has its own ENS-named wallet.
- **`foundry.toml`** — added `via_ir = true` + optimizer settings. The longer DemoLocal function (4 broadcasts, more locals) tripped "stack too deep" without IR-based codegen. Compile is ~2× slower (~6s vs ~1s) but build still trivial.
- **No contract changes.** CarbonDEX bidirectional from day one — `swapCreditForEURS` already existed.

### Test status

72 tests pass, 0 regressions (no contract changes; tests untouched).

### LP / fee clarification (for the team)

The 0.3% fee on every DEX swap is the **LP fee** — it stays in the pool and increases LP-token redemption value. Compensation to liquidity providers (who supplied the EURS + EUA inventory and bear price risk). NOT a regulator/EU fee. In production: banks (BNP, Macquarie, Soc Gen, JPM) and prop trading firms (Vitol, Trafigura) would seed liquidity — same as they do today on EEX/ICE. In the demo: deployer is the only LP for operational simplicity. Pitch line: *"the regulator regulates; the banks make markets — same separation as MiFID II requires."*

### Devils-advocate review (2026-05-09 earlier today)

`devils-advocate` agent reviewed the contract stack: PROCEED verdict. 3 spec divergences found and fixed in the previous commit (`4f126c9`):
- Stale `Demo.s.sol` numbers from before the slippage tuning
- `CarbonCredit.burnFrom` missing `_spendAllowance` (matched OZ ERC20Burnable now)
- `DemoLocal.s.sol` fresh-anvil assumption now documented

CPMM math, K-invariant preservation, whitelist gating, role wiring, reserve update ordering — all validated. No demo blockers.

---

## 2026-05-09 (evening) — Frontend skeleton: routes, wallet, design tokens

**Branch:** `docs/scope-update`. Forked session, parallel with backend per `docs/frontend-parallel-plan.md`.

Layered on top of primary's bare scaffold (committed in `4f126c9`). Adds the wiring shell — three routes, wallet connect, design system — but no live contract reads yet (those come once Sepolia deploys).

### What landed

| File | Purpose |
|---|---|
| `web/app/page.tsx` | Landing page with three role-cards (Company / Regulator / Public). Replaces the create-next-app boilerplate. |
| `web/app/company/page.tsx` | Company portal route. RainbowKit `ConnectButton`. Empty connected/disconnected states; holdings + swap + retire forms slot in next. |
| `web/app/regulator/page.tsx` | EU ETS Authority route. Three-panel skeleton (scheduled allocation events, compliance roster, authority controls) + audit log row, per `docs/design/happy-flow.md §7`. **Issuance is deliberately not in authority controls** — it's in the scheduled-events panel (process, not button). |
| `web/app/public/page.tsx` | Read-only observer route. Three counter widgets (issued / retired / in circulation) ready for wiring. **No `ConnectButton`** — flagged "Wallet not required" prominently. |
| `web/app/providers.tsx` | Client-side provider tree: `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider`. RainbowKit lightTheme tuned to copper accent (`#b45309`). |
| `web/app/layout.tsx` | Root layout. Fonts: IBM Plex Sans + IBM Plex Mono + Fraunces (display) via `next/font/google`. Wraps in `<Providers>`. |
| `web/app/globals.css` | Tailwind v4 + design tokens per `design/happy-flow.md §4`: `--accent` (copper), `--success`, `--warning`, `--surface`, `--border` etc. No dark mode (institutional UIs read better in light). |
| `web/lib/wagmi.ts` | wagmi config: `foundry` (localhost:8545) + `sepolia` chains. RainbowKit `getDefaultConfig`. |
| `web/next.config.ts` | Pinned `turbopack.root` to silence the workspace-root warning. |
| `web/.env.example` | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `NEXT_PUBLIC_SEPOLIA_RPC_URL`. |
| `web/.gitignore` | One-line patch: `!.env.example` exception so the template stays tracked. |

### Stack

- **Bun** as package manager + script runner (3–10× faster than npm)
- **Next.js 16.2.6** App Router + Turbopack
- **Tailwind v4** (no config file; tokens in `globals.css` via `@theme inline`)
- **wagmi 2.x + viem 2.x + RainbowKit 2.x + @tanstack/react-query 5.x** (peer-dep aligned; bun's first-pass resolution to wagmi 3.6.11 was wrong, manually pinned to `^2`)

### Build verified

`bun run build` passes. All four routes prerender as static (`/`, `/company`, `/regulator`, `/public`). TypeScript clean. Zero warnings.

### What's intentionally absent

- **No mock data anywhere.** Per Fredrik's call: all dynamic content is empty placeholders waiting for live contract reads. Counter widgets show `—` until wired.
- **No hardcoded contract addresses.** Will live in `web/lib/contracts.ts` after Sepolia deploy.
- **No live wallet flow tested against contracts yet.** RainbowKit connect works (verified by build); reading `balanceOf` etc. comes when ABIs land.

### For Lin

The shell is up and clickable. When you import the Claude-design HTML/JSX, drop it under `web/design/source/` (or wherever you prefer); the forked session recreates pixel-perfect in the established tokens.

### For Parth

When deploying to Sepolia, surface deployed addresses + ABI references somewhere I can read — `docs/deployment-addresses.md` proposed. Forge already produces ABIs in `contracts/out/<contract>.sol/<contract>.json`; I'll lift the relevant ones into `web/lib/contracts.ts`.

---

## 2026-05-09 (later evening) — Consolidation: ours wins, lift small additions, deploy + demo working

**Branch:** `docs/scope-update`. Two commits: `665df41` (lifts) + `1cad9fd` (Deploy + DemoLocal).

### Decision: keep ours wholesale, lift specific items from Parth

After read-only review of `origin/main` `my-smart-contract/`:

- **3 of Parth's 6 contracts diverge from BRIEF in ways that block the demo:**
  - `Regulator` is ~70% under-spec (no freeze/unfreeze/pause/unpause/audit, no RegulatoryAction event stream, constructor has 4 args but only uses 2)
  - `CarbonCredit.mint(to, amount)` lacks vintage/sector/origin/issuanceRef — Beat 1 narration "vintage 2026, sector Industry, origin DE" cannot be sourced from on-chain events
  - `Retirement.retire(amount, comment)` lacks `beneficiary` parameter — design Beat 3 retirement-certificate spec breaks
- **The remaining 3 are roughly equivalent or weaker** (EURS uses lifetime faucet cap; CR uses string country vs our enum; CarbonDEX missing MIN_LIQUIDITY first-LP attack mitigation, non-standard LP-mint formula `(a+b)/2` vs canonical `min(a,b)`, no ReentrancyGuard).

Action: **use our `contracts/` (66 tests passing) as v1**; lift selectively.

### What we lifted (written fresh, not copied)

ComplianceRegistry:
- `audit(address, note)` regulator-only function + `CompanyAudited` event
- `registeredAt` and `lastAuditAt` timestamps on `CompanyRecord`

Regulator:
- `auditCompany(address, note)` wrapper + `ActionType.Audit` enum variant

CarbonDEX:
- `getReserves()` view returning both reserves in one call
- `getSpotPrice()` returning EURS-per-Credit scaled by 1e18 (display-friendly)
- `getLpBalance(address)` view (named `balanceOf` proxy for frontend clarity)

Tests: +8 covering all of the above. Total: 66/66 pass in ~19ms.

### Deploy + Demo scripts written

- `script/Deploy.s.sol` — single-tx deploy + role wiring + DEX self-registration in CR. Reads `PRIVATE_KEY` env; logs all addresses on completion. Tested against ephemeral anvil — clean run, ~8.7M gas.
- `script/DemoLocal.s.sol` — one-shot deploy + seed + 3-beat happy flow on local anvil using anvil's default funded keys. Beat 1: regulator issues 1,000 EUA to Company A. Beat 2: Company B swaps 14k EURS for 166 EUA (slippage shows €70 → €100 spot move because pool is small; before pitch, seed pool larger or narrate "demo pool"). Beat 3: Company B retires the 166 EUA — supply visibly contracts. Closing visual works.
- `script/Demo.s.sol` — parameterised version (takes 6 deployed addresses) for re-running against an already-deployed Sepolia stack.

### Open social work

- **Ping Parth** with the consolidation reasoning before opening the merge PR. Frame: "spec evolved on the doc side after you started; here's what changed and why we're using ours; want to take Sepolia deploy + ops off our plate?"
- Tag Parth's last commit (`995fad9`) as `parth-archive` before the merge so his work is preserved at a recoverable git ref.

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
