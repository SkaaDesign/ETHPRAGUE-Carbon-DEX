# Session handoff — ETHPrague Carbon DEX

> **Audience:** Claude Code session that lands fresh in this repo. The user (Fredrik) won't read this — write to him directly in his preferred terse style.
>
> **Date written:** 2026-05-08 · **Last updated:** 2026-05-09 (post-fork)
>
> **Bottom line:** scope is locked in `BRIEF.md` (v2 — ERC-20 pivot, happy-flow demo, bridge framing all integrated 2026-05-09). Read `BRIEF.md` first; then `CHANGELOG.md` to see what changed in the most recent session. Don't re-open settled decisions. Building starts from here.

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

## 4. Project state at handoff (as of 2026-05-09 post-fork)

- **Scope (v2):** locked in `BRIEF.md`. §3 architectural decisions still settled (AMM Uniswap V2 fork, B2B compliance, EURS, EU ETS Authority, hard whitelist) plus row 6 added: `CarbonCredit` is **ERC-20** (changed from ERC-1155 — composes natively with V2 fork; matches real EU ETS within-Phase fungibility; vintage / sector / origin metadata on issuance and retirement event payloads). §3.5 (new) pins us as the on-chain settlement layer for the secondary market — **not** a registry replacement; v1 wrapped / v2 native / v3 auction roadmap. §5 is the happy-flow demo (3 beats: issuance → trade → surrender). §5b preserves the freeze flow as drama-version alternate. §14 Q&A entries (Regulator-MEV, Bridge, Derivatives) are now grounded in research findings.
- **Tooling locked:** Foundry (v1.7.1 installed on Fredrik's machine, path in `~/.bashrc`), Next.js + viem, Sourcify + ENS. **Demo chain: Sepolia L1** (decided 2026-05-08, native ENS, fewer moving pieces).
- **Stretch (not in core):** Account Abstraction, Apify live ETS price feed.
- **Deferred:** wallet UX (RainbowKit vs Privy — decide when frontend dev starts), pitch script polish (Day 3), judge Q&A rehearsal, role-split detail, cut-list.
- **Code:** Parth has pushed contracts to `origin/main` (`c40abad` "smart contracts" + `995fad9` "implement complete Carbon DEX system with 6 core contracts"). Plus `origin/smart-contract` branch (`cbf21f6`) — Parth's WIP. **Reconciliation pending:** if Parth's contracts implement ERC-1155, they need ERC-20 adjustment per the 2026-05-09 pivot.
- **Doc work:** `docs/scope-update` branch carries 9 commits with research, ERC-20 pivot, happy flow, bridge framing, regulator-UI government framing, gitignore patch, and CHANGELOG. **Not yet pushed.** Local `main` is 1 ahead of `origin/main` (an older CHANGELOG commit) and 2 behind (Parth's contracts) — diverged.

### Branch state (visual)

```
                                      ┌─ docs/scope-update (HEAD, 9 commits, local-only)
                                      │   (research, ERC-20, happy flow, bridge, gitignore, CHANGELOG)
                                      │
... d33d5a9 ── 5382a7d ── ef5aacc ────┤
                  │                   │
                  │  (local main: 1 ahead of origin)
                  │
                  └────── c40abad ── 995fad9 (origin/main — Parth's contracts)
                  └────── ...cbf21f6 (origin/smart-contract — Parth's WIP)
```

---

## 5. What to do next

Building begins now. Setup is done; scope is settled. Next moves:

1. **Reconcile contracts with Parth.** Read `origin/main` (`995fad9`) to see what Parth implemented. If `CarbonCredit` is ERC-1155, flag the ERC-20 pivot to Parth and coordinate the adjustment. If already ERC-20, great. **Do not unilaterally rewrite Parth's code** — coordinate.
2. **Push `docs/scope-update`** when ready (so Lin can access `design/happy-flow.md` via the repo, and Parth sees the updated BRIEF). Probably open a draft PR `docs/scope-update` → `main`. *Open question — confirm with Fredrik before pushing.*
3. **Frontend scaffold:** `web/` Next.js (App Router) + viem + RainbowKit-or-Privy. Three routes: `/company`, `/regulator`, `/public`. Per `design/happy-flow.md` for layout guidance. **Wallet-UX choice (RainbowKit vs Privy) still deferred** — decide when starting frontend.
4. **Wire frontend to contracts.** ABIs from Parth's contracts; `web/lib/contracts.ts` for bindings. ENS resolution via viem's L1 client (chain = Sepolia, ENS native).
5. **ENS name registrations** on Sepolia for demo accounts: `eu-ets-authority.eth`, `cement-mainz.eth`, `aluminium-bratislava.eth` (or whatever cast Lin signs off on per `design/happy-flow.md §3`).
6. **Sourcify verification** for all deployed contracts. Surface badges in UI (`/company`, `/regulator`, `/public` per BRIEF §4).
7. **Demo rehearsal** end-to-end on Sepolia. Per `BRIEF.md §5` happy flow primary; `§5b` alternate as backup.
8. **Pitch finalisation** per `BRIEF.md §14`. Numbers memorised, derivatives + bridge + regulator-MEV Q&A canned answers.

### Parallel tracks

- **Lin:** read `design/happy-flow.md`. Produce screen mockups for `/company`, `/regulator`, `/public` at Beat 2 (busiest state) and Beat 3 (closing visual, cap-accounting widget showing supply contracted). Note the `/regulator` screen needs **two distinct panels**: scheduled allocation events (calendar-driven) and authority controls (discretionary freeze/pause). Issuance is *not* in authority controls.
- **Nahin:** read `research/eu-ets-reality-check.md` for Q&A defensibility. Update pitch script to use happy-flow narration (issuance event execution, not "regulator gifts credits"). Verify the €800B market-size number flagged in BRIEF §14 before pitch.
- **Parth:** if his contracts are ERC-1155, adjust to ERC-20 per BRIEF §4 (CarbonCredit + Retirement function signatures changed). Otherwise, push tests and prepare deploy script.

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
