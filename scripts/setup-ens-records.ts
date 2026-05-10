// Populate ENS text records for the verified-entity.eth subdomains.
//
// Story coherence: ESMA already publishes name-and-shame for ETS violators
// on their public site (HTML, not queryable). This script writes the same
// kind of record onto each subdomain via setText() — regulator-signed,
// historical, machine-readable. ENS becomes the registry substrate for
// EU-ETS compliance attestations, not a decorative naming layer.
//
// Run from repo root:
//   set -a && source contracts/.env && set +a && bun run scripts/setup-ens-records.ts
//
// Idempotent: setText on the same key just overwrites. Re-run safely.

import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
  parseAbi,
  type Address,
} from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// ─── Config ────────────────────────────────────────────────────────────────

const RPC_URL = process.env.SEPOLIA_RPC_URL;
const REGULATOR_PK = process.env.PRIVATE_KEY as `0x${string}` | undefined;

if (!RPC_URL) {
  console.error("FATAL: SEPOLIA_RPC_URL env var required (load from contracts/.env)");
  process.exit(1);
}
if (!REGULATOR_PK || !REGULATOR_PK.startsWith("0x")) {
  console.error("FATAL: PRIVATE_KEY (regulator wallet, controls ENS names) env var required");
  process.exit(1);
}

// ENS Registry on Sepolia (same address as mainnet)
const ENS_REGISTRY: Address = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

const ENS_REGISTRY_ABI = parseAbi([
  "function resolver(bytes32 node) view returns (address)",
]);

const RESOLVER_ABI = parseAbi([
  "function setText(bytes32 node, string key, string value) external",
  "function text(bytes32 node, string key) view returns (string)",
]);

// ─── Records to write ─────────────────────────────────────────────────────
//
// Standard text record keys (per ENS docs): name, description, url, avatar,
// com.twitter, com.github, etc. Custom keys allowed — we use the
// "eth.eu-ets.*" prefix for EU-ETS-specific compliance attestations.

type RecordSet = Record<string, string>;

const RECORDS: Record<string, RecordSet> = {
  "cement-mainz.verified-entity.eth": {
    name: "Cement Mainz GmbH",
    description: "Cement clinker producer · Mainz, DE · Phase IV verified emitter",
    url: "https://eu-ets-registry.example.eu/operator/de-cement-mainz",
    "com.ticker": "CEMNZ",
    "eth.eu-ets.compliance.2024": "VERIFIED · 980 EUA surrendered against verified emissions",
    "eth.eu-ets.compliance.2025": "VERIFIED · 1,020 EUA surrendered against verified emissions",
  },
  "aluminium-bratislava.verified-entity.eth": {
    name: "Aluminium Bratislava s.r.o.",
    description: "Aluminium smelter · Bratislava, SK · Phase IV verified emitter",
    url: "https://eu-ets-registry.example.eu/operator/sk-aluminium-bratislava",
    "com.ticker": "ALUBRA",
    "eth.eu-ets.compliance.2024": "VIOLATED · €34,500 excess-emission penalty · ref ESMA-2024-EUR-447",
    "eth.eu-ets.compliance.2025": "VERIFIED · 820 EUA surrendered against verified emissions",
  },
};

// ─── Execute ──────────────────────────────────────────────────────────────

const account = privateKeyToAccount(REGULATOR_PK);
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});

console.log("Setting EU-ETS compliance records on verified-entity.eth subdomains");
console.log(`  Acting as: regulator at ${account.address}`);
console.log("");

for (const [name, records] of Object.entries(RECORDS)) {
  const node = namehash(name);
  console.log(`▸ ${name}`);
  console.log(`  namehash: ${node}`);

  const resolver = await publicClient.readContract({
    address: ENS_REGISTRY,
    abi: ENS_REGISTRY_ABI,
    functionName: "resolver",
    args: [node],
  });

  if (!resolver || resolver === "0x0000000000000000000000000000000000000000") {
    console.error(`  ✗ no resolver set for ${name} — register the name + set resolver in ENS app first`);
    continue;
  }
  console.log(`  resolver: ${resolver}`);

  for (const [key, value] of Object.entries(records)) {
    try {
      const hash = await walletClient.writeContract({
        address: resolver,
        abi: RESOLVER_ABI,
        functionName: "setText",
        args: [node, key, value],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ ${key}  →  ${value.slice(0, 60)}${value.length > 60 ? "…" : ""}  (block ${receipt.blockNumber})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${key} failed: ${msg.slice(0, 200)}`);
    }
  }
  console.log("");
}

console.log("✓ ENS records populated. Verify on https://sepolia.app.ens.domains/cement-mainz.verified-entity.eth");
