// Carbon DEX — deployed addresses + minimal ABIs.
//
// Sepolia deployment: 2026-05-10, all 6 contracts Sourcify exact_match.
// Source of truth: contracts/script/addresses.json.
//
// ABIs declared inline via parseAbi (human-readable strings) for clarity
// and tree-shaking. Only events + read functions used by the frontend
// are listed; admin / mutating calls live in the contract source itself.

import { parseAbi, type Address } from "viem";
import { sepolia, foundry } from "viem/chains";

// ─────────────────────────────────────────────────────────────────────────
// Networks
// ─────────────────────────────────────────────────────────────────────────

export const SEPOLIA = {
  chain: sepolia,
  contracts: {
    // Re-synced 2026-05-10 from contracts/script/addresses.json after fresh
    // reset-demo.sh redeploy. Chain seeded (350k/5k pool, B has 500 EUA
    // inventory) but A has zero allocations yet — clicking Execute on
    // /regulator starts the demo flow.
    EURS: "0x4b0ef7cd80f45e8e8c3aa6571e865f99cf080e33" as Address,
    ComplianceRegistry: "0x667f0235cf1ca841d75592663ea28bf88da28d93" as Address,
    CarbonCredit: "0xfb05601e1e3c188688cfb6a13167a0d369e6f196" as Address,
    Retirement: "0x36523834ea166b47e05213ec9f27f35dea6b8dc7" as Address,
    CarbonDEX: "0x55aaec9eda82b25c48840be2c4e920b7696fbd1d" as Address,
    Regulator: "0xe8927f6955016bf11760530ef3c0764d04f9d4ea" as Address,
  },
  // Demo wallets — all from contracts/script/addresses.json `ens` section.
  // ENS subdomain registrations on Sepolia are pending; for now the UI maps
  // these addresses → readable names via ACTOR_ENS below.
  wallets: {
    regulator: "0xE6fff6076BD6d82d3071b451BAba308C0fA97E1c" as Address,
    companyA: "0xEd271DB443dc53533D2edB3A5d4b3BF0F3DE70ED" as Address, // cement-mainz
    companyB: "0x6B6Fdc8Ed3d79812d0C28ed4C219e760817B9a5d" as Address, // aluminium-bratislava
  },
} as const;

export const FOUNDRY = {
  chain: foundry,
  contracts: {
    EURS: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as Address,
    ComplianceRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as Address,
    CarbonCredit: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as Address,
    Retirement: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as Address,
    CarbonDEX: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" as Address,
    Regulator: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as Address,
  },
  wallets: {
    regulator: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address, // anvil[0]
    companyA: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address, // anvil[1]
    companyB: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address, // anvil[2]
  },
} as const;

// Reverse-lookup table for address → readable name in audit log / ledger rows.
// Until ENS subdomains are registered on Sepolia, this is the source of truth
// for ENS-style display.
export const ACTOR_ENS: Record<string, string> = {
  [SEPOLIA.wallets.regulator.toLowerCase()]: "eu-ets-authority.eth",
  [SEPOLIA.wallets.companyA.toLowerCase()]: "cement-mainz.verified-entity.eth",
  [SEPOLIA.wallets.companyB.toLowerCase()]: "aluminium-bratislava.verified-entity.eth",
  [SEPOLIA.contracts.CarbonDEX.toLowerCase()]: "Carbon DEX Pool",
  [FOUNDRY.wallets.regulator.toLowerCase()]: "eu-ets-authority.eth",
  [FOUNDRY.wallets.companyA.toLowerCase()]: "cement-mainz.verified-entity.eth",
  [FOUNDRY.wallets.companyB.toLowerCase()]: "aluminium-bratislava.verified-entity.eth",
  [FOUNDRY.contracts.CarbonDEX.toLowerCase()]: "Carbon DEX Pool",
};

export function ensFor(address: Address | string): string {
  const lowered = address.toLowerCase();
  return ACTOR_ENS[lowered] ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Reverse map: ENS-style display name → underlying Address. Used by
// EnsLink to make every on-screen entity name click-through-able to
// Sepolia Etherscan, so judges can verify any actor in one click.
export const ENS_TO_ADDRESS: Record<string, Address> = (() => {
  const out: Record<string, Address> = {};
  for (const [addr, ens] of Object.entries(ACTOR_ENS)) {
    if (!(ens in out)) out[ens] = addr as Address;
  }
  return out;
})();

export function addressForEns(name: string): Address | null {
  return ENS_TO_ADDRESS[name] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// ABIs (minimal — only what the frontend reads)
// ─────────────────────────────────────────────────────────────────────────

export const CARBON_CREDIT_ABI = parseAbi([
  "event CreditMinted(address indexed to, uint256 amount, uint16 vintage, bytes2 sector, bytes2 originCountry, bytes32 issuanceRef)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

export const CARBON_DEX_ABI = parseAbi([
  "event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, bool isEURSIn)",
  "event LiquidityAdded(address indexed provider, uint256 amountEURS, uint256 amountCredit, uint256 lpMinted)",
  "function getReserves() view returns (uint256 _reserveEURS, uint256 _reserveCredit)",
  "function getSpotPrice() view returns (uint256)",
  "function swapCreditForEURS(uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  "function swapEURSForCredit(uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  "function swapCreditForEURSExactOut(uint256 amountOut, uint256 maxAmountIn) returns (uint256 amountIn)",
  "function swapEURSForCreditExactOut(uint256 amountOut, uint256 maxAmountIn) returns (uint256 amountIn)",
]);

export const RETIREMENT_ABI = parseAbi([
  "event Retired(address indexed from, uint256 amount, address indexed beneficiary, string reasonURI, uint256 timestamp)",
  "function retire(uint256 amount, address beneficiary, string reasonURI)",
]);

export const COMPLIANCE_REGISTRY_ABI = parseAbi([
  "event CompanyRegistered(address indexed company, string country, uint8 sector)",
  "event CompanyFrozen(address indexed company, string reason)",
  "event CompanyUnfrozen(address indexed company)",
  "function isVerified(address account) view returns (bool)",
]);

export const REGULATOR_ABI = parseAbi([
  "event RegulatoryAction(uint8 indexed actionType, address indexed target, address indexed by, string reason, uint256 timestamp)",
  "function issueAllowance(address to, uint256 amount, uint16 vintage, bytes2 sector, bytes2 originCountry, bytes32 issuanceRef)",
]);

export const EURS_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);
