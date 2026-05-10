// /public — EEA Editorial Public Observer.
//
// Server component. Renders the on-chain ETS registry as the public would
// see it: cap accounting (issued · in circulation · retired), a single-
// segment cap bar, a live ledger of authority/trade/retirement events, and
// the verified-entity roster. State is sourced from `stateAt(beat)`; beat
// comes from `?beat=0..3`.
//
// Closing visual (default render at Beat 3): supply has actually contracted
// — 1,000 issued · 800 retired · 200 still circulating (in pool / B's wallet).

import { BeatSwitcher } from "@/components/BeatSwitcher";
import { EEAShell, LiveBadge } from "@/components/ui";
import { EtherscanSourcify } from "@/components/EtherscanLink";
import { SEPOLIA } from "@/lib/contracts";
import { fmt, QTY_TRADE, stateAt } from "@/lib/demo-state";
import { getStateForRoute } from "@/lib/chain-state";

const NAV_ITEMS = [
  { label: "Overview", href: "#", active: true },
  { label: "Trades", href: "#" },
  { label: "Retirements", href: "#" },
  { label: "Authority log", href: "#" },
];

const CRUMBS = [
  { label: "Climate", href: "#" },
  { label: "Emissions Trading", href: "#" },
  { label: "Public Observer" },
];

export default async function PublicPage({
  searchParams,
}: {
  searchParams: Promise<{ beat?: string }>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams(params as Record<string, string>);
  const { state: s, isLive } = await getStateForRoute(usp);
  const beat = s.beat;

  // cap-bar segment widths as % of supply (capped to avoid div-by-zero).
  const denom = Math.max(s.supply, 1);
  const wIssued = (s.coBal / denom) * 100;
  const wPool = ((s.beat >= 2 ? QTY_TRADE : 0) / denom) * 100;
  const wRetired = (s.retired / denom) * 100;

  // copy variants for the "In circulation" delta line.
  const inCircDelta =
    s.beat < 1
      ? "no supply yet"
      : s.beat < 2
        ? "1 holder · 1 issuance"
        : s.beat < 3
          ? "pool absorbed 200 EUA"
          : "supply contracted by 200";

  return (
    <>
      <EEAShell navItems={NAV_ITEMS} crumbs={CRUMBS}>
        {/* Top transparency strip — "everything reads from chain" reinforcement */}
        <div className="px-6 py-[10px] bg-pub-bg border-b border-border-public flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-public font-mono tracking-[0.04em]">
          <span>
            <span className="text-foreground-deep font-semibold">2</span>{" "}
            verified entities
          </span>
          <span className="text-muted-public/60">·</span>
          <span>
            <EtherscanSourcify
              address={SEPOLIA.contracts.Regulator}
              className="!text-[11px] !tracking-[0.04em] !normal-case !font-mono !font-normal"
            />
            {" "}
            <span className="text-foreground-deep font-semibold">6/6</span>
          </span>
          <span className="text-muted-public/60">·</span>
          <span className="inline-flex items-center gap-[5px]">
            <span
              aria-hidden
              className="w-[6px] h-[6px] rounded-full bg-success"
              style={{ animation: "pulse 2s infinite" }}
            />
            Live on{" "}
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-success hover:underline"
            >
              Sepolia
            </a>
          </span>
        </div>

        {/* Hero */}
        <section
          className="px-6 pt-9 pb-7 border-b border-border-public"
          style={{
            background: "linear-gradient(180deg, var(--pub-elev) 0%, #fff 100%)",
          }}
        >
          <p className="font-mono text-[11px] tracking-[0.16em] uppercase font-semibold text-success mb-[14px]">
            Open data · Phase IV · Vintage 2026
          </p>
          <h1 className="font-eea-serif text-[30px] font-normal leading-[1.15] tracking-[-0.012em] text-foreground-deep text-balance max-w-[22ch]">
            A shared accounting of Europe&rsquo;s carbon budget &mdash; open to
            anyone, every block.
          </h1>
        </section>

        {/* Cap accounting tile (3-cell grid, hairline dividers via gap-px) */}
        <div
          className="mx-6 mt-0 border border-border-public border-t-[3px] border-t-success grid grid-cols-3 gap-px"
          style={{ background: "var(--border-public)" }}
        >
          <CapCell
            label="Issued, vintage 2026"
            value={fmt(s.supply)}
            unit="EUA"
            delta={
              s.beat >= 1 ? "▲ allocated · 09 May 2026" : "awaiting first allocation"
            }
          />
          <CapCell
            label="In circulation"
            value={fmt(s.inCirculation)}
            unit="EUA"
            delta={inCircDelta}
          />
          <CapCell
            label="Permanently retired"
            value={fmt(s.retired)}
            unit="EUA"
            delta={
              s.retired
                ? "▲ surrendered against verified emissions"
                : "first retirement expected Q4"
            }
            deltaDown={!s.retired}
          />
        </div>

        {/* Cap bar */}
        <div
          className="mx-6 mt-[18px] h-2 rounded-[1px] overflow-hidden flex"
          style={{ background: "var(--border-public)" }}
        >
          {s.supply > 0 && (
            <>
              <div
                className="bg-success h-full"
                style={{ width: `${wIssued}%` }}
              />
              <div
                className="bg-success-soft h-full"
                style={{ width: `${wPool}%` }}
              />
              <div
                className="bg-success-deep h-full"
                style={{ width: `${wRetired}%` }}
              />
            </>
          )}
        </div>

        {/* Cap legend */}
        <div className="mx-6 mt-2 flex gap-5 text-[11px] text-muted-strong-public">
          <LegendSwatch color="var(--success)" label="cement-mainz holdings" />
          <LegendSwatch color="var(--success-soft)" label="in pool" />
          <LegendSwatch color="var(--success-deep)" label="retired" />
        </div>

        {/* Live ledger */}
        <Section
          title="Live ledger"
          subtitle="· every transaction, by anyone, with no login"
        >
          {s.beat < 1 && (
            <div className="py-[18px] text-muted-public-empty text-xs italic text-dim">
              No transactions yet. The 2026 allocation event is queued.
            </div>
          )}

          {s.beat >= 3 && (
            <LedgerRow
              when="15:04 UTC"
              what={
                <>
                  <strong className="font-semibold text-foreground-deep">
                    Retirement
                  </strong>{" "}
                  · <Ens>cement-mainz.verified-entity.eth</Ens>
                  <Meta>
                    beneficiary · Q4-2026 emissions · reasonURI:
                    ipfs://QmYz…2026.pdf
                  </Meta>
                </>
              }
              amt="−800"
              amtUnit="EUA · burned"
            />
          )}

          {s.beat >= 2 && (
            <LedgerRow
              when="14:38 UTC"
              what={
                <>
                  <strong className="font-semibold text-foreground-deep">
                    Trade
                  </strong>{" "}
                  · <Ens>cement-mainz.verified-entity.eth</Ens> → Carbon DEX Pool
                  <Meta>
                    200 EUA at ~{s.effectivePrice.toFixed(2)} EURS/EUA ·{" "}
                    {fmt(s.tradeProceedsEurs)} EURS settled · slippage{" "}
                    {s.slippagePct.toFixed(2)}%
                  </Meta>
                </>
              }
              amt="−200"
              amtUnit="EUA · wallet → pool"
            />
          )}

          {s.beat >= 1 && (
            <LedgerRow
              when="14:32 UTC"
              what={
                <>
                  <strong className="font-semibold text-foreground-deep">
                    Allocation
                  </strong>{" "}
                  · <Ens>eu-ets-authority.eth</Ens> →{" "}
                  <Ens>cement-mainz.verified-entity.eth</Ens>
                  <Meta>
                    vintage 2026 · sector cement · origin DE · ref
                    2026-FA-DE-001
                  </Meta>
                </>
              }
              amt="+1,000"
              amtUnit="EUA · issued"
              isLast={s.beat === 1}
            />
          )}
        </Section>

        {/* Verified entities */}
        <Section
          title="Verified entities"
          subtitle="· compliance roster (12)"
        >
          <LedgerRow
            when="verified"
            what={
              <>
                <Ens>cement-mainz.verified-entity.eth</Ens>
                <Meta>
                  cement · DE · holdings {fmt(s.coBal)} EUA · retired{" "}
                  {fmt(s.retired)} EUA
                </Meta>
              </>
            }
            amt={fmt(s.coBal)}
            amtUnit="EUA"
          />
          <LedgerRow
            when="verified"
            what={
              <>
                <Ens>aluminium-bratislava.verified-entity.eth</Ens>
                <Meta>aluminium · SK · 11 other emitters in roster</Meta>
              </>
            }
            amt="820"
            amtUnit="EUA"
            isLast
          />
        </Section>

        {/* Footer */}
        <footer className="mt-auto px-6 py-4 bg-pub-elev border-t border-border-public text-[11px] text-muted-public flex gap-3 items-center">
          <span className="inline-flex items-center gap-[6px]">
            <span
              aria-hidden
              className="w-2 h-2 rounded-full bg-success"
            />
            No wallet required · all reads from on-chain events
          </span>
          <span className="ml-auto inline-flex items-center gap-3">
            Contracts <EtherscanSourcify address={SEPOLIA.contracts.Regulator} />
            <span className="text-muted-public">·</span>
            <a href="#" className="text-success no-underline">
              Methodology
            </a>
            <span className="text-muted-public">·</span>
            <a href="#" className="text-success no-underline">
              CSV download
            </a>
          </span>
        </footer>
      </EEAShell>
      <div className="fixed top-3 right-4 z-50 px-3 py-[6px] bg-surface border border-border rounded-full shadow-sm">
        <LiveBadge isLive={isLive} beat={beat} />
      </div>
      <BeatSwitcher current={beat} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Local subcomponents (route-private — kept inline to mirror the JSX source
// 1:1 without spreading minor primitives across files).
// ─────────────────────────────────────────────────────────────────────────

function CapCell({
  label,
  value,
  unit,
  delta,
  deltaDown,
}: {
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaDown?: boolean;
}) {
  return (
    <div className="bg-pub-bg pt-1 px-4 pb-0">
      <div className="text-[10px] text-muted-public uppercase tracking-[0.08em] font-semibold mb-2">
        {label}
      </div>
      <div className="font-eea-serif text-[38px] font-normal text-foreground-deep leading-none tracking-[-0.02em] tabular-nums">
        {value}
        <small className="text-[13px] text-muted-public font-eea-sans ml-[6px]">
          {unit}
        </small>
      </div>
      <div
        className={`text-[11px] mt-[6px] font-semibold ${
          deltaDown ? "text-danger" : "text-success"
        }`}
      >
        {delta}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden
        className="inline-block w-[10px] h-[10px] align-middle mr-[6px] rounded-[1px]"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 pt-6 pb-2">
      <h2 className="font-eea-serif text-[18px] font-medium text-foreground-deep mb-3 pb-2 border-b border-border-public flex items-baseline gap-[10px]">
        {title}
        <small className="font-eea-sans text-[11px] font-normal text-muted-public tracking-[0.04em]">
          {subtitle}
        </small>
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function LedgerRow({
  when,
  what,
  amt,
  amtUnit,
  isLast,
}: {
  when: string;
  what: React.ReactNode;
  amt: string;
  amtUnit: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[80px_1fr_auto] gap-[14px] py-3 text-[13px] items-baseline ${
        isLast ? "" : "border-b border-border-row-light"
      }`}
    >
      <div className="font-mono text-[11px] text-muted-public tracking-[0.02em]">
        {when}
      </div>
      <div>{what}</div>
      <div className="font-mono font-semibold text-foreground-deep text-right">
        {amt}
        <small className="block text-[10px] text-muted-public font-normal">
          {amtUnit}
        </small>
      </div>
    </div>
  );
}

function Ens({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-success text-xs">{children}</span>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] text-muted-public mt-[2px]">
      {children}
    </span>
  );
}
