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
- **Code:** Our 6 contracts live in `contracts/` on `docs/scope-update`. **66 tests pass in ~19ms.** Deploy + DemoLocal scripts work end-to-end on anvil. Parth's contracts at `origin/main` `my-smart-contract/` were reviewed; consolidation decision is **use ours wholesale, lift small items (audit fn, DEX view helpers) — see CHANGELOG 2026-05-09 (later evening) for full reasoning.** Merge PR (with `parth-archive` tag on Parth's last commit) and ping-Parth-first are open work.
- **Doc work:** `docs/scope-update` carries the full scope evolution + all contract code + Deploy + DemoLocal. **Not yet pushed.** Local `main` is 1 ahead of `origin/main` (an old CHANGELOG-only commit, will be superseded by the PR) and 2 behind (Parth's contracts, will be superseded by the PR after merge).

### Branch state (visual)

```
                                      ┌─ docs/scope-update (HEAD, ~14 commits, local-only)
                                      │   research · ERC-20 · happy flow · bridge framing
                                      │   docs reshuffle · OZ install · CPMM decision
                                      │   6 contracts (66 tests) · audit + DEX view lifts
                                      │   Deploy + DemoLocal scripts (e2e on anvil)
                                      │
... d33d5a9 ── 5382a7d ── ef5aacc ────┤
                  │                   │
                  │  (local main: 1 ahead of origin/main, supersedes on merge)
                  │
                  └────── c40abad ── 995fad9 (origin/main — Parth's contracts; tag as parth-archive before merge)
                  └────── ...cbf21f6 (origin/smart-contract — Parth's WIP; leave as-is)
```

---

## 5. What to do next

PR #1 merged into main as of `212aed9` (2026-05-10). Backend foundation + scope + frontend skeleton + design source all on main. Next moves are operational: get to Sepolia, get to a rehearsable end-to-end demo.

1. ✅ ~~Devils-advocate review~~ — done; PROCEED verdict, fixes applied.
2. ✅ ~~Parth ping + push + PR~~ — done; merged as `212aed9`. `parth-archive` tag at `2e36c93`.
3. **Sepolia onboarding (USER ACTION — gates everything below).** See `contracts/.env.example` for the full env-var checklist. Need: Alchemy Sepolia HTTPS RPC URL (free signup); three test wallets (`cast wallet new` × 3); Sepolia faucet ETH (~0.5 to deployer / ~0.05 to each company). Once `.env` is populated locally, prime can deploy.
4. **Sepolia deploy + Sourcify verify** — single command: `forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify --verifier sourcify`. Reads `PRIVATE_KEY` + `SEPOLIA_RPC_URL` from `.env`. Logs all 6 deployed addresses; populate `addresses.json` from the output.
5. **ENS subdomain registrations** on Sepolia: bare `eu-ets-authority.eth` for the regulator; `verified-entity.eth` owned by regulator as institutional namespace; subdomains `cement-mainz.verified-entity.eth` + `aluminium-bratislava.verified-entity.eth` for demo companies. Use https://app.ens.domains (switch to Sepolia network).
6. **Frontend live wiring** — fork session swaps `stateAt(beat)` simulation → viem reads against Sepolia addresses. Their `frontend/post-merge-cleanup` PR is in flight (receipt copy + ENS subdomain rename); after merge they pick up wiring once Sepolia addresses exist.
7. **Demo rehearsal** end-to-end on Sepolia. Per `BRIEF.md §5` happy flow primary; `§5b` alternate as backup. `Demo.s.sol` (parameterised, multi-key) drives the chain side; frontend pulls live state via viem.
8. **Pitch finalisation** per `BRIEF.md §14`. Numbers memorised; derivatives + bridge + regulator-MEV Q&A canned answers; verify the €800B market-size figure.

### Parallel tracks

- **Lin:** read `docs/design/happy-flow.md`. Produce screen mockups for `/company`, `/regulator`, `/public` at Beat 2 (busiest state) and Beat 3 (closing visual, cap-accounting widget showing supply contracted). Note the `/regulator` screen needs **two distinct panels**: scheduled allocation events (calendar-driven) and authority controls (discretionary freeze/pause/audit). Issuance is *not* in authority controls.
- **Nahin:** read `docs/research/eu-ets-reality-check.md` for Q&A defensibility. Update pitch script to use happy-flow narration (issuance event execution, not "regulator gifts credits"). Verify the €800B market-size number flagged in BRIEF §14 before pitch.
- **Parth:** see CHANGELOG 2026-05-09 (later evening) for consolidation context. Suggested next chunk: own Sepolia deploy + Sourcify verification + maintaining the `script/` directory as we add operational tooling.

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
