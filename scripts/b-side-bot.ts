// b-side-bot.ts — Off-stage automation for Company B's matching DEX trade.
//
// Mirrors A's trades in BOTH directions so A can trade freely on stage:
//   A sells N EUA → bot fires B's swapEURSForCreditExactOut(N, maxIn)  → B buys N
//   A buys  N EUA → bot fires B's swapCreditForEURS(N, 0)              → B sells N
//
// Pool returns near-balanced after each pair; LP fees accrue. Audience sees
// /public ticker tick twice within ~5 seconds; narrator: "the AMM matched
// her trade with the next compliance counterparty."
//
// Pre-seed: B needs both EURS (auto-faucets at startup) AND CarbonCredit
// inventory (Deploy.s.sol pre-issues 500 EUA to B at deploy time). B also
// pre-approves the DEX for both tokens at startup.
//
// Run from repo root:  bash scripts/run-b-bot.sh
//
// Required env (loaded from contracts/.env via the wrapper):
//   SEPOLIA_RPC_URL   — Alchemy/Infura/etc.
//   COMPANY_B_PK      — Company B's private key
//
// After every fresh redeploy (new DEX address), restart the bot.

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
const CARBON_CREDIT: Address = getAddress(sepoliaContracts.CarbonCredit);
const COMPANY_A: Address = getAddress(addresses.ens.companyA.address);

const account = privateKeyToAccount(COMPANY_B_PK);
const COMPANY_B: Address = account.address;

// ─── Minimal ABIs ──────────────────────────────────────────────────────────

const DEX_ABI = parseAbi([
  "event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, bool isEURSIn)",
  "function swapEURSForCreditExactOut(uint256 amountOut, uint256 maxAmountIn) returns (uint256)",
  "function swapCreditForEURS(uint256 amountIn, uint256 minAmountOut) returns (uint256)",
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

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
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
  // EURS approval (B spends EURS when buying CarbonCredit, mirroring A's sells)
  const eursAllowance = (await publicClient.readContract({
    address: EURS,
    abi: EURS_ABI,
    functionName: "allowance",
    args: [COMPANY_B, DEX],
  })) as bigint;

  if (eursAllowance < TARGET_EURS_BALANCE) {
    console.log("  → approving DEX for unlimited EURS spend...");
    const hash = await walletClient.writeContract({
      address: EURS,
      abi: EURS_ABI,
      functionName: "approve",
      args: [DEX, MAX_UINT256],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ EURS approve tx ${hash}`);
  } else {
    console.log("  → DEX already approved for EURS");
  }

  // CarbonCredit approval (B spends CarbonCredit when selling, mirroring A's buys)
  const ccAllowance = (await publicClient.readContract({
    address: CARBON_CREDIT,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [COMPANY_B, DEX],
  })) as bigint;

  if (ccAllowance < parseUnits("1000", 18)) {
    console.log("  → approving DEX for unlimited CarbonCredit spend...");
    const hash = await walletClient.writeContract({
      address: CARBON_CREDIT,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [DEX, MAX_UINT256],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ CarbonCredit approve tx ${hash}`);
  } else {
    console.log("  → DEX already approved for CarbonCredit");
  }

  // Inventory check (CarbonCredit, for selling)
  const ccBalance = (await publicClient.readContract({
    address: CARBON_CREDIT,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [COMPANY_B],
  })) as bigint;
  console.log(`  B CarbonCredit balance: ${fmt(ccBalance)} EUA`);
  if (ccBalance === 0n) {
    console.log("  ⚠  B has no CarbonCredit inventory — bot can buy but not sell.");
    console.log("     Deploy.s.sol pre-seeds B with 500 EUA; re-deploy if missing.");
  }
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

console.log("Subscribing to DEX Swap events (mirrors both directions)...");
publicClient.watchContractEvent({
  address: DEX,
  abi: DEX_ABI,
  eventName: "Swap",
  onLogs: async (logs) => {
    for (const log of logs) {
      const sender = log.args.sender as Address | undefined;
      const isEURSIn = log.args.isEURSIn as boolean | undefined;
      const amountIn = log.args.amountIn as bigint | undefined;
      const amountOut = log.args.amountOut as bigint | undefined;

      if (!sender || amountIn === undefined || amountOut === undefined || isEURSIn === undefined) continue;

      // Only react to A's swaps; ignore our own (B's) and any other party's
      if (getAddress(sender) !== COMPANY_A) continue;

      const ts = new Date().toISOString();

      if (isEURSIn) {
        // A bought CarbonCredit (paid EURS, got Credit). B mirrors by SELLING the same Credit qty.
        const creditQty = amountOut;
        console.log(`\n[${ts}] A bought ${fmt(creditQty)} EUA for ${fmt(amountIn)} EURS (tx ${log.transactionHash})`);
        console.log(`  → firing B's matching SELL of ${fmt(creditQty)} EUA...`);
        try {
          const hash = await walletClient.writeContract({
            address: DEX,
            abi: DEX_ABI,
            functionName: "swapCreditForEURS",
            args: [creditQty, 0n], // exact-input on credit; minOut = 0 (mirror context, accept any)
          });
          console.log(`  ✓ B sell submitted: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log(`  ✓ confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`);
        } catch (err) {
          console.error("  ✗ B's sell failed:", err);
        }
      } else {
        // A sold CarbonCredit (paid Credit, got EURS). B mirrors by BUYING the same Credit qty.
        const creditQty = amountIn;
        console.log(`\n[${ts}] A sold ${fmt(creditQty)} EUA for ${fmt(amountOut)} EURS (tx ${log.transactionHash})`);
        console.log(`  → firing B's matching BUY of ${fmt(creditQty)} EUA...`);
        try {
          const hash = await walletClient.writeContract({
            address: DEX,
            abi: DEX_ABI,
            functionName: "swapEURSForCreditExactOut",
            args: [creditQty, TARGET_EURS_BALANCE], // exact-output on credit; max EURS spend caps it
          });
          console.log(`  ✓ B buy submitted: ${hash}`);
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log(`  ✓ confirmed in block ${receipt.blockNumber} (status: ${receipt.status})`);
        } catch (err) {
          console.error("  ✗ B's buy failed:", err);
        }
      }
    }
  },
  onError: (err) => console.error("watcher error:", err),
});

console.log("✓ Watching. Ctrl-C to stop.\n");
