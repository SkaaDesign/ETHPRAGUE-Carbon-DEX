"use client";

// Carbon DEX — persistent product action panels.
//
// Three role-gated, always-visible panels backed by live wagmi reads/writes:
//
//   1. IssueAllocationPanel    — regulator-only. Form for Regulator.issueAllowance.
//                                Framed as "Calendar event: 2026 free allocation".
//   2. TradingDesk             — companyA-only. Bidirectional V2 swap with live
//                                quote, slippage tolerance, and approve→swap chain.
//   3. SurrenderPanel          — companyA-only. retire(amount, beneficiary, reasonURI)
//                                with the full RetirementCertificateLive success state.
//
// Each panel handles its own wallet-mismatch warning (Connect button + role hint),
// chains multi-tx flows via useEffect on receipt, and refreshes the route on
// success so server-rendered ledger/audit log picks up the new event.
//
// Multi-trade allowed: forms reset on success. No beat-gating — this is the
// real product surface, not a beat-driven receipt.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  formatEther,
  parseEther,
  stringToHex,
  type Address,
  type Hash,
} from "viem";

import {
  CARBON_CREDIT_ABI,
  CARBON_DEX_ABI,
  EURS_ABI,
  REGULATOR_ABI,
  RETIREMENT_ABI,
  SEPOLIA,
  ensFor,
} from "@/lib/contracts";
import { CTAButton, Eyebrow, SourcifyBadge } from "@/components/ui";
import { EtherscanTx } from "@/components/EtherscanLink";

// ─────────────────────────────────────────────────────────────────────────
// Local form primitives (panels stay self-contained — see lane discipline)
// ─────────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted mb-[6px]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] text-dim mt-[4px] tracking-[0.02em]">
          {hint}
        </span>
      )}
    </label>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-surface border border-border rounded-[8px] px-3 py-[10px] text-xs font-mono tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors ${className}`}
    />
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="mt-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded-[6px] text-[11px] text-danger font-mono leading-snug break-words">
      {message}
    </div>
  );
}

function PanelShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface rounded-[14px] px-7 pt-[22px] pb-[22px] border border-border">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="font-display text-[20px] leading-[1.2] mt-1 mb-[2px]">
        {title}
      </h3>
      {subtitle && (
        <p className="text-[11px] text-muted mb-[18px] leading-[1.5]">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Wallet gate — shared across all three panels
// ─────────────────────────────────────────────────────────────────────────

function WalletGate({
  expected,
  expectedRole,
  connected,
  isConnected,
}: {
  expected: Address;
  expectedRole: string;
  connected: Address | undefined;
  isConnected: boolean;
}) {
  if (!isConnected) {
    return (
      <div className="bg-accent-soft border border-accent rounded-[10px] px-5 py-4 flex items-center gap-4">
        <div className="flex-1">
          <p className="font-display text-[15px] leading-[1.3] mb-1">
            Connect a wallet to interact.
          </p>
          <p className="text-[11px] text-muted leading-[1.4]">
            This panel requires the <strong className="font-mono">{expectedRole}</strong>{" "}
            wallet — <span className="font-mono">{ensFor(expected)}</span>.
          </p>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    );
  }

  // Connected but wrong wallet
  return (
    <div className="bg-danger/5 border border-danger/40 rounded-[10px] px-5 py-4">
      <p className="font-display text-[15px] leading-[1.3] mb-1 text-danger">
        Wrong wallet connected.
      </p>
      <p className="text-[11px] text-muted leading-[1.5] mb-3">
        Connected as <span className="font-mono">{ensFor(connected!)}</span>.
        <br />
        This panel requires the <strong className="font-mono">{expectedRole}</strong>{" "}
        wallet — <span className="font-mono">{ensFor(expected)}</span>. Switch wallets
        in your provider to continue.
      </p>
      <ConnectButton showBalance={false} chainStatus="icon" />
    </div>
  );
}

function isExpectedWallet(
  connected: Address | undefined,
  expected: Address,
): boolean {
  return !!connected && connected.toLowerCase() === expected.toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────
// 1 · IssueAllocationPanel — regulator-only
// ─────────────────────────────────────────────────────────────────────────

const ISSUE_DEFAULTS = {
  recipient: SEPOLIA.wallets.companyA as Address,
  amount: "1000",
  vintage: "2026",
  sector: "IN",
  origin: "DE",
  ref: "2026-FA-DE-001",
};

export function IssueAllocationPanel() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const allowed = isExpectedWallet(address, SEPOLIA.wallets.regulator);

  const [recipient, setRecipient] = useState(ISSUE_DEFAULTS.recipient);
  const [amount, setAmount] = useState(ISSUE_DEFAULTS.amount);
  const [vintage, setVintage] = useState(ISSUE_DEFAULTS.vintage);
  const [sector, setSector] = useState(ISSUE_DEFAULTS.sector);
  const [origin, setOrigin] = useState(ISSUE_DEFAULTS.origin);
  const [ref, setRef] = useState(ISSUE_DEFAULTS.ref);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Refresh server-rendered chain state shortly after success.
  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [isSuccess, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed) return;
    try {
      writeContract({
        address: SEPOLIA.contracts.Regulator,
        abi: REGULATOR_ABI,
        functionName: "issueAllowance",
        args: [
          recipient as Address,
          parseEther(amount || "0"),
          Number(vintage),
          stringToHex(sector, { size: 2 }),
          stringToHex(origin, { size: 2 }),
          stringToHex(ref, { size: 32 }),
        ],
      });
    } catch (err) {
      console.error("issueAllowance encode failed", err);
    }
  }

  const busy = isPending || isConfirming;
  const errMsg = errMessage(error);

  return (
    <PanelShell
      eyebrow="Calendar event · 2026 free allocation"
      title="Issue allowance"
      subtitle="Pre-computed: sector benchmark × historical activity. Issuance is a process, not a discretionary mint — submit the calendar event and the on-chain registry records it."
    >
      {!allowed ? (
        <WalletGate
          expected={SEPOLIA.wallets.regulator}
          expectedRole="eu-ets-authority.eth"
          connected={address}
          isConnected={isConnected}
        />
      ) : (
        <form onSubmit={submit} className="space-y-[14px]">
          <Field label="Recipient" hint="Verified emitter wallet (must be in registry)">
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value as Address)}
              placeholder="0x…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-[14px]">
            <Field label="Amount (EUA)">
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="1000"
              />
            </Field>
            <Field label="Vintage">
              <Input
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                inputMode="numeric"
                placeholder="2026"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <Field label="Sector (2 chars)">
              <Input
                value={sector}
                onChange={(e) => setSector(e.target.value.slice(0, 2).toUpperCase())}
                maxLength={2}
                placeholder="IN"
              />
            </Field>
            <Field label="Origin (ISO-2)">
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value.slice(0, 2).toUpperCase())}
                maxLength={2}
                placeholder="DE"
              />
            </Field>
          </div>

          <Field label="Issuance reference" hint="Free-form reference (≤ 32 bytes)">
            <Input
              value={ref}
              onChange={(e) => setRef(e.target.value.slice(0, 32))}
              maxLength={32}
              placeholder="2026-FA-DE-001"
            />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <CTAButton type="submit" variant="warn" disabled={busy}>
              {isPending
                ? "Awaiting signature…"
                : isConfirming
                  ? "Confirming…"
                  : "Execute calendar event →"}
            </CTAButton>
            <SourcifyBadge />
            {hash && (
              <span className="text-[11px] text-muted">
                tx <EtherscanTx hash={hash} />
              </span>
            )}
          </div>

          {isSuccess && hash && (
            <div className="mt-2 px-4 py-3 bg-success-deep text-bright rounded-[8px] text-xs leading-[1.5]">
              <strong>{Number(amount).toLocaleString()} EUA</strong> issued to{" "}
              <span className="font-mono">{ensFor(recipient as Address)}</span>.
              Registry refreshing…
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.refresh();
                }}
                className="ml-2 underline opacity-80 hover:opacity-100"
              >
                Issue another
              </button>
            </div>
          )}

          {errMsg && <ErrorBlock message={errMsg} />}
        </form>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2 · TradingDesk — companyA-only, V2 quote, approve→swap
// ─────────────────────────────────────────────────────────────────────────

type Side = "sell" | "buy";

function v2AmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

export function TradingDesk() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const allowed = isExpectedWallet(address, SEPOLIA.wallets.companyA);

  const [side, setSide] = useState<Side>("sell");
  const [amount, setAmount] = useState("200");
  const [slippagePct, setSlippagePct] = useState("1");

  // Reset amount default when side toggles
  function toggleSide(next: Side) {
    if (next === side) return;
    setSide(next);
    setAmount(next === "sell" ? "200" : "14000");
  }

  // ── Live reads: reserves + balances ────────────────────────────────────
  const { data: reservesRaw, refetch: refetchReserves } = useReadContract({
    address: SEPOLIA.contracts.CarbonDEX,
    abi: CARBON_DEX_ABI,
    functionName: "getReserves",
    query: { refetchInterval: 5000 },
  });

  const { data: euaBalRaw, refetch: refetchEua } = useReadContract({
    address: SEPOLIA.contracts.CarbonCredit,
    abi: CARBON_CREDIT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: eursBalRaw, refetch: refetchEurs } = useReadContract({
    address: SEPOLIA.contracts.EURS,
    abi: EURS_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const reserveEURS = reservesRaw?.[0] ?? 0n;
  const reserveCredit = reservesRaw?.[1] ?? 0n;
  const euaBal = (euaBalRaw as bigint | undefined) ?? 0n;
  const eursBal = (eursBalRaw as bigint | undefined) ?? 0n;

  // ── Quote ──────────────────────────────────────────────────────────────
  const { amountInWei, quoteOut, minOut } = useMemo(() => {
    let inWei = 0n;
    try {
      inWei = parseEther(amount || "0");
    } catch {
      inWei = 0n;
    }
    const reserveIn = side === "sell" ? reserveCredit : reserveEURS;
    const reserveOut = side === "sell" ? reserveEURS : reserveCredit;
    const out = v2AmountOut(inWei, reserveIn, reserveOut);
    const slipBps = Math.max(
      0,
      Math.min(5000, Math.round(Number(slippagePct || "0") * 100)),
    );
    const min = (out * BigInt(10000 - slipBps)) / 10000n;
    return { amountInWei: inWei, quoteOut: out, minOut: min };
  }, [amount, slippagePct, side, reserveCredit, reserveEURS]);

  // ── Approve → swap chain ──────────────────────────────────────────────
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();
  const {
    isLoading: approveConfirming,
    isSuccess: approveSuccess,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeSwap,
    data: swapHash,
    isPending: swapPending,
    error: swapError,
    reset: resetSwap,
  } = useWriteContract();
  const {
    isLoading: swapConfirming,
    isSuccess: swapSuccess,
  } = useWaitForTransactionReceipt({ hash: swapHash });

  // Auto-fire swap once approve confirms. Re-reads reserves at swap-time so
  // minOut reflects the pool state right now — not the 5s-stale memo and not
  // the snapshot from before the approve confirmation. Approve takes ~10-30s
  // on Sepolia; the b-bot or any other actor can move the pool in that window.
  useEffect(() => {
    if (!approveSuccess || swapHash || swapPending) return;
    if (amountInWei <= 0n) return;
    let cancelled = false;
    (async () => {
      const fresh = await refetchReserves();
      if (cancelled) return;
      const r = fresh.data as readonly [bigint, bigint] | undefined;
      if (!r) return;
      const reserveIn = side === "sell" ? r[1] : r[0];
      const reserveOut = side === "sell" ? r[0] : r[1];
      const out = v2AmountOut(amountInWei, reserveIn, reserveOut);
      if (out <= 0n) return;
      const slipBps = Math.max(
        0,
        Math.min(5000, Math.round(Number(slippagePct || "0") * 100)),
      );
      const min = (out * BigInt(10000 - slipBps)) / 10000n;
      writeSwap({
        address: SEPOLIA.contracts.CarbonDEX,
        abi: CARBON_DEX_ABI,
        functionName:
          side === "sell" ? "swapCreditForEURS" : "swapEURSForCredit",
        args: [amountInWei, min],
      });
    })();
    return () => {
      cancelled = true;
    };
    // we intentionally only key on approveSuccess to avoid re-firing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSuccess]);

  // If the swap tx errors (user rejects, slippage breach, etc.) after approve
  // succeeded, clear both states so the button returns to "idle" and the user
  // can resubmit without a page reload.
  useEffect(() => {
    if (!swapError) return;
    resetApprove();
    resetSwap();
  }, [swapError, resetApprove, resetSwap]);

  // On swap success: refresh balances + server state, reset form.
  useEffect(() => {
    if (!swapSuccess) return;
    refetchReserves();
    refetchEua();
    refetchEurs();
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [swapSuccess, refetchReserves, refetchEua, refetchEurs, router]);

  function startSwap(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed) return;
    if (amountInWei <= 0n) return;
    resetSwap();
    resetApprove();

    // Approve the DEX for the input token.
    if (side === "sell") {
      writeApprove({
        address: SEPOLIA.contracts.CarbonCredit,
        abi: CARBON_CREDIT_ABI,
        functionName: "approve",
        args: [SEPOLIA.contracts.CarbonDEX, amountInWei],
      });
    } else {
      writeApprove({
        address: SEPOLIA.contracts.EURS,
        abi: EURS_ABI,
        functionName: "approve",
        args: [SEPOLIA.contracts.CarbonDEX, amountInWei],
      });
    }
  }

  function tradeAgain() {
    resetApprove();
    resetSwap();
    setAmount(side === "sell" ? "200" : "14000");
  }

  const phase = swapSuccess
    ? "settled"
    : swapPending || swapConfirming
      ? "swapping"
      : approveSuccess
        ? "swapping"
        : approvePending || approveConfirming
          ? "approving"
          : "idle";

  const busy = phase === "approving" || phase === "swapping";
  const errMsg = errMessage(approveError) ?? errMessage(swapError);

  // Display helpers
  const inSymbol = side === "sell" ? "EUA" : "EURS";
  const outSymbol = side === "sell" ? "EURS" : "EUA";
  const availableIn = side === "sell" ? euaBal : eursBal;
  const availableOut = side === "sell" ? eursBal : euaBal;

  const spotPrice = useMemo(() => {
    if (reserveCredit === 0n) return 0;
    return Number(reserveEURS) / Number(reserveCredit);
  }, [reserveEURS, reserveCredit]);

  return (
    <PanelShell
      eyebrow="Trading desk · live"
      title="Swap EUA ⇄ EURS"
      subtitle="V2 constant-product pool. The 0.3 % fee accrues to LP — that's the bid-ask spread, the price of someone always being there to make the market."
    >
      {!allowed ? (
        <WalletGate
          expected={SEPOLIA.wallets.companyA}
          expectedRole="cement-mainz.verified-entity.eth"
          connected={address}
          isConnected={isConnected}
        />
      ) : (
        <form onSubmit={startSwap} className="space-y-[14px]">
          {/* Side toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-ec-bg rounded-[10px] border border-border">
            <button
              type="button"
              onClick={() => toggleSide("sell")}
              className={`py-[10px] rounded-[8px] text-xs font-semibold tracking-[0.04em] transition-colors ${
                side === "sell"
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sell EUA → EURS
            </button>
            <button
              type="button"
              onClick={() => toggleSide("buy")}
              className={`py-[10px] rounded-[8px] text-xs font-semibold tracking-[0.04em] transition-colors ${
                side === "buy"
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Buy EUA ← EURS
            </button>
          </div>

          {/* Available balance */}
          <div className="flex justify-between items-baseline text-[11px] text-muted font-mono tabular-nums">
            <span>
              Available · {fmtUnits(euaBal)} EUA · {fmtUnits(eursBal)} EURS
            </span>
            <span>
              Spot · {spotPrice ? spotPrice.toFixed(2) : "—"} EURS / EUA
            </span>
          </div>

          {/* Amount input */}
          <Field label={`You pay (${inSymbol})`}>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </Field>

          {/* Quote */}
          <div className="bg-ec-bg border border-border rounded-[10px] px-4 py-3">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                You receive ({outSymbol})
              </span>
              <span className="font-mono text-[10px] text-dim">
                live · re-fetched 5s
              </span>
            </div>
            <div className="font-display text-[28px] tracking-[-0.01em] tabular-nums leading-tight mt-[2px]">
              {fmtUnits(quoteOut)}
              <span className="font-sans text-[12px] text-muted ml-2">
                {outSymbol}
              </span>
            </div>
            <div className="text-[10px] text-muted mt-1 font-mono tabular-nums">
              min after slippage · {fmtUnits(minOut)} {outSymbol}
            </div>
          </div>

          <Field label="Slippage tolerance (%)" hint="Reverts if price moves more than this between sign and confirm.">
            <Input
              value={slippagePct}
              onChange={(e) => setSlippagePct(e.target.value)}
              inputMode="decimal"
              placeholder="1"
            />
          </Field>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <CTAButton
              type="submit"
              variant="lime"
              disabled={busy || amountInWei <= 0n || amountInWei > availableIn}
            >
              {phase === "approving"
                ? "Approving DEX…"
                : phase === "swapping"
                  ? "Swapping…"
                  : phase === "settled"
                    ? "Trade settled"
                    : `Approve & swap →`}
            </CTAButton>
            <SourcifyBadge />
            {approveHash && (
              <span className="text-[11px] text-muted">
                approve <EtherscanTx hash={approveHash} />
              </span>
            )}
            {swapHash && (
              <span className="text-[11px] text-muted">
                swap <EtherscanTx hash={swapHash} />
              </span>
            )}
          </div>

          {amountInWei > availableIn && availableIn > 0n && (
            <div className="text-[11px] text-danger font-mono">
              Insufficient {inSymbol} balance ({fmtUnits(availableIn)} available).
            </div>
          )}

          {swapSuccess && swapHash && (
            <div className="mt-2 px-4 py-3 bg-success-deep text-bright rounded-[8px] text-xs leading-[1.5]">
              <strong>
                {fmtUnits(amountInWei)} {inSymbol} → {fmtUnits(quoteOut)}{" "}
                {outSymbol}
              </strong>
              . Pool rebalanced; balance updated.
              <button
                type="button"
                onClick={tradeAgain}
                className="ml-2 underline opacity-80 hover:opacity-100"
              >
                Trade again
              </button>
            </div>
          )}

          {errMsg && <ErrorBlock message={errMsg} />}

          <p className="text-[10px] text-dim leading-[1.4] pt-1">
            Available out · {fmtUnits(availableOut)} {outSymbol}.{" "}
            B-side liquidity is mirrored by an off-stage maker; the UI just
            reads reserves.
          </p>
        </form>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3 · SurrenderPanel — companyA-only, retire(amount, beneficiary, reasonURI)
// ─────────────────────────────────────────────────────────────────────────

const RETIRE_DEFAULTS = {
  reasonURI: "ipfs://QmYz2026SustainabilityReport.pdf",
};

export function SurrenderPanel() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const allowed = isExpectedWallet(address, SEPOLIA.wallets.companyA);

  // Live balance for amount default + balance hint
  const { data: balRaw, refetch: refetchBal } = useReadContract({
    address: SEPOLIA.contracts.CarbonCredit,
    abi: CARBON_CREDIT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });
  const balance = (balRaw as bigint | undefined) ?? 0n;

  const [amount, setAmount] = useState<string>("800");
  const [beneficiary, setBeneficiary] = useState<string>("");
  const [reasonURI, setReasonURI] = useState<string>(RETIRE_DEFAULTS.reasonURI);
  const [fileName, setFileName] = useState<string>("");

  // Default beneficiary = connected once we know it
  useEffect(() => {
    if (!beneficiary && address) setBeneficiary(address);
  }, [address, beneficiary]);

  // Default amount = current balance once first known
  const [primed, setPrimed] = useState(false);
  useEffect(() => {
    if (primed) return;
    if (balance > 0n) {
      setAmount(formatEther(balance));
      setPrimed(true);
    }
  }, [balance, primed]);

  // ── Approve → retire chain ───────────────────────────────────────────
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: writeRetire,
    data: retireHash,
    isPending: retirePending,
    error: retireError,
    reset: resetRetire,
  } = useWriteContract();
  const {
    isLoading: retireConfirming,
    isSuccess: retireSuccess,
    data: retireReceipt,
  } = useWaitForTransactionReceipt({ hash: retireHash });

  let amountInWei = 0n;
  try {
    amountInWei = parseEther(amount || "0");
  } catch {
    amountInWei = 0n;
  }

  // Auto-fire retire once approve confirms
  useEffect(() => {
    if (!approveSuccess || retireHash || retirePending) return;
    if (amountInWei <= 0n) return;
    if (!beneficiary) return;
    writeRetire({
      address: SEPOLIA.contracts.Retirement,
      abi: RETIREMENT_ABI,
      functionName: "retire",
      args: [amountInWei, beneficiary as Address, reasonURI],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSuccess]);

  useEffect(() => {
    if (!retireSuccess) return;
    refetchBal();
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [retireSuccess, refetchBal, router]);

  // If retire errors after approve succeeded, clear both so the button
  // returns to idle and the user can resubmit without a page reload.
  useEffect(() => {
    if (!retireError) return;
    resetApprove();
    resetRetire();
  }, [retireError, resetApprove, resetRetire]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed) return;
    if (amountInWei <= 0n) return;
    resetApprove();
    resetRetire();

    writeApprove({
      address: SEPOLIA.contracts.CarbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "approve",
      args: [SEPOLIA.contracts.Retirement, amountInWei],
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  const phase = retireSuccess
    ? "retired"
    : retirePending || retireConfirming
      ? "retiring"
      : approveSuccess
        ? "retiring"
        : approvePending || approveConfirming
          ? "approving"
          : "idle";
  const busy = phase === "approving" || phase === "retiring";
  const errMsg = errMessage(approveError) ?? errMessage(retireError);

  return (
    <PanelShell
      eyebrow="Surrender · permanent retirement"
      title="Retire allowances"
      subtitle="Burn EUA against your real-world emissions. The retirement event is the proof you bring to your sustainability disclosure — irreversible, signed by the chain."
    >
      {!allowed ? (
        <WalletGate
          expected={SEPOLIA.wallets.companyA}
          expectedRole="cement-mainz.verified-entity.eth"
          connected={address}
          isConnected={isConnected}
        />
      ) : (
        <>
          <form onSubmit={submit} className="space-y-[14px]">
            <Field label="Amount (EUA)" hint={`Wallet balance · ${fmtUnits(balance)} EUA`}>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="800"
              />
            </Field>

            <Field
              label="Beneficiary"
              hint="Address recorded in the Retired event — typically your own wallet, or a charity / community treasury."
            >
              <Input
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="0x…"
              />
            </Field>

            <Field
              label="Reason URI"
              hint="Pointer to your sustainability report or audit document."
            >
              <Input
                value={reasonURI}
                onChange={(e) => setReasonURI(e.target.value)}
                placeholder="ipfs://… or https://…"
              />
            </Field>

            <Field label="Attach report (PDF)" hint="Optional — for your records. Not uploaded.">
              <input
                type="file"
                accept=".pdf"
                onChange={onFile}
                className="block w-full text-[11px] font-mono text-muted file:mr-3 file:py-[6px] file:px-3 file:rounded-[6px] file:border-0 file:bg-foreground file:text-white file:cursor-pointer file:text-[10px] file:tracking-[0.08em] file:uppercase"
              />
              {fileName && (
                <span className="block text-[10px] text-success font-mono mt-[4px]">
                  ✓ {fileName} attached locally
                </span>
              )}
            </Field>

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <CTAButton
                type="submit"
                variant="warn"
                disabled={busy || amountInWei <= 0n || amountInWei > balance}
              >
                {phase === "approving"
                  ? "Approving Retirement…"
                  : phase === "retiring"
                    ? "Burning EUA…"
                    : phase === "retired"
                      ? "Retired"
                      : "Approve & retire →"}
              </CTAButton>
              <SourcifyBadge />
              {approveHash && (
                <span className="text-[11px] text-muted">
                  approve <EtherscanTx hash={approveHash} />
                </span>
              )}
              {retireHash && (
                <span className="text-[11px] text-muted">
                  retire <EtherscanTx hash={retireHash} />
                </span>
              )}
            </div>

            {amountInWei > balance && balance > 0n && (
              <div className="text-[11px] text-danger font-mono">
                Insufficient EUA balance ({fmtUnits(balance)} available).
              </div>
            )}

            {errMsg && <ErrorBlock message={errMsg} />}
          </form>

          {retireSuccess && retireHash && address && (
            <RetirementCertificateLive
              hash={retireHash}
              amount={amountInWei}
              holder={address}
              beneficiary={(beneficiary as Address) || address}
              reasonURI={reasonURI}
              blockNumber={retireReceipt?.blockNumber}
            />
          )}
        </>
      )}
    </PanelShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3a · RetirementCertificateLive — embossed seal + striped paper
// ─────────────────────────────────────────────────────────────────────────

function RetirementCertificateLive({
  hash,
  amount,
  holder,
  beneficiary,
  reasonURI,
  blockNumber,
}: {
  hash: Hash;
  amount: bigint;
  holder: Address;
  beneficiary: Address;
  reasonURI: string;
  blockNumber?: bigint;
}) {
  const issuedAt = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} UTC`;
  }, []);

  return (
    <>
      <style>{`
        .surrender-cert-qr {
          width: 56px; height: 56px;
          flex-shrink: 0;
          background:
            linear-gradient(45deg, #1a1917 25%, transparent 25%) 0 0/8px 8px,
            linear-gradient(-45deg, #1a1917 25%, transparent 25%) 0 0/8px 8px,
            linear-gradient(45deg, transparent 75%, #1a1917 75%) 0 0/8px 8px,
            linear-gradient(-45deg, transparent 75%, #1a1917 75%) 0 0/8px 8px,
            #fff;
          border: 4px solid #fff;
          outline: 1px solid #1a1917;
        }
      `}</style>
      <div className="mt-6 bg-surface border border-border-strong rounded-md px-7 py-[26px] relative bg-[repeating-linear-gradient(45deg,transparent_0_12px,rgba(45,110,78,0.025)_12px_13px)]">
        <div
          aria-hidden
          className="absolute top-[22px] right-[26px] w-[70px] h-[70px] border-2 border-success rounded-full bg-surface flex items-center justify-center text-center font-display font-medium text-[11px] text-success leading-[1.15] -rotate-[7deg]"
        >
          EU ETS
          <br />
          RETIRED
        </div>

        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-success mb-[6px]">
          Permanent retirement certificate
        </p>

        <h2 className="font-display text-[26px] font-normal leading-[1.2] tracking-[-0.01em] max-w-[18ch] mb-[18px]">
          {fmtUnits(amount)} EUA
          <br />
          permanently destroyed.
        </h2>

        <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted">Holder</dt>
          <dd className="font-mono">{ensFor(holder)}</dd>
          <dt className="text-muted">Beneficiary</dt>
          <dd className="font-mono break-all">
            {ensFor(beneficiary)}{" "}
            <span className="text-muted">({beneficiary})</span>
          </dd>
          <dt className="text-muted">Vintage</dt>
          <dd className="font-mono">2026</dd>
          <dt className="text-muted">Reason URI</dt>
          <dd className="font-mono break-all">{reasonURI || "—"}</dd>
          <dt className="text-muted">Tx hash</dt>
          <dd className="font-mono">
            <EtherscanTx hash={hash} />
          </dd>
          <dt className="text-muted">Block</dt>
          <dd className="font-mono">
            {blockNumber ? `${blockNumber.toString()} · Sepolia` : "Sepolia"}
          </dd>
          <dt className="text-muted">Issued</dt>
          <dd className="font-mono">{issuedAt}</dd>
        </dl>

        <div className="mt-[18px] pt-[14px] border-t border-border flex items-center gap-[14px] text-[11px] text-muted">
          <span aria-hidden className="surrender-cert-qr" />
          <div>
            Scannable proof for sustainability disclosure filings.
            <br />
            <a
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-success underline"
            >
              View on Sepolia Etherscan ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────

function fmtUnits(wei: bigint): string {
  if (wei === 0n) return "0";
  // Display whole units; show two decimals when < 1.
  const whole = wei / 10n ** 18n;
  const frac = wei % 10n ** 18n;
  if (whole === 0n) {
    const f = Number(frac) / 1e18;
    return f.toFixed(2);
  }
  const wholeStr = whole.toLocaleString();
  // Trim very small fractional dust
  if (frac === 0n) return wholeStr;
  const fracDisplay = (Number(frac) / 1e18).toFixed(2).slice(1); // ".xx"
  return whole < 1000n ? `${wholeStr}${fracDisplay}` : wholeStr;
}

function errMessage(err: unknown): string | null {
  if (!err) return null;
  // viem's BaseError exposes a curated `shortMessage` (e.g. "User rejected the
  // request.") — prefer it over the verbose stack message.
  if (typeof err === "object" && err !== null) {
    const e = err as { shortMessage?: unknown; message?: unknown };
    if (typeof e.shortMessage === "string" && e.shortMessage) {
      return e.shortMessage;
    }
    if (typeof e.message === "string" && e.message) {
      return e.message.split("\n")[0];
    }
  }
  return String(err);
}
