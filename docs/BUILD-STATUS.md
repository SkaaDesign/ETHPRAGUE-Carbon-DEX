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
| Write 6 contracts | ✅ 6/6 — all six done |
| Write tests | ✅ 72 pass in ~17ms — EURS (5), CR (16), CC (13), Retirement (8), DEX (19), Regulator (11). Includes exact-output swap + burnFrom-allowance + audit + DEX view tests. |
| Devils-advocate review pass | ✅ PROCEED verdict; 3 issues fixed (Demo.s.sol numbers, burnFrom allowance, fresh-anvil doc comment) |
| Exact-output swap functions on DEX | ✅ swapEURSForCreditExactOut + swapCreditForEURSExactOut + getAmountIn quote helper |
| Deploy.s.sol — single-tx deploy + role wiring | ✅ |
| DemoLocal.s.sol — happy flow (deploy + seed + 3 beats) | ✅ |
| Local end-to-end on anvil (happy flow) | ✅ runs clean — issue → trade → retire |
| Test wallet + Sepolia RPC + faucet ETH | ❌ |
| Deploy to Sepolia | ❌ |
| Sourcify verify | ❌ |
| ENS names registered (Sepolia ENS app) | ❌ |
| `npx create-next-app web/` | ❌ |
| Three routes built per design | ❌ |
| Frontend wired to contracts via viem | ❌ |
| Wallet connection (RainbowKit vs Privy — open) | ❌ |
| End-to-end demo on Sepolia | ❌ |
