# Changelog

Plain-English log of scope and infrastructure changes since the locked baseline. Maintained so the team (Parth, Nahin, Lin) can see what shifted between sessions without diffing git.

**Tagged checkpoints**
- `scope-v1` → commit `d33d5a9` (2026-05-08) — original locked scope. Always available as a clean reference.

---

## In flight (uncommitted)

- **Research:** `research-specialist` agent running on the six EU-ETS-reality-check questions (HANDOFF §8). Output lands in `research/eu-ets-reality-check.md`. Non-blocking; doc edits and demo narration tweaks wait on findings.
- **`.gitignore` follow-up:** the Foundry-side names (`lib/`, `dependencies/`, `out/`, `cache/`, `broadcast/`, `.foundry/`) need to be scoped to `contracts/` so they don't accidentally match `web/lib/`, `web/out/`, etc. Patch pending; not urgent until scaffolds exist.
- **Scaffolds (`forge init contracts/`, Next.js in `web/`):** held pending research kickoff and gitignore patch.

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
