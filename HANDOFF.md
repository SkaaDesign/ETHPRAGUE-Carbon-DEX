# Session handoff — ETHPrague Carbon DEX

> **Audience:** Claude Code session that lands fresh in this repo. The user (Fredrik) won't read this — write to him directly in his preferred terse style.
>
> **Date written:** 2026-05-08
>
> **Bottom line:** scope is locked in `BRIEF.md`. Read it once, then start scaffolding. Don't re-open settled decisions.

---

## 1. What this repo is

`ETHPRAGUE-Carbon-DEX` — the build repo for an ETHPrague 2026 hackathon project. **Regulator-supervised on-chain DEX for EU-compliance-style carbon credits.** Team of 4 humans + Claude Code, ~2 days from scaffolding to demo.

This repo was just spun up from a prior learning sandbox (`ethereum-test-realm` — see §6) where the idea was scoped. The exploration phase is over; this repo is for building only.

---

## 2. Where to look first

| File | Purpose | When to read |
|---|---|---|
| **`BRIEF.md`** | The full scope. Architecture, contract spec, locked decisions, demo flow, presentation guidance. | First thing — always. |
| `ethprague_presentation_takeaways.md` | Lin & Nahin's research synthesis from past ETHPrague winner one-pagers. | When drafting pitch / demo polish on Day 3. Not before. |
| `HANDOFF.md` | This file. | First thing, then move on. |

`BRIEF.md` is the source of truth for everything: contracts, frontend, demo, tooling, prizes, decisions. If something seems open, check there before asking — it's probably already settled.

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

## 4. Project state at handoff

- **Scope:** locked in `BRIEF.md`. Architectural decisions in §3 of brief are settled (AMM Uniswap V2 fork, B2B compliance, mock EUR token "EURS", "EU ETS Authority" as regulator, hard whitelist).
- **Tooling decided:** Foundry for contracts, Next.js + viem for frontend, Sourcify + ENS in scope.
- **Stretch (not in core):** Account Abstraction, Apify live ETS price feed.
- **Deferred:** chain choice (recommendation Base Sepolia), wallet UX (RainbowKit vs Privy), pitch script, judge Q&A, hour-by-hour timeline, role detail, cut-list.
- **Code:** none yet. Repo has only docs.

---

## 5. What to do next

Per `BRIEF.md` §13:

1. Confirm with Fredrik: ready to scaffold?
2. **Add a proper `.gitignore`** before any code lands — Foundry (`out/`, `cache/`, `broadcast/`), Node (`node_modules/`, `.next/`), env (`.env*`). Current `.gitignore` is minimal (only `.twincurrent-build/`).
3. **Install Foundry** — already installed on Fredrik's primary machine (2026-05-08, v1.7.1). For a fresh machine, use **Git Bash** (the official installer is a bash script; PowerShell `iex` will not parse it):
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   export PATH="$HOME/.foundry/bin:$PATH"   # foundryup auto-detects shell to persist this; if it fails, append to ~/.bashrc manually
   foundryup
   forge --version    # verify
   ```
   On Fredrik's machine the path is already in `~/.bashrc`. PowerShell users who want `forge` outside Git Bash also need `%USERPROFILE%\.foundry\bin` on their Windows User PATH.
4. **Scaffold contracts:** `forge init contracts` in repo root. File-level stubs for the six contracts in `BRIEF.md` §4: `CarbonCredit.sol`, `ComplianceRegistry.sol`, `CarbonDEX.sol`, `Regulator.sol`, `Retirement.sol`, `EURS.sol`. Empty function bodies + event signatures.
5. **Scaffold frontend:** Next.js App Router init in `web/`. Three routes: `/company`, `/regulator`, `/public`.
6. **Lin's parallel track:** wireframes + the canonical 3-role architecture diagram (`BRIEF.md` §4 frontend section).
7. **Nahin's parallel track:** MiCA/MiFID one-pager + read competitive landscape (§10) for Q&A prep.
8. End of Day 1: file-level scaffolds for all six contracts, all three frontend views, wireframes locked.

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

## 8. Open research task — low priority, not blocking

A pending research task came out of the scope conversation. **Not required for ship.** Hand to a research agent (e.g. `research-specialist` or `research-deep`) as a parallel low-priority task — ideally early in the new session so Nahin can use the output for pitch-Q&A defensibility. Do not block scaffolding on it.

### Goal
A 1-page reference doc on how the real EU ETS works at the regulator level, so Nahin sounds informed in judge Q&A and so the brief's framing of our regulator role can be pinned down (faithful to real ETS or deliberate divergence, with reason).

### Six questions
1. **What powers do EU national ETS administrators actually have?** Mid-trade halt? Reverse transfers? Freeze accounts? In what circumstances?
2. **2010 EU ETS VAT carousel fraud (~€5B):** how was it detected, who acted, what changed afterwards (e.g. reverse-charge VAT)?
3. **2022 Russian-linked allowance freeze:** the technical mechanic — were accounts frozen, transfers reversed, or registry flags flipped? Who authorised it?
4. **Existing institutional sketches of tokenised compliance carbon:** JPMorgan Project Carbon, MSCI Real Assets, EEX, AirCarbon Exchange — what specifically have they designed or proposed? What does our DEX-with-regulator-as-participant model do differently?
5. **MiFID II operational requirements for a carbon-trading venue:** what does a compliant venue actually need (custody, reporting, KYC, capital, market surveillance)?
6. **Union Registry architecture:** account types (operator, person, aviation, government), KYC flow, transfer flow, allowance vintage tracking. How does our `ComplianceRegistry` + `Regulator` split compare?

### Output destination
`research/eu-ets-reality-check.md` in this repo. Markdown, ~1 page, one short section per question with specific facts and citations to primary sources where possible (EU ETS Directive articles, Union Registry technical docs, official EU Commission statements, news reports).

### After research lands
1. Update `BRIEF.md §14` to add the **Regulator-MEV Q&A** entry with informed framing (currently deferred).
2. Optionally tweak `BRIEF.md §5` step 4 narration if the research surfaces a more accurate suspicious-trade scenario than "suspected sanctions exposure."
3. Optionally refine `BRIEF.md §10` competitive landscape with what the research surfaces about JPM/MSCI/EEX.

The brief already has a stub at §14 ("Regulator-MEV Q&A — deferred until research is done") pointing here. Close the loop when research lands.

---

## 9. Style cheat sheet for responding to Fredrik

- Lead with the answer. Mental model first when teaching. One concrete next step.
- Tables and short bullets > paragraphs.
- Define jargon on first use.
- Ask before running anything that touches the system or the GitHub remote.
- No trailing "let me know if you need anything" or self-summaries.
- He often piles multiple small questions into one message — answer each briefly, in the order asked.
- Push back honestly when he's about to make a scope-creep mistake. Don't just agree.
