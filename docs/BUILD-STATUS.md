# Build status

Snapshot of where the build stands on `main`. Flip ❌ → ✅ as items land.

## ✅ Done

| Phase | |
|---|---|
| Foundry installed (v1.7.1, in `~/.bashrc`) | ✅ |
| Scope locked (BRIEF v2, design, research) | ✅ |
| Lin has UI mockups; design imported into `web/design/source/` | ✅ |
| `.gitignore` hardened + scoped | ✅ |
| `forge init contracts/` with parent-repo submodule for forge-std | ✅ |
| OpenZeppelin v5.6.1 installed | ✅ |
| AMM architecture decided: custom CPMM (V2-style math, no V2 install) | ✅ |
| 6 contracts written | ✅ |
| 72 tests pass in ~17ms | ✅ |
| Devils-advocate review (PROCEED) | ✅ |
| Exact-output swap functions on DEX | ✅ |
| Single-actor demo flow (Company A protagonist) | ✅ |
| `Deploy.s.sol` — single-tx deploy + role wiring | ✅ |
| `DemoLocal.s.sol` — anvil deploy + seed + 3-beat happy flow | ✅ |
| `Demo.s.sol` — multi-key parameterised version for Sepolia | ✅ |
| Local end-to-end on anvil | ✅ |
| PR #1 merged to main | ✅ at `212aed9` |
| `parth-archive` tag set | ✅ at `2e36c93` |
| Test wallets + Sepolia RPC + faucet ETH | ✅ deployer 0.03 ETH; A + B 0.01 ETH each |
| **Deploy to Sepolia** | ✅ all 6 contracts at `df0e90d` |
| **Sourcify verify** | ✅ 6/6 `exact_match` on first try |
| **`Demo.s.sol` happy flow on Sepolia** | ✅ Beat 1+2+3 ran end-to-end on real chain |
| **ENS names registered on Sepolia ENS** | ✅ all 4 resolve correctly via cast resolve-name |
| `addresses.json` populated with Sepolia addresses + ENS confirmations | ✅ |
| Frontend Next.js scaffold (`web/`) + 3 routes | ✅ |
| Wallet connection (RainbowKit) | ✅ |

## 🟡 In progress (forked session)

| Phase | |
|---|---|
| Frontend wired to live Sepolia contracts via viem | 🟡 fork on `frontend/sepolia-wiring` (commit `3167946`) |

## ❌ Pending

| Phase | |
|---|---|
| End-to-end demo rehearsal on Sepolia (frontend pulling live state) | ❌ — waits on frontend wiring PR |
| Pitch finalisation | ❌ — Day 3 (Nahin owns) |

## Reference

| Resource | Where |
|---|---|
| Source of truth scope | `docs/BRIEF.md` |
| Scope evolution | `docs/CHANGELOG.md` |
| Session bootstrap | `docs/HANDOFF.md` |
| EU ETS reality research | `docs/research/eu-ets-reality-check.md` |
| Demo design spec | `docs/design/happy-flow.md` |
| Sepolia + ENS addresses | `contracts/script/addresses.json` |
| Sepolia Etherscan (Regulator) | https://sepolia.etherscan.io/address/0x77778bf033d88c459a912c435e7a8a2460a2c08e |
