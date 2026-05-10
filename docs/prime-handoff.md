# Prime handoff — Carbon DEX (post-compact bootstrap)

> **Audience:** post-compact prime Claude session resuming work on this repo. Read in full before answering Fredrik's first message — it captures state + workflow + collaboration context that won't survive context compaction.
>
> **Date:** 2026-05-10
> **Last commit before this doc:** `cff99cf` on `origin/main`
> **Demo on stage:** Day 3 morning (within ~24h of writing)

---

## TL;DR — where everything is

| | |
|---|---|
| Sepolia chain | 6 contracts deployed + Sourcify-verified · addresses in `contracts/script/addresses.json` (sepolia section) |
| ENS | 4 names resolve via `cast resolve-name` on Sepolia (eu-ets-authority.eth, verified-entity.eth, cement-mainz.verified-entity.eth, aluminium-bratislava.verified-entity.eth) |
| Chain state | Demo-ready: A/B/deployer registered, pool seeded 350k EURS / 5k EUA at €70 spot, B pre-seeded 500 EUA |
| Frontend | Persistent product UI (IssueAllocationPanel/TradingDesk/SurrenderPanel) live on /regulator + /company. Editable forms. Dynamic minOut. Wallet-reject-safe. RetirementCertificateLive reads real Retired event. |
| B-side bot | `scripts/b-side-bot.ts` — bidirectional, auto-mirrors A's trades. Run via `bash scripts/run-b-bot.sh`. |
| Tests | 72/72 pass on contracts (`cd contracts && forge test`) |
| Open TODO | `/public` ledger still renders hardcoded sim copy — should map `s.audit` real events (~15 min, post-rehearsal) |

---

## Repo map

```
contracts/                  Foundry project — 6 contracts, 72 tests, Deploy.s.sol + Demo.s.sol + DemoLocal.s.sol
contracts/.env              REAL Sepolia private keys + Alchemy RPC URL (gitignored, never commit)
contracts/script/addresses.json   Live Sepolia addresses + ENS table (committed; frontend reads this)
web/                        Next.js 16 + viem + RainbowKit + wagmi. Bun-managed.
web/AGENTS.md               "This is NOT the Next.js you know" — Next 16 has breaking changes; check node_modules/next/dist/docs/ before assuming APIs
web/components/actions.tsx  The 3 persistent panels (1070 LOC). Wallet-flow heart.
web/lib/chain-state.ts      Server-side viem reads — getStateForRoute(searchParams) is the entry point
web/lib/contracts.ts        SEPOLIA address registry + minimal parseAbi for each contract
scripts/b-side-bot.ts       B's mirror trades (both directions)
scripts/run-b-bot.sh        Wrapper that loads contracts/.env then runs the bot
docs/BRIEF.md               Source of truth for scope (v2 — single-actor demo, custom CPMM, ERC-20 token)
docs/CHANGELOG.md           Plain-English session-by-session log; In flight section is the live TODO
docs/HANDOFF.md             Session-bootstrap doc for fresh Claude sessions (not just prime)
docs/fredrik/               Gitignored — Fredrik's personal learning ledger
```

---

## Critical workflows

### Rehearsal reset (between demo runs)

After every full demo run, chain has accumulated state (audit log fills, A's balance changes, etc.). To get a clean canvas:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify --verifier sourcify
# extract new addresses from broadcast log:
cat broadcast/Deploy.s.sol/11155111/run-latest.json | grep -E '"contractName"|"contractAddress"' | head -12
# manually update contracts/script/addresses.json sepolia.contracts section with the new addresses
git add contracts/script/addresses.json
git commit -m "Sepolia redeploy: clean canvas for rehearsal"
git push origin main
# Then user pulls + restarts bot:
#   git pull
#   pkill -f b-side-bot   (kill old bot)
#   bash scripts/run-b-bot.sh   (restart with new DEX address)
```

Each redeploy costs ~0.0000056 ETH (effectively free at Sepolia gas ~0.001 gwei). Deployer wallet has plenty.

### Bot management

```bash
bash scripts/run-b-bot.sh         # start (loads env, runs the watcher)
pkill -f b-side-bot               # stop
```

Bot pre-flights: faucets EURS to B if balance low, approves DEX for both EURS + CarbonCredit. Then watches Swap events from Company A and fires the matching counter-trade. Ignores its own swaps.

### Live demo flow (the click sequence on stage)

1. `cd web && bun run dev` (port 3001 likely; user has unrelated process on 3000)
2. Open `/regulator`, `/company`, `/public` in browser windows
3. MetaMask: switch to **Regulator** → click "Execute" on /regulator's Issue panel → MM popup → sign → ~12s → /company tile shows A balance 0 → 1000 EUA
4. Switch MM to **Company A** → click Sell on /company TradingDesk → 2 MM popups (approve + swap) → ~24s → bot fires B's matching buy ~5s after → /public ticker shows both
5. Still as Company A → Surrender panel → 2 MM popups (approve + retire) → real RetirementCertificate appears with the actual on-chain hash

---

## Working with Fredrik (collaboration norms)

See `~/.claude/projects/.../memory/` for the full set; the essentials:

- **Fredrik does not type code** — he directs, you implement. Never propose "you could try this" / "have a go yourself."
- **Terse responses, no trailing summaries** — lead with the answer, tables > paragraphs, push back honestly
- **No hour-based estimates** — argue from complexity / demo-fragility / story-coherence
- **Confirm before risky/external actions** (deploys, pushes, merges that affect shared state)
- He's at `frontend/sepolia-wiring-v3` working tree state often (sees that branch); main is the integration point
- **No TC leakage** — Carbon DEX repo is shared with non-TC collaborators (Parth/Nahin/Lin); never commit TC tooling/env/keys

---

## Multi-session coordination

Two Claude Code sessions run in parallel against this same git repo, sharing the working tree:

- **Prime (this session)** — owns contracts, deploy, b-bot, chain plumbing, scope/docs
- **Fork session** — owns web/ frontend (panels, routes, design implementation)

Branch convention: fork pushes to `frontend/<scope>` branches; prime merges to main after review (DA agent or eyeball). Fork shares status via "Relay for prime" prefixed messages that Fredrik forwards.

When working tree state seems wrong (e.g., file checksums don't match what fork said they pushed), check that you're on the right branch — the shared working tree means another session may have switched branches. Use `git branch -vv` first.

---

## Active TODO at handoff

| | Status |
|---|---|
| `/public` ledger map over `s.audit` instead of hardcoded copy | Open — flagged in `cff99cf` commit message; ~15 min of work |
| Pre-stage redeploy (~30 min before demo) | Open — see Rehearsal reset workflow above |
| Demo rehearsal end-to-end with live wallet flow | Open — Fredrik does this; prime supports |
| Pitch finalisation, Q&A prep, market-size verification | Open — Nahin's lane |

---

## First steps post-compact

1. Read this doc + skim `docs/BRIEF.md §5` (single-actor happy flow) + `docs/CHANGELOG.md` In flight section
2. Check `git status` and `git log --oneline -5` to verify branch + last commit
3. Wait for Fredrik's first message; respond per the collaboration norms above
4. Don't re-deploy / re-tag / push unless explicitly asked
