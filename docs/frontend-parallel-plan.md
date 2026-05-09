# Frontend / Backend Parallel Plan

> **Audience:** Primary session (currently writing contracts on `docs/scope-update`).
> **From:** Forked session (about to start frontend in `web/`).
> **Status:** Awaiting your confirmation. Reply *OK* or push back.

---

## Plan in one paragraph

Forked session builds the frontend in `web/` while primary continues backend in `contracts/`. Same branch (`docs/scope-update`). Folders are disjoint — no merge conflicts expected. We meet at the integration step (ABIs from `forge build` → `web/lib/contracts.ts`, viem wiring against deployed Sepolia).

## Decisions locked

| | Choice | Why |
|---|---|---|
| Wallet model | **A — self-custody EOAs** (companies hold keys; regulator can mint + freeze but cannot move tokens) | Self-custody is the project's structural shift from real EU ETS. Model B (EU-provisioned credentials) reproduces the Union Registry's database-row model and defeats the on-chain point. |
| Wallet UI library | **RainbowKit** | Matches Model A; institutional fit; not Privy (Privy's email-login UX reads off-tone for B2B compliance) |
| UI library | **shadcn/ui + Tailwind** | Drop-in primitives, easy to override; defaults already lean institutional |
| Typography | **IBM Plex Sans + Fraunces (display) + IBM Plex Mono (data/hashes)** | Per `docs/design/happy-flow.md §4` |
| Stack | **Next.js App Router + viem + wagmi** | Per BRIEF §6 |

## Lane discipline

| Lane | Forked (frontend) | Primary (backend) |
|---|---|---|
| Code paths | `web/**` | `contracts/**` |
| Design source | reads `docs/design/happy-flow.md` | doesn't touch |
| Owns doc updates | `docs/CHANGELOG.md` (frontend deltas only) | `docs/BUILD-STATUS.md` · `docs/HANDOFF.md` · `docs/BRIEF.md` |
| Untracked `contracts/src/Retirement.sol` etc. | hands off | yours |
| Pull cadence | `git pull` before each commit | same |

If either lane needs to edit a doc the other owns, surface to Fredrik to broker — don't unilaterally cross.

## Forked session: build order

1. `npx create-next-app web/ --typescript --tailwind --app`
2. Install `wagmi`, `viem`, `@rainbow-me/rainbowkit`, shadcn primitives
3. IBM Plex + Fraunces via `next/font`
4. Three routes per `docs/design/happy-flow.md`: `/company`, `/regulator`, `/public`
5. Mock data fixtures matching the happy flow (1,000 issued → 200 swap → 200 retired → 800 in circulation)
6. Component primitives per `design/happy-flow.md §7`: audit-log row, scheduled-events panel, authority-controls panel, cap-accounting widget, retirement certificate, swap form
7. Wallet connection wired (RainbowKit, Sepolia chain config — no real contract calls yet, just connect-and-read-address)
8. Recreate the Claude-design HTML/JSX once Fredrik imports it (proposed location: `design/source/`)
9. Stop and surface — Fredrik decides v2 polish vs wait for backend ABIs

## What forked will *not* do

- Touch anything in `contracts/`
- Edit `BRIEF.md`, `HANDOFF.md`, or `BUILD-STATUS.md` (those are primary's lane)
- Push the branch (Fredrik decides on push)
- Commit until routes are clickable end-to-end with mock data

## What forked needs from primary, later

- **Function ABIs:** `forge build` produces them in `contracts/out/`. When CarbonDEX + Regulator deploy to Sepolia, surface deployed addresses + ABI references somewhere I can find — proposed: `docs/deployment-addresses.md`. Doesn't need to be elegant, just structured (contract name → address → ABI path).
- **No earlier interaction needed.** Frontend builds against interface stubs from BRIEF §4 until then.

## Reply needed

- **OK** → forked session starts frontend immediately
- **Push back** → name what changes (decision, lane, sequence)
- **Wait** → forked session holds and asks Fredrik to coordinate timing

---

*Lives at `docs/frontend-parallel-plan.md`. Once primary acks, this doc can stay (audit trail) or be deleted (if you prefer to keep `docs/` lean).*
