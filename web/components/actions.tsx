"use client";

// Wallet sign-and-broadcast action buttons.
//
// Each button:
//   1. Reads the connected wallet via wagmi (RainbowKit ConnectButton if none)
//   2. Submits one or two transactions via useWriteContract
//   3. Awaits receipt via useWaitForTransactionReceipt
//   4. Calls router.refresh() so server components re-fetch chain state and
//      tiles update with the new on-chain reality
//
// Sell + Retire are 2-tx flows (approve → action). Issuance is single-tx.
//
// On stage: regulator laptop clicks Issue → company A laptop clicks Sell
// → company A laptop clicks Retire. Three laptops, three role-specific
// wallets, four real Sepolia transactions in total. (B's matching purchase
// is fired off-stage by contracts/script/b-side-bot.ts.)

import { useEffect, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther, stringToHex } from "viem";
import { useRouter } from "next/navigation";

import {
  SEPOLIA,
  REGULATOR_ABI,
  CARBON_CREDIT_ABI,
  CARBON_DEX_ABI,
  RETIREMENT_ABI,
} from "@/lib/contracts";

import { CTAButton } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────────────
// Demo constants — match main-session resolution numbers
// ─────────────────────────────────────────────────────────────────────────

const ISSUE_AMOUNT = parseEther("1000");
const ISSUE_VINTAGE = 2026;
const ISSUE_SECTOR = stringToHex("IN", { size: 2 });
const ISSUE_ORIGIN = stringToHex("DE", { size: 2 });
const ISSUE_REF = stringToHex("2026-FA-DE-001", { size: 32 });

const SELL_AMOUNT = parseEther("200");
// ~3% slippage tolerance vs ~13,422 expected proceeds
const SELL_MIN_OUT = parseEther("13000");

const DEFAULT_RETIRE_AMOUNT = "800";
const DEFAULT_RETIRE_URI = "ipfs://QmYz2026SustainabilityReport.pdf";

// ─────────────────────────────────────────────────────────────────────────
// IssueButton — regulator clicks Execute on the scheduled-events row
// Single transaction: Regulator.issueAllowance(...)
// ─────────────────────────────────────────────────────────────────────────

export function IssueButton() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [isSuccess, router]);

  if (!isConnected) {
    return <ConnectButton showBalance={false} />;
  }

  const isRegulator =
    address?.toLowerCase() === SEPOLIA.wallets.regulator.toLowerCase();

  const handleClick = () => {
    writeContract({
      address: SEPOLIA.contracts.Regulator,
      abi: REGULATOR_ABI,
      functionName: "issueAllowance",
      args: [
        SEPOLIA.wallets.companyA,
        ISSUE_AMOUNT,
        ISSUE_VINTAGE,
        ISSUE_SECTOR,
        ISSUE_ORIGIN,
        ISSUE_REF,
      ],
    });
  };

  const label = isPending
    ? "Sign in wallet…"
    : isConfirming
      ? "Confirming…"
      : isSuccess
        ? "Executed ✓"
        : "Execute →";

  return (
    <div className="flex flex-col items-end gap-1">
      <CTAButton
        variant="warn"
        onClick={handleClick}
        disabled={!isRegulator || isPending || isConfirming || isSuccess}
      >
        {label}
      </CTAButton>
      {!isRegulator && (
        <span className="text-[9px] text-danger font-mono uppercase tracking-[0.08em]">
          regulator wallet only
        </span>
      )}
      {error && (
        <span className="text-[9px] text-danger font-mono">
          {error.message.slice(0, 80)}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SellButton — company A sells 200 surplus EUA into the pool
// 2-tx flow: approve(DEX, 200) → swapCreditForEURS(200, minOut)
// ─────────────────────────────────────────────────────────────────────────

export function SellButton() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [phase, setPhase] = useState<
    "idle" | "approving" | "swapping" | "done"
  >("idle");

  const approveTx = useWriteContract();
  const swapTx = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveTx.data });
  const swapReceipt = useWaitForTransactionReceipt({ hash: swapTx.data });

  // Auto-advance approve → swap when approve confirms
  useEffect(() => {
    if (approveReceipt.isSuccess && phase === "approving" && !swapTx.data) {
      setPhase("swapping");
      swapTx.writeContract({
        address: SEPOLIA.contracts.CarbonDEX,
        abi: CARBON_DEX_ABI,
        functionName: "swapCreditForEURS",
        args: [SELL_AMOUNT, SELL_MIN_OUT],
      });
    }
  }, [approveReceipt.isSuccess, phase, swapTx]);

  // Refresh route on swap success
  useEffect(() => {
    if (swapReceipt.isSuccess && phase === "swapping") {
      setPhase("done");
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [swapReceipt.isSuccess, phase, router]);

  if (!isConnected) {
    return <ConnectButton showBalance={false} />;
  }

  const isCompanyA =
    address?.toLowerCase() === SEPOLIA.wallets.companyA.toLowerCase();

  const handleClick = () => {
    setPhase("approving");
    approveTx.writeContract({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "approve",
      args: [SEPOLIA.contracts.CarbonDEX, SELL_AMOUNT],
    });
  };

  const isBusy = phase === "approving" || phase === "swapping";

  const label =
    phase === "approving" && approveTx.isPending
      ? "Approve in wallet (1/2)…"
      : phase === "approving" && approveReceipt.isLoading
        ? "Approving (1/2)…"
        : phase === "swapping" && swapTx.isPending
          ? "Sign swap (2/2)…"
          : phase === "swapping" && swapReceipt.isLoading
            ? "Swapping (2/2)…"
            : phase === "done"
              ? "Sold ✓"
              : "Sell 200 EUA →";

  return (
    <div className="flex flex-col gap-2">
      <CTAButton
        onClick={handleClick}
        disabled={!isCompanyA || isBusy || phase === "done"}
      >
        {label}
      </CTAButton>
      {!isCompanyA && (
        <span className="text-[9px] text-danger font-mono uppercase tracking-[0.08em]">
          cement-mainz wallet only
        </span>
      )}
      {(approveTx.error || swapTx.error) && (
        <span className="text-[9px] text-danger font-mono">
          {(approveTx.error?.message || swapTx.error?.message || "").slice(
            0,
            80,
          )}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RetireButton — company A surrenders all remaining 800 EUA
// Form: amount, reasonURI, fictive PDF upload
// 2-tx flow: approve(Retirement, amount) → retire(amount, ben, uri)
// ─────────────────────────────────────────────────────────────────────────

export function RetireButton() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(DEFAULT_RETIRE_AMOUNT);
  const [reasonURI, setReasonURI] = useState(DEFAULT_RETIRE_URI);
  const [fakeFileName, setFakeFileName] = useState<string | null>(null);

  const [phase, setPhase] = useState<
    "idle" | "approving" | "retiring" | "done"
  >("idle");

  const approveTx = useWriteContract();
  const retireTx = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveTx.data });
  const retireReceipt = useWaitForTransactionReceipt({ hash: retireTx.data });

  useEffect(() => {
    if (approveReceipt.isSuccess && phase === "approving" && !retireTx.data) {
      setPhase("retiring");
      retireTx.writeContract({
        address: SEPOLIA.contracts.Retirement,
        abi: RETIREMENT_ABI,
        functionName: "retire",
        args: [
          parseEther(amount || "0"),
          SEPOLIA.wallets.companyA,
          reasonURI,
        ],
      });
    }
  }, [approveReceipt.isSuccess, phase, retireTx, amount, reasonURI]);

  useEffect(() => {
    if (retireReceipt.isSuccess && phase === "retiring") {
      setPhase("done");
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [retireReceipt.isSuccess, phase, router]);

  if (!isConnected) {
    return <ConnectButton showBalance={false} />;
  }

  const isCompanyA =
    address?.toLowerCase() === SEPOLIA.wallets.companyA.toLowerCase();

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) return;
    setPhase("approving");
    approveTx.writeContract({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "approve",
      args: [SEPOLIA.contracts.Retirement, parseEther(amount)],
    });
  };

  const isBusy = phase === "approving" || phase === "retiring";

  const label =
    phase === "approving" && approveTx.isPending
      ? "Approve in wallet (1/2)…"
      : phase === "approving" && approveReceipt.isLoading
        ? "Approving (1/2)…"
        : phase === "retiring" && retireTx.isPending
          ? "Sign surrender (2/2)…"
          : phase === "retiring" && retireReceipt.isLoading
            ? "Surrendering (2/2)…"
            : phase === "done"
              ? "Surrendered ✓"
              : "Confirm surrender";

  if (!open) {
    return (
      <CTAButton onClick={() => setOpen(true)} disabled={!isCompanyA}>
        Surrender for compliance →
      </CTAButton>
    );
  }

  return (
    <div className="flex flex-col gap-3 bg-ec-bg p-4 rounded-[10px] border border-border-strong">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
        Surrender form · 30 Sept 2027
      </p>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-mono uppercase text-[10px] tracking-[0.08em]">
          Amount (EUA)
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isBusy}
          className="font-mono text-sm bg-surface border border-border-strong rounded-[4px] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-mono uppercase text-[10px] tracking-[0.08em]">
          Verified emissions report URI
        </span>
        <input
          type="text"
          value={reasonURI}
          onChange={(e) => setReasonURI(e.target.value)}
          disabled={isBusy}
          className="font-mono text-[11px] bg-surface border border-border-strong rounded-[4px] px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted font-mono uppercase text-[10px] tracking-[0.08em]">
          Attach emissions report (PDF)
        </span>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFakeFileName(e.target.files?.[0]?.name ?? null)}
          disabled={isBusy}
          className="text-[11px] file:mr-3 file:py-2 file:px-3 file:rounded-[4px] file:border file:border-border-strong file:bg-surface file:font-mono file:text-[10px] file:cursor-pointer"
        />
        {fakeFileName && (
          <span className="font-mono text-[10px] text-muted">
            attached locally · URI used for on-chain ref above (real upload
            wiring is out of scope)
          </span>
        )}
      </label>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <CTAButton
          onClick={handleSubmit}
          disabled={!isCompanyA || isBusy || phase === "done"}
        >
          {label}
        </CTAButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={isBusy}
          className="text-xs text-muted underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {!isCompanyA && (
        <span className="text-[9px] text-danger font-mono uppercase tracking-[0.08em]">
          cement-mainz wallet only
        </span>
      )}
      {(approveTx.error || retireTx.error) && (
        <span className="text-[9px] text-danger font-mono break-all">
          {(approveTx.error?.message || retireTx.error?.message || "").slice(
            0,
            120,
          )}
        </span>
      )}
    </div>
  );
}
