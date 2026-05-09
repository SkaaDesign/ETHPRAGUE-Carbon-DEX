import { http } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// WalletConnect project ID — required by RainbowKit's getDefaultConfig.
// Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local for production.
// `||` (not `??`) so an empty-string env value falls back to the placeholder
// — RainbowKit's runtime check rejects empty `projectId` outright with
// "No projectId found", which breaks static prerendering at build time.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "0000000000000000000000000000000000000000000000000000000000000000";

export const config = getDefaultConfig({
  appName: "Carbon DEX",
  projectId,
  chains: [foundry, sepolia],
  transports: {
    // Local anvil — DemoLocal.s.sol seeds the happy-flow state here.
    [foundry.id]: http("http://127.0.0.1:8545"),
    // Sepolia — public RPC fallback. Override via NEXT_PUBLIC_SEPOLIA_RPC_URL.
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
  ssr: true,
});
