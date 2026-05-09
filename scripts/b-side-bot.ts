// b-side-bot.ts — Off-stage automation for Company B's matching DEX purchase.
//
// During the live demo, Company A clicks "Sell" on /company. That fires
// CarbonDEX.swapCreditForEURS on Sepolia. This bot watches the chain for
// that event; the moment it sees A's swap, it fires B's matching
// swapEURSForCreditExactOut so the 200 EUA flow from A → pool → B in real
// time. Audience sees the /public ticker tick twice within ~5 seconds:
// "A sold 200 EUA · B bought 200 EUA". Narrator: "the AMM matched her sale
// with the next compliance buyer."
//
// Run from repo root:
//   bun run scripts/b-side-bot.ts
//
// Required env (loaded from contracts/.env automatically — see Bun docs):
//   SEPOLIA_RPC_URL   — Alchemy/Infura/etc.
//   COMPANY_B_PK      — Company B's private key
//
// On startup, the bot:
//   1. Reads DEX + EURS addresses from contracts/script/addresses.json
//   2. Faucets B with 20k EURS if balance is low
//   3. Approves DEX for unlimited EURS spend (one-time per DEX address)
//   4. Subscribes to DEX Swap events
//   5. On A's sell → fires B's matching exact-output buy
//
// After a fresh redeploy (new DEX address), restart the bot.

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
  getAddress,
  type Address,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import addresses from "../contracts/script/addresses.json";

// ─── Config ────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SEPOLIA_RPC_URL;
const COMPANY_B_PK = process.env.COMPANY_B_PK as `0x${string}` | undefined;

if (!RPC_URL) {
  console.error("FATAL: SEPOLIA_RPC_URL env var required (load from contracts/.env)");
  process.exit(1);
}
if (!COMPANY_B_PK || !COMPANY_B_PK.startsWith("0x")) {
  console.error("FATAL: COMPANY_B_PK env var required (0x... format)");
  process.exit(1);
}

const sepoliaContracts = addresses.networks.sepolia.contracts;
const DEX: Address = getAddress(sepoliaContracts.CarbonDEX);
const EURS: Address = getAddress(sepoliaContracts.EURS);
const COMPANY_A: Address = getAddress(addresses.ens.companyA.address);

const account = privateKeyToAccount(COMPANY_B_PK);
const COMPANY_B: Address = account.address;

// ─── Minimal ABIs ──────────────────────────────────────────────────────────

const DEX_ABI = parseAbi([
  "event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, bool isEURSIn)",
  "function swapEURSForCreditExactOut(uint256 amountOut, uint256 maxAmountIn) returns (uint256)",
  "function reserveEURS() view returns (uint256)",
  "function reserveCredit() view returns (uint256)",
]);

const EURS_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet(uint256 amount)",
  "function FAUCET_MAX() view returns (uint256)",
]);

// ─── Clients ───────────────────────────────────────────────────────────────

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });

// ─── Helpers ───────────────────────────────────────────────────────────────

const MAX_UINT256 = 2n ** 256n - 1n;
const TARGET_EURS_BALANCE = parseUnits("20000", 18); // 20k buffer for B's purchases
const FAUCET_AMOUNT = parseUnits("20000", 18);

function fmt(wei: bigint, decimals = 18): string {
  return (Number(wei) / 10 ** decimals).toFixed(2);
}

async function ensureFunded() {
  const balance = (await publicClient.readContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "balanceOf",
    args: [COMPANY_B],
  })) as bigint;

  console.log(`  B EURS balance: ${fmt(balance)}`);
  if (balance >= TARGET_EURS_BALANCE) {
    console.log("  → already funded, skipping faucet");
    return;
  }

  const faucetMax = (await publicClient.readContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "FAUCET_MAX",
  })) as bigint;
  const claim = FAUCET_AMOUNT < faucetMax ? FAUCET_AMOUNT : faucetMax;
  console.log(`  → faucet-minting ${fmt(claim)} EURS to B...`);

  const hash = await walletClient.writeContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "faucet",
    args: [claim],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ✓ faucet tx ${hash}`);
}

async function ensureApproved() {
  const allowance = (await publicClient.readContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "allowance",
    args: [COMPANY_B, DEX],
  })) as bigint;

  if (allowance >= TARGET_EURS_BALANCE) {
    console.log("  → DEX already approved for unlimited EURS, skipping");
    return;
  }

  console.log("  → approving DEX for unlimited EURS spend...");
  const hash = await walletClient.writeContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "approve",
    args: [DEX, MAX_UINT256],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ✓ approve tx ${hash}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

console.log("─── B-side bot starting ───");
console.log(`  DEX:       ${DEX}`);
console.log(`  EURS:      ${EURS}`);
console.log(`  Watching:  Company A swaps from ${COMPANY_A}`);
console.log(`  Acting as: Company B at ${COMPANY_B}`);
console.log("");

console.log("Pre-flight:");
await ensureFunded();
await ensureApproved();
console.log("");

console.log("Subscribing to DEX Swap events...");
publicClient.watchContractEvent({
  address: DEX,
  abi: DEX_ABI,
  eventName: "Swap",
  onLogs: async (logs) => {
    for (const log of logs) {
      const sender = log.args.sender as Address | undefined;
      const isEURSIn = log.args.isEURSIn as boolean | undefined;
      const amountIn = log.args.amountIn as bigint | undefined;

      if (!sender || amountIn === undefined) continue;

      // Only react when A is the seller (i.e., A swapped Credit -> EURS)
      if (getAddress(sender) !== COMPANY_A) continue;
      if (isEURSIn) continue; // skip EURS-in swaps; we want Credit-in swaps

      console.log(`\n[${new Date().toISOString()}] A sold ${fmt(amountIn)} EUA (tx ${log.transactionHash})`);
      console.log(`  → firing B's matching buy of ${fmt(amountIn)} EUA...`);

      try {
        const hash = await walletClient.writeContract({
          address: DEX,
          abi: DEX_ABI,
          functionName: "swapEURSForCreditExactOut",
          args: [amountIn, TARGET_EURS_BALANCE], // amountOut = match A's sale; maxIn = our 20k buffer
        });
        console.log(`  ✓ B buy submitted: ${hash}`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`  ✓ confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`);
      } catch (err) {
        console.error("  ✗ B's buy failed:", err);
      }
    }
  },
  onError: (err) => console.error("watcher error:", err),
});

console.log("✓ Watching. Ctrl-C to stop.\n");
