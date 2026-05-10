// Sepolia Etherscan deep links — every tx hash and verified address on
// the live UI is one click from chain truth. Core to the "regulator-
// supervised on-chain" pitch: judges click any name, any tx, any amount,
// follow it back to the chain in one step.
//
// Display as monospace short-hash. Hover reveals the full hash via the
// native title tooltip. Click opens the explorer in a new tab.
//
// Server-renderable — no hooks. Use the read-only variants in route
// pages directly; the client wallet-action panels can import the same
// components since they're plain anchor tags.

import type { Address } from "viem";
import { addressForEns } from "@/lib/contracts";

const ETHERSCAN_BASE = "https://sepolia.etherscan.io";

function shortenHex(hex: string, head = 6, tail = 4): string {
  if (hex.length <= head + tail + 2) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

export function EtherscanTx({
  hash,
  short,
  className = "",
}: {
  hash: string;
  /** Optional pre-shortened display, e.g. "0x4d1a…7e2" — saves shortening twice when caller already trimmed. */
  short?: string;
  className?: string;
}) {
  const display = short ?? shortenHex(hash);
  return (
    <a
      href={`${ETHERSCAN_BASE}/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${hash} — open on Sepolia Etherscan`}
      className={`font-mono text-[11px] text-success hover:underline ${className}`}
    >
      {display}
      <span aria-hidden className="ml-[3px] opacity-70 text-[9px]">
        ↗
      </span>
    </a>
  );
}

export function EtherscanAddress({
  address,
  label,
  className = "",
}: {
  address: Address | string;
  /** Display override (e.g. ENS name). Falls back to shortened address. */
  label?: string;
  className?: string;
}) {
  const display = label ?? shortenHex(address);
  return (
    <a
      href={`${ETHERSCAN_BASE}/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${address} — open on Sepolia Etherscan`}
      className={`font-mono text-[11px] text-success hover:underline ${className}`}
    >
      {display}
      <span aria-hidden className="ml-[3px] opacity-70 text-[9px]">
        ↗
      </span>
    </a>
  );
}

/**
 * Renders an ENS-style entity name as a clickable link to its Sepolia
 * Etherscan address page when the name is known in our ACTOR_ENS map.
 * Falls back to a plain styled span otherwise. No trailing arrow — kept
 * lean for inline use in audit-log rows where a row may chain several names.
 */
export function EnsLink({
  name,
  address,
  className = "",
}: {
  name: string;
  /** Override the address lookup (use when caller already has the address). */
  address?: Address;
  className?: string;
}) {
  const addr = address ?? addressForEns(name);
  if (!addr) {
    return (
      <span className={`font-mono text-success text-xs ${className}`}>
        {name}
      </span>
    );
  }
  return (
    <a
      href={`${ETHERSCAN_BASE}/address/${addr}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} · ${addr} — open on Sepolia Etherscan`}
      className={`font-mono text-success text-xs hover:underline ${className}`}
    >
      {name}
    </a>
  );
}

/**
 * Small icon-button link to the ENS profile page on Sepolia, where the
 * full text-records (name, ticker, EU-ETS compliance per year, etc.) are
 * visible. Pair with the entity's display name for the Etherscan-style
 * "click any name → chain truth" affordance.
 */
export function EnsAppLink({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <a
      href={`https://sepolia.app.ens.domains/${name}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${name} — open ENS profile (records, attestations) on Sepolia`}
      aria-label={`Open ${name} on ENS app`}
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-success/60 hover:text-success hover:bg-success/10 transition-colors ${className}`}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </a>
  );
}

/**
 * "Sourcify-verified ✓" badge that links to the contract on Etherscan
 * (Etherscan picks up Sourcify verification automatically when both have it).
 */
export function EtherscanSourcify({
  address,
  className = "",
}: {
  address: Address | string;
  className?: string;
}) {
  return (
    <a
      href={`${ETHERSCAN_BASE}/address/${address}#code`}
      target="_blank"
      rel="noopener noreferrer"
      title={`${address} — verified contract source on Etherscan`}
      className={`inline-flex items-center gap-[5px] text-[10px] tracking-[0.08em] uppercase text-success font-semibold hover:underline ${className}`}
    >
      <span aria-hidden>✓</span>Sourcify-verified
    </a>
  );
}
