# Fork-session handoff — from me to future-me

> Written 2026-05-10 by the fork session (frontend-lane Claude) for the post-compact continuation. Audience: a future Claude that picks up *this* session's work, not a fresh-repo bootstrap (that's `HANDOFF.md`).
>
> If you're a brand-new session entering this repo cold: start at `BRIEF.md` → `HANDOFF.md` → `CHANGELOG.md`. Then come back here for the fork lane's specifics.

---

## What this session has been doing

The "fork" lane (parallel to prime — Fredrik's main backend session) owns **frontend-only work**: chain wiring, product UI panels, transparency polish. Prime owns contracts + deploy + b-bot.

What landed in the recent commits I (the pre-compact fork) shipped:

| Commit | What |
|---|---|
| `3167946` | Wired routes to live Sepolia via viem (`getStateForRoute`, `LiveBadge`) |
| `b33b33f` | First-pass wallet-flow buttons (later replaced — wrong direction) |
| `639d7b9` | Persistent action panels (panel-builder teammate): `IssueAllocationPanel` / `TradingDesk` (sell↔buy + live quote) / `SurrenderPanel` (form + `RetirementCertificateLive`) + write-side ABIs |
| `58c7732` | Lead integration: route layout split (`isLive ? <LiveLayout/> : <SimLayout/>`), `EtherscanLink` helper applied across audit log + footer, `/public` top stat strip |
| `d653b97` | `HANDOFF.md` refresh for post-Sepolia state |
| (pending in this session) | Address sync after prime's `a796297` fresh redeploy |

## The mental model that took a few iterations to get right

**Persistent product UI, role-gated by wallet — NOT beat-gated buttons.** Demo flow happens because of pre-filled form defaults; the UI behaves like a real product even outside the demo.

Got this wrong on the first pass (commit `b33b33f`) — used `if (beat === N)` to gate which button appears. Prime sent back: *"NOT what I wanted ... we want real life feel."* Pivoted to:

| Surface | Persistent visibility | Role gate |
|---|---|---|
| `/regulator` `IssueAllocationPanel` | always shown in live mode | regulator wallet only |
| `/company` `TradingDesk` | always shown in live mode | company A wallet only |
| `/company` `SurrenderPanel` | always shown in live mode | company A wallet only |
| Wrong wallet | red banner + connect button | — |
| Right wallet | form unlocked | — |

Sim mode (`?beat=N` URL) keeps the original beat-driven story (`Awaiting` / `AllocationReceipt` / `SwapReceipt` / `Certificate`) as a **safety net for stage** — if the wallet flow breaks live, switch to a `?beat=` URL and the audience can't tell.

## Recurring traps (don't get bitten again)

These have all bitten me at least once. If you're picking up this lane:

1. **`web/lib/wagmi.ts` projectId fallback must use `||` not `??`.** This has been reverted *three times* now (linter, manual edit, branch reset). Symptom: build fails on `/_not-found` prerender with "No projectId found" because env var is empty string `""` which `??` doesn't catch. Fix is one character. If you see `??` reappear, change it.

2. **`/regulator` and `/company` need `export const dynamic = "force-dynamic";`** at the top. Without it, static prerender at build time hits the wagmi config validation and fails. Reason: `actions.tsx` pulls in wagmi at module load.

3. **`web/lib/contracts.ts` SEPOLIA addresses go stale every time prime redeploys.** The frontend is hardcoded to specific addresses; `addresses.json` is the source of truth. After any redeploy, re-sync the six hex strings in `web/lib/contracts.ts` to match. Quick check: `git log --oneline contracts/script/addresses.json` to spot recent redeploys.

4. **Two MetaMask accounts switchable mid-session for the demo.** Regulator key + Company A key. If you're testing live, you'll need both imported. The "wrong wallet" warning is the safety net.

5. **Race conditions when teammates and main session both edit same files.** Hit this with `ui.tsx` and `regulator/page.tsx` getting bundled into wrong commits. Mitigation: lane discipline in agent prompts (each agent owns specific files); use `TeamCreate` properly; don't let lead and teammate both modify route files simultaneously.

6. **TypeScript target must be ES2020+** for BigInt literals (`50_000n`) — needed by viem chain reads. `web/tsconfig.json` already has `"target": "ES2020"`; don't downgrade.

## How the live-vs-sim split actually works

Each route does:

```tsx
const { state, isLive } = await getStateForRoute(usp);
const beat = state.beat;

return (
  <>
    <Shell>
      <CommonHeader state={state} />
      {isLive ? (
        <LivePanels />          // persistent product UI — actions, role-gated
      ) : (
        <BeatDrivenStory />     // design canvas — sim fallback
      )}
      <CommonFooter />
    </Shell>
    <LiveBadge isLive={isLive} beat={beat} />  {/* top-right pill */}
    <BeatSwitcher current={beat} />            {/* bottom-right beats */}
  </>
);
```

`getStateForRoute(usp)` is the magic. If `?beat=N` in URL → returns `stateAt(N)` simulation, `isLive: false`. Otherwise → reads chain via viem, returns derived state, `isLive: true`. On RPC failure → falls back to `stateAt(3)` simulation with `isLive: false` (so the UI never breaks).

## Multi-session coordination

- **Prime** (`main session`) owns: `contracts/`, `BRIEF.md`, `CHANGELOG.md` (mostly), `BUILD-STATUS.md`, deploy ops, b-side bot. Fredrik passes our work to prime for review; prime sometimes feeds back tighter prompts (the persistent-UI pivot was prime).
- **Fork** (this session) owns: `web/` and `docs/design/happy-flow.md`. Lead doesn't touch contracts.
- **Branches**: most work converges on `main` directly now (PR #1 merged `frontend/sepolia-wiring`; PR #2 merged `frontend/post-merge-cleanup`). Future PRs may use feature branches; check with Fredrik.
- **Push cadence**: confirm with Fredrik before pushing to `main`. He's been doing many of the pushes himself.

## What's NOT yet done (if Fredrik wants more)

Per prime's transparency-polish list (deferred):
- **Click ENS name → entity drawer** (history of mints/swaps/retires for that address, ENS metadata, Etherscan link). Read-only chain queries + side drawer.
- **Click tx hash → tx drawer** (decoded args + parties + amounts + vintage/sector for ISSUE / beneficiary+reasonURI for RETIRE + Etherscan link).
- **Real reasonURI upload via web3.storage** — currently the PDF upload is visual-only flair.
- **Freeze + Pause panels on /regulator** — stretch from prime's earlier prompt; complete the "regulator portal" feel with discretionary enforcement powers.
- **B-side bot status indicator on /public or /regulator** — read bot's address activity to show "B-bot online · last mirrored at HH:MM" so judges see the bidirectional liquidity loop.

## How to verify everything still works

```
cd /c/Users/fredr/Desktop/Coding/ETHPRAGUE-Carbon-DEX/web
bun run build          # should be green; all 4 routes prerender or dynamic
bun run dev            # local server at http://localhost:3000
```

Then in browser:
- `/` — landing with three role-cards
- `/public` — live cap accounting, top stat strip, EU header, no wallet
- `/regulator` — KPI strip, scheduled events, **`IssueAllocationPanel`** (with regulator wallet connected), audit log with Etherscan links
- `/company` — identity tile, **`TradingDesk` + `SurrenderPanel`** (with cement-mainz wallet), holdings strip
- Append `?beat=0` / `?beat=1` / `?beat=2` / `?beat=3` to any route → sim mode (no chain reads, design's beat-driven story)

LiveBadge top-right tells you which mode each route is rendering.

## How to get unstuck

If you're confused about state: `git log --oneline -10` then read recent commit messages. If still confused: `cat docs/CHANGELOG.md | head -50` and `cat docs/BUILD-STATUS.md`. If still confused: ask Fredrik.

If a build is failing: 90% of the time it's projectId in `wagmi.ts`. Fix: `||` not `??`.

If chain reads return empty/weird: addresses out of sync after a redeploy. Fix: re-read `addresses.json`, update `web/lib/contracts.ts`.

If MetaMask is connected but action button is disabled: wrong wallet for the role. Switch accounts.

---

*Don't reopen the persistent-vs-beat-gated debate. That fight is over and persistent won.*
