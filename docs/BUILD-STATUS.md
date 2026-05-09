# Build status

Snapshot of where the build stands on `docs/scope-update`. Flip ❌ → ✅ as items land.

| Phase | Status |
|---|---|
| Foundry installed (v1.7.1, in `~/.bashrc`) | ✅ |
| Scope locked (BRIEF v2, design, research) | ✅ |
| Lin has UI mockups for the demo | ✅ |
| `.gitignore` hardened + scoped to `contracts/` | ✅ |
| `forge init contracts/` (with proper parent-repo submodule for forge-std) | ✅ |
| OpenZeppelin v5.6.1 installed (submodule) | ✅ |
| AMM architecture decided: custom CPMM (V2-style math, no V2 install) | ✅ |
| Write 6 contracts | 🟡 3/6 — EURS, ComplianceRegistry, CarbonCredit done |
| Write tests | 🟡 3/6 — EURS (5), ComplianceRegistry (12), CarbonCredit (12) — 29 pass |
| Local end-to-end on anvil (happy flow) | ❌ |
| Test wallet + Sepolia RPC + faucet ETH | ❌ |
| Deploy to Sepolia | ❌ |
| Sourcify verify | ❌ |
| ENS names registered (Sepolia ENS app) | ❌ |
| `npx create-next-app web/` | ❌ |
| Three routes built per design | ❌ |
| Frontend wired to contracts via viem | ❌ |
| Wallet connection (RainbowKit vs Privy — open) | ❌ |
| End-to-end demo on Sepolia | ❌ |
