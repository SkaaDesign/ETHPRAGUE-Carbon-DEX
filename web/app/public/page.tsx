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
import { ChainErrorBanner, EEAShell, LiveBadge } from "@/components/ui";
import {
  EnsAppLink,
  EnsLink,
  EtherscanSourcify,
} from "@/components/EtherscanLink";
import { SectorCards } from "@/components/SectorCards";
import { SEPOLIA, recordsForEns } from "@/lib/contracts";
import { fmt, type AuditEntry } from "@/lib/demo-state";
import { getStateForRoute } from "@/lib/chain-state";
import { fetchApifySpot, spreadPct, timeAgo } from "@/lib/apify-spot";

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
  // Live chain state + off-chain spot price (Apify) fetched in parallel —
  // never block on Apify; null result hides the comparison surface entirely.
  const [{ state: s, isLive, error }, spot] = await Promise.all([
    getStateForRoute(usp),
    fetchApifySpot(),
  ]);
  const beat = s.beat;

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
        {error && (
          <div className="px-6 pt-4">
            <ChainErrorBanner error={error} />
          </div>
        )}

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
          {spot && s.spotPrice > 0 && (
            <>
              <span className="text-muted-public/60">·</span>
              <SpotComparison
                poolSpot={s.spotPrice}
                refSpot={spot.price}
                refSource={spot.source}
                refSourceUrl={spot.sourceUrl}
                fetchedAt={spot.fetchedAt}
              />
            </>
          )}
        </div>

        {/* Hero — text left, 3 stat cards right.
            Bigger landing-page feel; user scrolls down to reach the ledger.
            Cards subsume the previous cap-accounting tile + cap bar; the
            "+" button on each card deep-links to the underlying contract on
            Sepolia Etherscan, reinforcing "every number traces to chain". */}
        <section
          className="px-6 pt-12 pb-14 border-b border-border-public"
          style={{
            background:
              "linear-gradient(180deg, var(--pub-elev) 0%, #fff 80%)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 items-start max-w-[1240px] mx-auto">
            {/* Left — narrative */}
            <div>
              <p className="font-mono text-[11px] tracking-[0.16em] uppercase font-semibold text-success mb-[18px]">
                Open data · Phase IV · Vintage 2026
              </p>
              <h1 className="font-eea-serif text-[40px] sm:text-[48px] lg:text-[54px] font-normal leading-[1.05] tracking-[-0.02em] text-foreground-deep text-balance mb-6 max-w-[18ch]">
                A shared accounting of Europe&rsquo;s carbon budget &mdash;
                open to anyone, every block.
              </h1>
              <p className="text-[15px] text-muted-strong-public leading-[1.55] max-w-[52ch] mb-8">
                Every allocation, every trade, every retirement is written to
                a public ledger, queryable by anyone, no login required. This
                is what cap-and-trade looks like when the books are actually
                open.
              </p>
              <div className="flex items-center gap-4 text-[12px] font-mono flex-wrap">
                <EtherscanSourcify address={SEPOLIA.contracts.Regulator} />
                <span className="text-muted-public/60">·</span>
                <span className="inline-flex items-center gap-[6px] text-muted-strong-public">
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
            </div>

            {/* Right — 3 stat cards stacked */}
            <div className="flex flex-col gap-4">
              <StatCard
                tone="issued"
                label="Issued · vintage 2026"
                value={fmt(s.supply)}
                unit="EUA"
                delta={
                  s.beat >= 1
                    ? "▲ allocated · 09 May 2026"
                    : "awaiting first allocation"
                }
                contractAddress={SEPOLIA.contracts.CarbonCredit}
                actionTitle="Open CarbonCredit contract on Sepolia Etherscan"
              />
              <StatCard
                tone="circulating"
                label="In circulation"
                value={fmt(s.inCirculation)}
                unit="EUA"
                delta={inCircDelta}
                contractAddress={SEPOLIA.contracts.CarbonDEX}
                actionTitle="Open Carbon DEX pool on Sepolia Etherscan"
              />
              <StatCard
                tone="retired"
                label="Permanently retired"
                value={fmt(s.retired)}
                unit="EUA"
                delta={
                  s.retired
                    ? "▲ surrendered against verified emissions"
                    : "first retirement expected Q4"
                }
                deltaDown={!s.retired}
                contractAddress={SEPOLIA.contracts.Retirement}
                actionTitle="Open Retirement contract on Sepolia Etherscan"
              />
            </div>
          </div>
        </section>

        {/* Live ledger — every entry is sourced from s.audit (live chain
            events when isLive, sim'd from stateAt(beat) when not). Each row
            renders kind-specific copy and, when txHash is present, a deep
            link to the tx on Sepolia Etherscan. */}
        <Section
          title="Live ledger"
          subtitle="· every transaction, by anyone, with no login"
          action={<FilterButton />}
        >
          {s.audit.length === 0 ? (
            <div className="py-[18px] text-muted-public-empty text-xs italic text-dim">
              No transactions yet. The 2026 allocation event is queued.
            </div>
          ) : (
            s.audit.map((entry, i) => (
              <AuditLedgerRow
                key={entry.id}
                entry={entry}
                isLast={i === s.audit.length - 1}
              />
            ))
          )}
        </Section>

        {/* Browse sectors — replaces the verified-entities roster.
            Click → toast (placeholder). Cement is the featured card,
            story-coherent with cement-mainz on /company. */}
        <Section
          title="Browse by sector"
          subtitle="· EU ETS Phase IV coverage"
        >
          <div className="pt-2">
            <SectorCards />
          </div>
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

// Hero stat card — pastel surface, label + tonal icon top-left, big number
// in the body, delta line below, "+" deep-link to the contract on Sepolia
// Etherscan top-right. Three tones map to the three lifecycle stages of an
// allowance: issued (amber), in circulation (green), retired (blue).
function StatCard({
  tone,
  label,
  value,
  unit,
  delta,
  deltaDown,
  contractAddress,
  actionTitle,
}: {
  tone: "issued" | "circulating" | "retired";
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaDown?: boolean;
  contractAddress: string;
  actionTitle: string;
}) {
  const palette = {
    issued: {
      bg: "bg-[#fff1d4]",
      iconBg: "bg-[#fff8e6]",
      iconText: "text-[#8a6018]",
    },
    circulating: {
      bg: "bg-[#e2efe6]",
      iconBg: "bg-[#f0f6f1]",
      iconText: "text-[#1f5733]",
    },
    retired: {
      bg: "bg-[#e6ecf2]",
      iconBg: "bg-[#f0f3f7]",
      iconText: "text-[#1b4f8a]",
    },
  }[tone];
  return (
    <div
      className={`relative ${palette.bg} surface-card-tinted p-6`}
    >
      <div className="flex items-center gap-[10px] mb-5">
        <span
          aria-hidden
          className={`w-6 h-6 inline-flex items-center justify-center rounded-[6px] ${palette.iconBg} ${palette.iconText}`}
        >
          <ToneIcon tone={tone} />
        </span>
        <span className="text-[11px] font-eea-sans tracking-[0.04em] text-foreground-deep/80">
          {label}
        </span>
        <a
          href={`https://sepolia.etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          title={actionTitle}
          aria-label={actionTitle}
          className="ml-auto w-7 h-7 inline-flex items-center justify-center rounded-full bg-foreground-deep text-bright text-[14px] leading-none transition-transform hover:scale-110"
        >
          +
        </a>
      </div>
      <div className="font-eea-serif text-[44px] leading-none tracking-[-0.02em] text-foreground-deep tabular-nums">
        {value}
        <small className="text-[13px] text-foreground-deep/55 font-eea-sans ml-[8px] align-baseline">
          {unit}
        </small>
      </div>
      <div
        className={`text-[11px] font-eea-sans mt-3 ${
          deltaDown ? "text-danger" : "text-foreground-deep/70"
        }`}
      >
        {delta}
      </div>
    </div>
  );
}

function ToneIcon({ tone }: { tone: "issued" | "circulating" | "retired" }) {
  // Lightweight glyphs: down-arrow (issued/distributed), circle-arrows
  // (circulating), check-shield (retired/permanent).
  const path =
    tone === "issued" ? (
      <path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" />
    ) : tone === "circulating" ? (
      <path d="M4 12a8 8 0 0114-5.3L20 5v5h-5M20 12a8 8 0 01-14 5.3L4 19v-5h5" />
    ) : (
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zm-3 9l2 2 4-4" />
    );
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path}
    </svg>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  /** Optional right-aligned element (e.g. a Filter button) on the title row. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-6 mt-4 surface-card p-6">
      <h2 className="font-eea-serif text-[18px] font-medium text-foreground-deep mb-3 pb-2 border-b border-border-public flex items-baseline gap-[10px]">
        {title}
        <small className="font-eea-sans text-[11px] font-normal text-muted-public tracking-[0.04em]">
          {subtitle}
        </small>
        {action && <span className="ml-auto">{action}</span>}
      </h2>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

// Non-functional placeholder — Lin's call to surface the affordance now;
// wiring real filter state comes after demo if it sticks.
function FilterButton() {
  return (
    <button
      type="button"
      title="Filter (coming soon)"
      className="inline-flex items-center gap-[6px] px-[10px] py-[5px] text-[10px] font-mono uppercase tracking-[0.08em] text-muted-public border border-border-public rounded-[6px] hover:text-success hover:border-success transition-colors"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M3 6h18M6 12h12M10 18h4" />
      </svg>
      Filter
    </button>
  );
}

function LedgerRow({
  when,
  what,
  amt,
  amtUnit,
  isLast,
  actionHref,
  actionTitle,
}: {
  when: React.ReactNode;
  what: React.ReactNode;
  amt: string;
  amtUnit: string;
  isLast?: boolean;
  /** When present, render an icon-only "open on Etherscan" button at the
   *  right edge and apply a subtle hover tint to the whole row. */
  actionHref?: string;
  actionTitle?: string;
}) {
  const cols = actionHref
    ? "grid-cols-[80px_1fr_auto_auto]"
    : "grid-cols-[80px_1fr_auto]";
  return (
    <div
      className={`group grid ${cols} gap-[14px] py-3 px-2 -mx-2 rounded-[6px] text-[13px] items-baseline transition-all duration-150 ${
        actionHref
          ? "hover:bg-[#eaf2ec] hover:shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          : ""
      } ${isLast ? "" : "border-b border-border-row-light"}`}
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
      {actionHref && (
        <a
          href={actionHref}
          target="_blank"
          rel="noopener noreferrer"
          title={actionTitle ?? "Open on Sepolia Etherscan"}
          aria-label={actionTitle ?? "Open on Sepolia Etherscan"}
          className="self-center inline-flex items-center justify-center w-7 h-7 rounded-full text-muted-public hover:text-success hover:bg-success/10 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      )}
    </div>
  );
}

// Render-from-AuditEntry — switches on entry.kind and produces the
// kind-specific row content. The whole row is hover-tinted and an icon
// button at the right opens the tx on Etherscan; in-row tx-hash and
// per-name Etherscan links are intentionally absent — one click target
// per row keeps the ledger scannable (Lin's call).
function AuditLedgerRow({
  entry,
  isLast,
}: {
  entry: AuditEntry;
  isLast?: boolean;
}) {
  const when = entry.ts;
  const txHref = entry.txHash
    ? `https://sepolia.etherscan.io/tx/${entry.txHash}`
    : undefined;

  switch (entry.kind) {
    case "ISSUE":
      return (
        <LedgerRow
          when={when}
          isLast={isLast}
          actionHref={txHref}
          actionTitle="Open issuance tx on Sepolia Etherscan"
          what={
            <>
              <strong className="font-semibold text-foreground-deep">
                Allocation
              </strong>{" "}
              · <EnsName>eu-ets-authority.eth</EnsName> →{" "}
              <EnsName>{entry.to}</EnsName>
              <MetaHover>{entry.meta}</MetaHover>
            </>
          }
          amt={`+${stripUnit(entry.amount)}`}
          amtUnit="EUA · issued"
        />
      );
    case "SWAP":
      return (
        <LedgerRow
          when={when}
          isLast={isLast}
          actionHref={txHref}
          actionTitle="Open swap tx on Sepolia Etherscan"
          what={
            <>
              <strong className="font-semibold text-foreground-deep">
                Trade
              </strong>{" "}
              · <EnsName>{entry.from}</EnsName> →{" "}
              <EnsName>{entry.to}</EnsName>
              <MetaHover>
                {entry.outAmount} sold · {entry.inAmount} received · {entry.meta}
              </MetaHover>
            </>
          }
          amt={`−${stripUnit(entry.outAmount)}`}
          amtUnit="EUA · wallet → pool"
        />
      );
    case "RETIRE":
      return (
        <LedgerRow
          when={when}
          isLast={isLast}
          actionHref={txHref}
          actionTitle="Open retirement tx on Sepolia Etherscan"
          what={
            <>
              <strong className="font-semibold text-foreground-deep">
                Retirement
              </strong>{" "}
              · <EnsName>{entry.from}</EnsName>
              <MetaHover>{entry.meta}</MetaHover>
            </>
          }
          amt={`−${stripUnit(entry.amount)}`}
          amtUnit="EUA · burned"
        />
      );
    case "FREEZE":
    case "PAUSE":
      return (
        <LedgerRow
          when={when}
          isLast={isLast}
          actionHref={txHref}
          actionTitle="Open enforcement tx on Sepolia Etherscan"
          what={
            <>
              <strong className="font-semibold text-foreground-deep">
                {entry.kind === "FREEZE" ? "Authority freeze" : "Authority pause"}
              </strong>{" "}
              · <EnsName>{entry.target}</EnsName>
              <MetaHover>{entry.reason}</MetaHover>
            </>
          }
          amt="—"
          amtUnit="enforcement"
        />
      );
  }
}

// Entity name — used inside ledger rows. When the ENS name has a record
// in our ENS_RECORDS mirror (verified emitter), promote the legal name
// + ticker as the visible label and tuck the raw ENS name into the title
// tooltip; an inline ↗ button always opens the ENS profile on Sepolia
// (sepolia.app.ens.domains/<name>) where judges see the live records.
//
// Falls back to plain ENS-styled mono for the regulator (eu-ets-authority.eth)
// — which is itself a registered ENS, so ↗ still works — and to a plain
// span for non-ENS labels like "Carbon DEX Pool".
function EnsName({ children }: { children: React.ReactNode }) {
  const name = String(children);
  const records = recordsForEns(name);
  if (records) {
    return (
      <span
        className="inline-flex items-baseline gap-[6px] align-baseline"
        title={`${name} · open ENS profile to see records & track record`}
      >
        <span className="font-eea-sans text-[13px] font-medium text-foreground-deep">
          {records.name}
        </span>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-success">
          {records.ticker}
        </span>
        <EnsAppLink name={name} className="self-center" />
      </span>
    );
  }
  if (name.endsWith(".eth")) {
    return (
      <span className="inline-flex items-baseline gap-[4px] align-baseline">
        <span className="font-mono text-success text-xs">{name}</span>
        <EnsAppLink name={name} className="self-center" />
      </span>
    );
  }
  return <span className="font-mono text-success text-xs">{name}</span>;
}

// "1,000 EUA" → "1,000". Tolerates EURS too (for symmetry with SWAP fields).
function stripUnit(s: string): string {
  return s.replace(/\s*(EUA|EURS)\s*$/i, "").trim();
}

// Pool-vs-real spot comparison — single line in the transparency strip.
// Tooltip carries the source + freshness; the figure itself stays compact
// to fit the strip on a single visual row even at narrow widths.
function SpotComparison({
  poolSpot,
  refSpot,
  refSource,
  refSourceUrl,
  fetchedAt,
}: {
  poolSpot: number;
  refSpot: number;
  refSource: string;
  refSourceUrl?: string;
  fetchedAt: string;
}) {
  const spread = spreadPct(poolSpot, refSpot);
  const spreadCls =
    Math.abs(spread) < 0.5
      ? "text-muted-public"
      : spread > 0
        ? "text-success"
        : "text-danger";
  const arrow = spread > 0 ? "▲" : spread < 0 ? "▼" : "·";
  const title = `Pool spot read from CarbonDEX.getReserves(); reference spot scraped via Apify from ${refSource} ${timeAgo(fetchedAt)}.`;
  return (
    <span
      className="inline-flex items-baseline gap-[6px]"
      title={title}
    >
      <span>
        Spot · pool €{poolSpot.toFixed(2)} / real €{refSpot.toFixed(2)}
      </span>
      <span className={`font-semibold ${spreadCls}`}>
        {arrow} {Math.abs(spread).toFixed(2)}%
      </span>
      {refSourceUrl ? (
        <a
          href={refSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-success/70 hover:text-success"
          aria-label={`Open ${refSource} carbon page`}
          title={`${refSource} · open source page`}
        >
          ↗
        </a>
      ) : (
        <span className="text-muted-public/60">via {refSource}</span>
      )}
    </span>
  );
}

function Ens({ children }: { children: React.ReactNode }) {
  // Click-through to Sepolia Etherscan for any name in the ACTOR_ENS map;
  // falls back to a plain styled span otherwise (e.g. for design-time labels).
  return <EnsLink name={String(children)} />;
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[11px] text-muted-public mt-[2px]">
      {children}
    </span>
  );
}

// Hidden by default; revealed when the parent .group (a LedgerRow) is
// hovered. Used inside audit rows to keep the ledger compact and scannable
// — full provenance only when the user expresses intent to see it.
function MetaHover({ children }: { children: React.ReactNode }) {
  return (
    <span className="hidden group-hover:block text-[11px] text-muted-public mt-[2px]">
      {children}
    </span>
  );
}
