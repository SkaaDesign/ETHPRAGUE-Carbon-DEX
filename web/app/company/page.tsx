// /company — Editorial Calm Company Portal.
//
// Server component. Single-actor protagonist: cement-mainz.verified-entity.eth. The body
// composes three always-on slots (identity tile, beat-driven action/receipt,
// holdings strip) plus the EditorialShell chrome. The certificate at Beat 3
// is the demo's climax shot — striped paper, embossed seal, scannable QR.
//
// Closing visual (default render at Beat 3): wallet drained to 0 EUA,
// 800 retired forever, retirement certificate filed.

import { BeatSwitcher } from "@/components/BeatSwitcher";
import {
  ChainErrorBanner,
  CTAButton,
  EditorialShell,
  Eyebrow,
  KindChip,
  LiveBadge,
  SourcifyBadge,
  TxLink,
} from "@/components/ui";
import { fmt, stateAt, type AuditEntry } from "@/lib/demo-state";
import { getStateForRoute } from "@/lib/chain-state";
import { TradingDesk, SurrenderPanel } from "@/components/actions";
import { HeaderWalletStatus } from "@/components/HeaderWalletStatus";
import { EtherscanTx } from "@/components/EtherscanLink";

const COMPANY_A_ENS = "cement-mainz.verified-entity.eth";

// Force dynamic — actions.tsx pulls in wagmi which validates WalletConnect
// projectId at module load. Static prerender at build time would fail
// without a real projectId env var; dynamic rendering means validation
// only happens at request time when the user has loaded the page.
export const dynamic = "force-dynamic";

const PILLS = [
  { label: "Overview", active: true },
  { label: "Trade" },
  { label: "Retire" },
  { label: "Reports" },
];

export default async function CompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ beat?: string }>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams(params as Record<string, string>);
  const { state: s, isLive, error } = await getStateForRoute(usp);
  const beat = s.beat;

  return (
    <>
      <style>{`
        .co-receipt::before, .co-receipt::after {
          content: ""; position: absolute;
          width: 14px; height: 14px;
          background: var(--ec-bg);
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }
        .co-receipt::before { left: -7px; }
        .co-receipt::after { right: -7px; }
        .co-qr-box {
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

      <EditorialShell
        brand="Company portal"
        clock={s.clock}
        clockSuffix="UTC · WALLET CONNECTED"
        pills={PILLS}
      >
        <Wrap>
          <ChainErrorBanner error={error} />
        </Wrap>

        {/* Identity strip — slim header, identity + verified + deadline */}
        <Wrap>
          <IdentityStrip />
        </Wrap>

        {/* KPI row — 3 equal-weight cards subsume the old BalanceTile body
            + HoldingsStrip. Less vertical space, easier scan. */}
        <Wrap>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Allowances on hand"
              value={fmt(s.coBal)}
              unit="EUA"
              sub={
                s.retired > 0
                  ? `vintage 2026 · ${fmt(s.retired)} retired lifetime`
                  : "vintage 2026 · no retirements yet"
              }
            />
            <KpiCard
              label="Cash position"
              value={fmt(s.coEurs)}
              unit="EURS"
              sub="available for trade"
            />
            <KpiCard
              label="Mark-to-market"
              value={fmt(Math.round(s.coBal * s.spotPrice))}
              unit="EURS"
              sub={`spot ${s.spotPrice.toFixed(2)} EURS / EUA`}
            />
          </div>
        </Wrap>

        {isLive ? (
          // Live mode: actions side-by-side at lg+, stacked on smaller widths.
          // Each panel handles its own connect / wrong-wallet states inside.
          <Wrap>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              <TradingDesk />
              <SurrenderPanel />
            </div>
          </Wrap>
        ) : (
          // Sim mode (?beat=N): beat-driven story per the design canvas.
          // Visual fallback for stage demo if anything live breaks.
          <Wrap>
            {beat === 0 && <Awaiting />}
            {beat === 1 && <AllocationReceipt />}
            {beat === 2 && <SwapReceipt s={s} />}
            {beat === 3 && <Certificate />}
          </Wrap>
        )}

        <Wrap>
          <YourActivity audit={s.audit} />
        </Wrap>
      </EditorialShell>
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <div className="px-3 py-[6px] bg-surface border border-border rounded-full shadow-sm">
          <LiveBadge isLive={isLive} beat={beat} />
        </div>
        <HeaderWalletStatus />
      </div>
      <BeatSwitcher current={beat} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1 · Layout primitives (max-width wrap, identity strip, KPI card)
// ─────────────────────────────────────────────────────────────────────────

// Centers each row + caps width on big monitors so the panels don't stretch
// uncomfortably wide. EditorialShell's flex column already handles vertical
// gap between rows.
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1280px] mx-auto w-full">{children}</div>
  );
}

// Slim header: avatar + ENS + verified pill + surrender-deadline reminder.
// Replaces the old BalanceTile's identity block; balance numbers move to the
// KPI cards below for breathing room.
function IdentityStrip() {
  return (
    <div className="bg-surface rounded-2xl border border-border px-6 py-4 flex items-center gap-3 flex-wrap shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <span
        aria-hidden
        className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#c8d4b8,#4a7d5e)] flex-shrink-0"
      />
      <div className="min-w-0">
        <div className="font-mono text-[13px] leading-[1.2] text-foreground">
          cement-mainz.verified-entity.eth
        </div>
        <small className="block font-sans text-[10px] text-muted mt-[2px] tracking-[0.06em] uppercase">
          Verified emitter · cement · DE
        </small>
      </div>
      <span className="ml-auto inline-flex items-center gap-[5px] text-[10px] tracking-[0.08em] uppercase text-success font-semibold">
        <span aria-hidden>✓</span>Verified
      </span>
      <span className="text-[11px] text-muted font-mono tracking-[0.04em] hidden sm:inline">
        Surrender deadline · 30 Sept 2027
      </span>
    </div>
  );
}

// Clean stat tile — white surface, subtle border, soft shadow that lifts
// on hover. No pastel tones (those live on /public to differentiate the
// public observer aesthetic from the company portal).
function KpiCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
      <Eyebrow>{label}</Eyebrow>
      <div className="font-display font-normal text-[34px] leading-none tracking-[-0.02em] tabular-nums text-foreground mt-3">
        {value}
        <small className="font-sans text-[12px] text-muted ml-[6px] font-normal">
          {unit}
        </small>
      </div>
      {sub && (
        <div className="text-[11px] text-muted font-sans mt-3 leading-[1.4]">
          {sub}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2 · Beat 0 — awaiting allocation
// ─────────────────────────────────────────────────────────────────────────

function Awaiting() {
  return (
    <div className="bg-surface border border-dashed border-border-strong rounded-[14px] px-6 py-[38px] text-center font-display italic text-base text-muted leading-[1.4]">
      Awaiting 2026 free-allocation event.
      <small className="block font-sans not-italic text-[11px] text-dim mt-[6px] tracking-[0.04em] uppercase">
        Regulator · ref 2026-FA-DE-001
      </small>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3 · Beat 1 — allocation receipt
// ─────────────────────────────────────────────────────────────────────────

function AllocationReceipt() {
  return (
    <div className="co-receipt bg-surface rounded-[14px] px-6 py-[22px] border border-border relative">
      {/* Head */}
      <div className="flex justify-between items-baseline pb-[14px] border-b border-dashed border-border-strong mb-[14px]">
        <span className="font-display text-[19px]">Allocation receipt</span>
        <span className="font-mono text-[10px] text-muted tracking-[0.06em]">
          2026-FA-DE-001
        </span>
      </div>

      {/* Toast */}
      <div className="bg-success-deep text-bright rounded-[10px] px-4 py-[14px] flex gap-3 items-start text-xs leading-[1.5] mb-[14px]">
        <span className="font-mono text-[9px] tracking-[0.18em] bg-accent text-foreground px-[7px] py-[3px] rounded-[3px] self-start flex-shrink-0">
          RECEIVED
        </span>
        <div>
          <strong>1,000 EUA</strong> from{" "}
          <span className="font-mono text-accent">
            eu-ets-authority.eth
          </span>
          .
          <br />
          Period 2026 · sector Industry · origin DE · ref 2026-FA-DE-001.
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-[120px_1fr] gap-x-[14px] gap-y-[6px] text-xs items-baseline">
        <span className="text-muted">tx hash</span>
        <TxLink href="#">0x4d1a…7e2 ↗</TxLink>
        <span className="text-muted">contract</span>
        <SourcifyBadge />
        <span className="text-muted">provenance</span>
        <span className="font-mono text-[11px]">
          regulator → cement-mainz.verified-entity.eth
        </span>
        <span className="text-muted">event</span>
        <span className="font-mono text-[11px]">
          CreditMinted(to, 1000, 2026, …)
        </span>
      </div>

      <div className="mt-[14px]">
        <CTAButton>Open trade →</CTAButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 4 · Beat 2 — swap settled receipt
// ─────────────────────────────────────────────────────────────────────────

function SwapReceipt({ s }: { s: ReturnType<typeof stateAt> }) {
  return (
    <div className="co-receipt bg-surface rounded-[14px] px-6 py-[22px] border border-border relative">
      <div className="flex justify-between items-baseline pb-[14px] border-b border-dashed border-border-strong mb-[14px]">
        <span className="font-display text-[19px]">Swap settled</span>
        <span className="font-mono text-[10px] text-muted tracking-[0.06em]">
          tx 0x2c4f…81b
        </span>
      </div>

      <div className="flex gap-[18px] items-baseline mb-3 flex-wrap">
        <span className="font-display text-[30px] tracking-[-0.02em] tabular-nums">
          200 EUA
        </span>
        <span className="text-muted">→</span>
        <span className="font-display text-[30px] tracking-[-0.02em] tabular-nums text-success">
          {fmt(s.tradeProceedsEurs)} EURS
        </span>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-x-[14px] gap-y-[6px] text-xs items-baseline">
        <span className="text-muted">spot · before</span>
        <span className="font-mono">
          {s.spotPriceInitial.toFixed(2)} EURS / EUA
        </span>
        <span className="text-muted">effective · A</span>
        <span className="font-mono">
          {s.effectivePrice.toFixed(2)} EURS / EUA
        </span>
        <span className="text-muted">fill</span>
        <span className="font-mono">
          {fmt(s.tradeProceedsEurs)} EURS for 200 EUA sold
        </span>
        <span className="text-muted">spread</span>
        <span className="font-mono">
          ~{fmt(s.lpFeeEurs)} EURS → pool LP fee
          <span className="block text-muted text-[11px] font-sans normal-case">
            B paid ~{fmt(s.buyerCostEurs)} EURS · banks earn the spread for
            making the market
          </span>
        </span>
        <span className="text-muted">counterparty</span>
        <span className="font-mono">Carbon DEX Pool</span>
        <span className="text-muted">contract</span>
        <SourcifyBadge />
      </div>

      <div className="mt-4">
        <CTAButton>Surrender for compliance →</CTAButton>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 5 · Beat 3 — retirement certificate (the climax)
// ─────────────────────────────────────────────────────────────────────────

function Certificate() {
  return (
    <div className="bg-surface border border-border-strong rounded-md px-7 py-[26px] relative bg-[repeating-linear-gradient(45deg,transparent_0_12px,rgba(45,110,78,0.025)_12px_13px)]">
      {/* Embossed seal */}
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
        800 EUA
        <br />
        permanently destroyed.
      </h2>

      <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-xs">
        <dt className="text-muted">Holder</dt>
        <dd className="font-mono">cement-mainz.verified-entity.eth</dd>
        <dt className="text-muted">Beneficiary</dt>
        <dd className="font-mono">Q4-2026 emissions · cement-mainz DE</dd>
        <dt className="text-muted">Vintage</dt>
        <dd className="font-mono">2026</dd>
        <dt className="text-muted">Reason URI</dt>
        <dd className="font-mono">ipfs://QmYz…2026.pdf</dd>
        <dt className="text-muted">Tx hash</dt>
        <dd className="font-mono">0x9ae1…c4f</dd>
        <dt className="text-muted">Block</dt>
        <dd className="font-mono">18,294,441 · Sepolia</dd>
        <dt className="text-muted">Issued</dt>
        <dd className="font-mono">09 May 2026 · 15:04 UTC</dd>
      </dl>

      <div className="mt-[18px] pt-[14px] border-t border-border flex items-center gap-[14px] text-[11px] text-muted">
        <span aria-hidden className="co-qr-box" />
        <div>
          Scannable proof for sustainability disclosure filings.
          <br />
          <TxLink href="#">Download PDF ↗</TxLink>
          {" · "}
          <TxLink href="#">Cite this URL</TxLink>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 6 · Holdings strip (always visible at bottom)
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// 7 · Your activity (filtered audit log — only entries involving cement-mainz)
// ─────────────────────────────────────────────────────────────────────────

function YourActivity({ audit }: { audit: AuditEntry[] }) {
  const mine = audit.filter((e) => {
    if (e.kind === "ISSUE") return e.to === COMPANY_A_ENS;
    if (e.kind === "SWAP") return e.from === COMPANY_A_ENS;
    if (e.kind === "RETIRE") return e.from === COMPANY_A_ENS;
    return false;
  });

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <Eyebrow>Your activity · cement-mainz</Eyebrow>
      <h3 className="font-display font-normal text-[18px] mt-1 mb-3">
        Past allocations, trades, retirements
      </h3>
      {mine.length === 0 ? (
        <p className="text-xs italic text-dim">
          No activity yet. Your allocations, trades, and retirements appear
          here as they hit the chain.
        </p>
      ) : (
        <ul className="flex flex-col">
          {mine.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityRow({ entry }: { entry: AuditEntry }) {
  return (
    <li className="grid grid-cols-[68px_72px_1fr_auto] gap-3 py-[10px] text-xs items-baseline border-b border-border-row last:border-b-0">
      <span className="font-mono text-[10px] text-dim tracking-[0.04em]">
        {entry.ts}
      </span>
      <KindChip kind={entry.kind} />
      <span className="leading-snug font-mono">
        <ActivityBody entry={entry} />
      </span>
      <span className="text-[10px] text-dim">
        {entry.txHash ? (
          <EtherscanTx
            hash={entry.txHash}
            short={entry.hash}
            className="!text-[10px]"
          />
        ) : (
          <span className="font-mono">{entry.hash}</span>
        )}
      </span>
    </li>
  );
}

function ActivityBody({ entry }: { entry: AuditEntry }) {
  switch (entry.kind) {
    case "ISSUE":
      return (
        <>
          Received <strong className="text-foreground">{entry.amount}</strong>{" "}
          from regulator
        </>
      );
    case "SWAP":
      return (
        <>
          Swapped <strong className="text-foreground">{entry.outAmount}</strong>{" "}
          → <strong className="text-foreground">{entry.inAmount}</strong>
        </>
      );
    case "RETIRE":
      return (
        <>
          Retired <strong className="text-foreground">{entry.amount}</strong>
        </>
      );
    case "FREEZE":
    case "PAUSE":
      return null;
  }
}

