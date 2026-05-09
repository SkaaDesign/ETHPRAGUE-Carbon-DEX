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
  CTAButton,
  EditorialShell,
  Eyebrow,
  LiveBadge,
  SourcifyBadge,
  TxLink,
} from "@/components/ui";
import { fmt, stateAt } from "@/lib/demo-state";
import { getStateForRoute } from "@/lib/chain-state";

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
  const { state: s, isLive } = await getStateForRoute(usp);
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
        <BalanceTile state={s} />

        {beat === 0 && <Awaiting />}
        {beat === 1 && <AllocationReceipt />}
        {beat === 2 && <SwapReceipt s={s} />}
        {beat === 3 && <Certificate />}

        <HoldingsStrip s={s} />
      </EditorialShell>
      <div className="fixed top-3 right-4 z-50 px-3 py-[6px] bg-surface border border-border rounded-full shadow-sm">
        <LiveBadge isLive={isLive} beat={beat} />
      </div>
      <BeatSwitcher current={beat} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 1 · Identity + balance tile (always visible)
// ─────────────────────────────────────────────────────────────────────────

function BalanceTile({ state: s }: { state: ReturnType<typeof stateAt> }) {
  const delta =
    s.beat === 1
      ? { text: "▲ +1,000 received", down: false }
      : s.beat === 2
        ? { text: "▼ −200 sold", down: true }
        : s.beat === 3
          ? { text: "▼ −800 retired", down: true }
          : null;

  return (
    <div className="bg-surface rounded-[14px] px-7 pt-[26px] pb-6 relative overflow-hidden">
      {/* Identity row */}
      <div className="flex items-center gap-[10px] mb-[14px]">
        <span
          aria-hidden
          className="w-7 h-7 rounded-full bg-[linear-gradient(135deg,#c8d4b8,#4a7d5e)]"
        />
        <div className="font-mono text-xs leading-[1.2]">
          cement-mainz.verified-entity.eth
          <small className="block font-sans text-[10px] text-muted mt-[2px] tracking-[0.04em] uppercase">
            verified emitter · cement · DE
          </small>
        </div>
        <span className="ml-auto inline-flex items-center gap-[5px] text-[10px] tracking-[0.08em] uppercase text-success font-semibold">
          <span aria-hidden>✓</span>Verified
        </span>
      </div>

      <Eyebrow>Wallet balance · vintage 2026</Eyebrow>

      <div
        key={`bal-${s.beat}`}
        className="flash flex items-baseline gap-[10px] font-display font-normal text-[64px] tracking-[-0.03em] leading-none tabular-nums my-1"
      >
        {fmt(s.coBal)}
        <span className="font-sans text-[13px] text-muted font-medium tracking-normal">
          EUA
        </span>
        {delta && (
          <span
            className={`font-sans text-[11px] font-semibold tracking-[0.04em] uppercase ml-2 ${
              delta.down ? "text-danger" : "text-success"
            }`}
          >
            {delta.text}
          </span>
        )}
      </div>

      <div className="border-t border-border-row-cream mt-2 pt-[14px]">
        <Row label="EURS balance" value={`${fmt(s.coEurs)} EURS`} />
        <Row label="Surrender deadline" value="30 Sept 2027" />
        <Row label="Network" value="Sepolia · block 18,294,441" last />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-baseline gap-3 py-2 text-xs ${
        last ? "" : "border-b border-border-row-cream"
      }`}
    >
      <span className="text-muted">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
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

function HoldingsStrip({ s }: { s: ReturnType<typeof stateAt> }) {
  return (
    <div className="bg-surface rounded-[14px] px-[22px] py-4">
      <Eyebrow>Holdings · live</Eyebrow>
      <div className="mt-2">
        <Row label="Allowances on hand" value={`${fmt(s.coBal)} EUA`} />
        <Row
          label="Spot price"
          value={`${s.spotPrice.toFixed(2)} EURS / EUA`}
        />
        <Row
          label="Mark-to-market value"
          value={`${fmt(Math.round(s.coBal * s.spotPrice))} EURS`}
        />
        <Row label="Retired (lifetime)" value={`${fmt(s.retired)} EUA`} last />
      </div>
    </div>
  );
}
