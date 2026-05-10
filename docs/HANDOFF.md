# Session handoff — ETHPrague Carbon DEX

> **Audience:** Claude Code session that lands fresh in this repo. The user (Fredrik) won't read this — write to him directly in his preferred terse style.
>
> **Date written:** 2026-05-08 · **Last updated:** 2026-05-10 (live wiring landed)
>
> **Bottom line:** Sepolia live. Six contracts deployed + Sourcify-verified. ENS subdomains registered. Frontend reads chain state and broadcasts real txs. Persistent product UI panels (Issue / Trade / Surrender) wired into routes with role-gated wallets. Read `BRIEF.md` first for scope; then `CHANGELOG.md` for session-by-session deltas; then **§4 below** for the latest snapshot. Don't re-open settled decisions.

---

## 1. What this repo is

`ETHPRAGUE-Carbon-DEX` — the build repo for an ETHPrague 2026 hackathon project. **Regulator-supervised on-chain DEX for EU-compliance-style carbon credits.** Team of 4 humans + Claude Code, ~2 days from scaffolding to demo.

This repo was just spun up from a prior learning sandbox (`ethereum-test-realm` — see §6) where the idea was scoped. The exploration phase is over; this repo is for building only.

---

## 2. Where to look first

| File | Purpose | When to read |
|---|---|---|
| **`BRIEF.md`** | Full scope (v2 as of 2026-05-09). Architecture, contract spec, locked decisions, happy-flow demo (§5), freeze flow alternate (§5b), bridge framing (§3.5), presentation guidance and Q&A entries (§14). | First thing — always. |
| **`CHANGELOG.md`** | Plain-English log of what shifted between sessions, audience-tagged (Nahin / Lin / Parth). | Right after BRIEF — fast catch-up on what's new. |
| `design/happy-flow.md` | Self-contained demo-flow design spec for Lin / design pass. Three beats × three screens. | When working on UI, designing screens, or rehearsing demo. |
| `research/eu-ets-reality-check.md` | Primary-source research on real EU ETS regulator behaviour (six questions). | When defending Q&A or contemplating BRIEF changes about regulator powers. |
| `ethprague_presentation_takeaways.md` | Lin & Nahin's research synthesis from past ETHPrague winner one-pagers. | When drafting pitch / demo polish on Day 3. Not before. |
| `HANDOFF.md` | This file. | First thing, then move on. |

`BRIEF.md` is the source of truth for everything: contracts, frontend, demo, tooling, prizes, decisions. `CHANGELOG.md` summarises the session-by-session deltas in plain English. If something seems open, check both — it's probably already settled.

---

## 3. Critical collaboration rules — apply rigorously

These come from prior sessions, not from `BRIEF.md`. Save them as memories in this repo's memory dir on first opportunity.

### Fredrik does not write code himself
Stated repeatedly: *"I code with ai only. ie. you code i manage."* Never propose "you could try this," "have a go yourself," or any framing that pushes implementation onto him. He directs and reviews; you implement.

### No hour-based time estimates — ever
Corrected explicitly on 2026-05-08: *"You time scheduling is always wrong. You don't even have to try to figure out timings. You think in human coding time, we work AI-first, eg. me tell you what to build."*

- Drop hour columns from feature trade-off tables
- Phrase trade-offs in terms of *complexity*, *demo-fragility risk*, *story-coherence*, *prize value vs. core flow risk*
- Day plans stay at day-granularity ("Day 1 setup, Day 2 build, Day 3 polish") not hour-granularity
- Don't write "this is X hours of work" as scope justification — argue from architectural fit, demo importance, and risk

### Terse responses
Lead with the answer. Tables and short bullets > paragraphs. No trailing summaries of what you just did. Confirm before risky/external actions (installs, pushes, anything destructive).

### Team is real (4 humans + Claude)
| Person | Role |
|---|---|
| **Fredrik** | TwinCurrent founder, Claude manager, directs Claude Code. Does not write code himself. |
| **Parth** | CS major — human dev, can implement directly without Claude. |
| **Nahin** | Business / pitch / regulatory framing / judge Q&A prep. |
| **Lin** | UI/UX — wireframes, visual design, demo staging. |

When suggesting role splits: treat Parth as a separate dev resource (he types code), don't ask Fredrik to type, pitch+narrative is Nahin's lane, design+demo staging is Lin's lane.

---

## 4. Project state at handoff (as of 2026-05-10 evening — live wiring landed)

### Where we are
- **Scope (v2):** locked in `BRIEF.md`. ERC-20 carbon token; AMM Uniswap V2 fork; B2B compliance; mock `EURS` settlement; "EU ETS Authority" regulator; hard whitelist; happy-flow demo §5 (issuance → trade → surrender) primary, freeze flow §5b alternate. §3.5 pins us as secondary-market settlement layer (not registry replacement). §14 Q&A grounded in research.
- **Contracts:** 6/6 live on Sepolia, all Sourcify exact_match (deployed 2026-05-10). 72+ Foundry tests pass. Pool seeded 350k EURS / 5k EUA.
- **ENS:** all four subdomains registered + resolving on Sepolia (`eu-ets-authority.eth`, `verified-entity.eth` namespace, `cement-mainz.verified-entity.eth`, `aluminium-bratislava.verified-entity.eth`).
- **B-side bot:** `contracts/script/b-side-bot.ts` mirrors A's trades both directions (sell + buy). `Deploy.s.sol` pre-seeds B with 500 EUA inventory so the bot can mirror.
- **Frontend:** three routes live-wired via viem to Sepolia. `getStateForRoute` reads chain state for default URL; `?beat=N` URL forces sim-mode visual fallback. `LiveBadge` top-right surfaces which mode. Persistent product UI panels (`IssueAllocationPanel`, `TradingDesk`, `SurrenderPanel`) role-gated by connected wallet. Wagmi + RainbowKit; multi-tx flows auto-chained (approve → action); `router.refresh()` after confirm. `EtherscanTx`/`EtherscanSourcify` deep-links across audit log + footer. `/public` top stat strip ("2 verified entities · Sourcify-verified 6/6 · Live on Sepolia").

### Where we sit on git
- **Branch:** `main`. Working tree clean.
- **Local main is 2 commits ahead of `origin/main`** (unpushed):
  - `639d7b9` — Persistent action panels (IssueAllocation / TradingDesk / SurrenderPanel)
  - `58c7732` — Live-mode integration + Etherscan deep-links + /public top stat
- All earlier work merged via PR #1 (`212aed9`) and PR #2 (`d6479cf`).
- `parth-archive` tag at `2e36c93` preserves Parth's pre-merge work.

### Sepolia addresses (source of truth: `contracts/script/addresses.json`)
- EURS: `0xe986d8d98a2dbf8684590d63a3b32ecd36bd38d0`
- ComplianceRegistry: `0x1969cabd76674c55de85df2ab1959655890731e0`
- CarbonCredit: `0xf78c0a349e20d6cd09f3be572ab7837fc66626fc`
- Retirement: `0xfff2c6a18aaf0eaaedd12e8e31e5b903f5040add`
- CarbonDEX: `0x832d74c42dc13487de0c61dd6ed8e52f406ce281`
- Regulator: `0x77778bf033d88c459a912c435e7a8a2460a2c08e`

### Demo wallets
- Regulator: `0xE6fff6076BD6d82d3071b451BAba308C0fA97E1c` (`eu-ets-authority.eth`)
- Company A: `0xEd271DB443dc53533D2edB3A5d4b3BF0F3DE70ED` (`cement-mainz.verified-entity.eth`)
- Company B: `0x6B6Fdc8Ed3d79812d0C28ed4C219e760817B9a5d` (`aluminium-bratislava.verified-entity.eth`) — bot-controlled, off-stage

### Recurring traps (don't get caught again)
- **`web/lib/wagmi.ts` projectId fallback.** Use `||` not `??`. Reverted three times now. If `??`, an empty-string env value passes through, RainbowKit throws "No projectId found", and `/_not-found` prerender breaks the build.
- **/regulator + /company export `dynamic = "force-dynamic"`.** Required because `actions.tsx` pulls in wagmi at module load. Without it, static prerender hits the projectId check at build time.
- **TS target ES2020+** for BigInt literals (`50_000n`, etc.) — needed for viem chain reads.

---

## 5. What to do next

Most of the build is shipped. Remaining work is operational: live test, push, optional polish, demo rehearsal.

### Immediate
1. **Push the 2 unpushed commits.** Local `main` is ahead by `639d7b9` + `58c7732`. Confirm with Fredrik before `git push origin main` — pushing main is shared-branch territory.
2. **Live end-to-end test.** Run `cd web && bun run dev`. Two MetaMask accounts switchable mid-session:
   - Regulator (`0xE6fff6076BD6d82d3071b451BAba308C0fA97E1c`) → click `Execute calendar event` on `/regulator`.
   - Company A (`0xEd271DB443dc53533D2edB3A5d4b3BF0F3DE70ED`) → on `/company`, sell some EUA via `TradingDesk`, then submit surrender via `SurrenderPanel`.
   - The "wrong wallet" warning is the safety net — red banner if signed in with the other key.
   - B-side bot (`contracts/script/b-side-bot.ts`) mirrors A's trades automatically; UI just shows the resulting Swap events fill the audit log.
3. **Reset workflow for rehearsal.** Prime redeploys → `addresses.json` updates on `main` → pull → restart bot. Frontend re-reads new addresses with no code change.

### Optional follow-up polish (transparency drawers)
Per prime's transparency-polish list (currently deferred — opt-in if time):
- Click ENS name → entity drawer (wallet balance + mints/swaps/retires history + ENS metadata + Etherscan).
- Click tx hash in audit log → tx drawer (decoded args + parties + amounts + Etherscan).
- These are read-only chain queries + drawer UI; no contract changes.

### Pitch / day-of
- **Lin:** screens are live; if you want any tile re-styled, the design-token surface is `web/app/globals.css`. Components live in `web/components/` and `web/app/{route}/page.tsx`.
- **Nahin:** numbers memorised; derivatives + bridge + regulator-MEV + LP-fee Q&A canned in `BRIEF.md §14`; verify €800B market-size before pitch.
- **Parth:** consolidation context in `CHANGELOG.md 2026-05-09 (later evening)`. Sepolia deploy + Sourcify already done. Future chunks: any deploy-script tooling we add.

### Sim-mode safety net
Every route accepts `?beat=N` (0..3) URL parameter. That switches off chain reads and renders the design's beat-driven story instead. If the live demo breaks on stage, change URL → audience can't tell.

---

## 6. Where the history lives

The exploration sandbox repo (with handoffs from earlier machines + the Arbor-era brainstorm trail) is at:

```
C:\Users\fredr\Desktop\Coding\ethereum-test-realm
```

Don't pull anything from it into this repo without reason. It's archive material. The only useful pre-history is what already made it into `BRIEF.md`.

---

## 7. Memory system

This repo's project memory dir is fresh — it lives at `C:\Users\fredr\.claude\projects\C--Users-fredr-Desktop-Coding-ETHPRAGUE-Carbon-DEX\memory\`. As soon as you have meaningful collaboration norms or project facts, save them there per the standard memory format.

Memories worth saving on first opportunity (these don't auto-transfer from the sandbox repo):

| Type | Memory | Source |
|---|---|---|
| feedback | Fredrik does not write code himself | §3 above |
| feedback | No hour-based estimates ever | §3 above |
| feedback | Team composition (Fredrik + Parth + Nahin + Lin) | §3 above |
| project | ETHPrague Carbon DEX — regulator-supervised, EU compliance angle | `BRIEF.md` |
| project | Toolchain locked: Foundry + viem + Next.js + Sourcify + ENS | `BRIEF.md` |
| user | Fredrik — Danish, TwinCurrent founder, fast study, comfortable directing AI agents | history |

---

## 8. Closed: EU ETS research task

**Status: COMPLETE 2026-05-09.** Output: `research/eu-ets-reality-check.md` (six questions covered; primary-source citations to EUR-Lex 2003/87/EC, 2019/1122, 2010/23/EU, EU Commission, Europol, ESMA RTS 22, JPMorgan Kinexys, ICAP).

Findings already integrated into:
- `BRIEF.md §14 Regulator-MEV Q&A` — deferred stub replaced with grounded answer (forward-only freeze is *more* faithful to real EU ETS, not less; cites Reg. 2019/1122 Art. 30 + 2010-11 phishing precedent).
- `BRIEF.md §14 Bridge Q&A` (new) — pre-empts *"how do real EUAs get on-chain?"*.
- `BRIEF.md §14 Numbers to memorise` — adds Phase 4 figures (cap, LRF, EUA price, surrender deadline, €100/t penalty).
- `BRIEF.md §5b` blockquote on prospective freeze — cites the research directly.
- `BRIEF.md §3.5` (new) — bridge framing v1/v2/v3 roadmap.

**Confidence flag carried forward:** Q3 (2022 Russian freeze) is low-medium confidence — public reporting was thin. Pitch language for sanctions narration uses the safer framing: *"EU sanctions regulations automatically freeze sanctioned holdings"* (not *"the regulator froze Russian operators"*).

---

## 9. Style cheat sheet for responding to Fredrik

- Lead with the answer. Mental model first when teaching. One concrete next step.
- Tables and short bullets > paragraphs.
- Define jargon on first use.
- Ask before running anything that touches the system or the GitHub remote.
- No trailing "let me know if you need anything" or self-summaries.
- He often piles multiple small questions into one message — answer each briefly, in the order asked.
- Push back honestly when he's about to make a scope-creep mistake. Don't just agree.
