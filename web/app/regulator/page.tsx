// /regulator — Editorial Calm.
//
// Composition mirrors design/source/carbon-dex/project/happy-path/regulator-portal.jsx:
//   1. KPI strip          (issued / circulating / retired / pool)
//   2. Scheduled events   (one live row at Beat 0, executed thereafter; two static rows)
//   3. Audit log          (newest-first, beat-driven; freshest row flashes)
//   4. Compliance roster  (3 rows; cement-mainz status flips at Beat 3)
//
// Server component — beat is read from ?beat=0..3 via the Promise<searchParams>
// pattern (Next.js 16). The "Execute →" CTA is just a <Link> to ?beat=1, which
// is exactly the regulator's mental model: pressing Execute fires issuance.

import Link from "next/link";
import {
  fmt,
  stateAt,
  type AuditEntry,
} from "@/lib/demo-state";
import { getStateForRoute } from "@/lib/chain-state";
import {
  ChainErrorBanner,
  CTAButton,
  EditorialShell,
  Eyebrow,
  KindChip,
  LiveBadge,
  StatusPill,
} from "@/components/ui";
import { BeatSwitcher } from "@/components/BeatSwitcher";
import { EnsLink, EtherscanTx } from "@/components/EtherscanLink";
import { IssueAllocationPanel } from "@/components/actions";
import { HeaderWalletStatus } from "@/components/HeaderWalletStatus";

// Force dynamic — actions.tsx pulls in wagmi which validates WalletConnect
// projectId at module load. Static prerender at build time would fail
// without a real projectId env var; dynamic rendering means validation
// only happens at request time when the user has loaded the page.
export const dynamic = "force-dynamic";

export default async function RegulatorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") usp.set(k, v);
  }
  const { state, isLive, error } = await getStateForRoute(usp);
  const beat = state.beat;

  return (
    <>
      <EditorialShell
        brand="Regulator console"
        clock={state.clock}
        clockSuffix="UTC · 09 MAY 2026"
        pills={[
          { label: "Audit", active: true },
          { label: "Scheduled" },
          { label: "Roster" },
          { label: "Powers" },
        ]}
      >
        <Wrap>
          <ChainErrorBanner error={error} />
        </Wrap>

        {/* Identity strip — regulator's own identity + powers */}
        <Wrap>
          <IdentityStrip />
        </Wrap>

        {/* KPI row — 4 equal-weight cards (was a single bordered strip) */}
        <Wrap>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Issued · vintage 2026"
              value={fmt(state.supply)}
              unit="EUA"
            />
            <KpiCard
              label="In circulation"
              value={fmt(state.inCirculation)}
              unit="EUA"
            />
            <KpiCard label="Retired" value={fmt(state.retired)} unit="EUA" />
            <KpiCard label="Pool depth" value={fmt(state.poolEua)} unit="EUA" />
          </div>
        </Wrap>

        {/* 2-col: Scheduled allocation events | Compliance roster.
            Both are reference / overview lists; pairing them keeps the page
            scannable instead of one tall column. */}
        <Wrap>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Scheduled allocation events */}
            <section className="bg-surface rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="font-display font-normal text-[18px] mb-1">
                Scheduled allocation events
              </h3>
              <p className="text-[11px] text-muted mb-[14px]">
                Pre-computed: sector benchmark × historical activity. Issuance
                is a process, not a button-click.
              </p>

              <SchedRow
                ref_="2026-FA-DE-001"
                who="cement-mainz.verified-entity.eth"
                meta="free allocation · cement · DE · vintage 2026"
                qty="1,000"
                tone={
                  isLive
                    ? state.supply > 0
                      ? "executed"
                      : "live"
                    : beat === 0
                      ? "live"
                      : "executed"
                }
                right={
                  isLive ? (
                    state.supply > 0 ? (
                      <StatusPill kind="EXECUTED" />
                    ) : (
                      <StatusPill kind="CONFIRMED" />
                    )
                  ) : beat === 0 ? (
                    <Link href="/regulator?beat=1">
                      <CTAButton variant="warn">Execute →</CTAButton>
                    </Link>
                  ) : (
                    <StatusPill kind="EXECUTED" />
                  )
                }
              />

              <SchedRow
                ref_="2026-FA-SK-014"
                who="aluminium-bratislava.verified-entity.eth"
                meta="free allocation · aluminium · SK · vintage 2026"
                qty="820"
                right={<StatusPill kind="CONFIRMED" />}
              />

              <SchedRow
                ref_="2026-AU-Q3-EEX"
                who="EEX auction settlement"
                meta="post-auction custodian wrap · Q3 2026"
                qty="2,400"
                right={<StatusPill kind="SCHEDULED" />}
              />
            </section>

            {/* Compliance roster */}
            <section className="bg-surface rounded-2xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h3 className="font-display font-normal text-[18px] mb-3">
                Compliance roster
              </h3>

              <RosterRow
                name="cement-mainz.verified-entity.eth"
                sub="cement · DE"
                balance={`${fmt(state.coBal)} EUA`}
                status={beat >= 3 ? "✓ Surrendered Q4" : "✓ Verified"}
              />
              <RosterRow
                name="aluminium-bratislava.verified-entity.eth"
                sub="aluminium · SK"
                balance={`${fmt(state.coBalB)} EUA`}
                status="✓ Verified"
              />
              <RosterRow
                name="Carbon DEX Pool"
                sub="AMM · EURS ⇄ EUA"
                balance={`${fmt(state.poolEua)} EUA`}
                status="liquidity"
                statusTone="muted"
                last
              />
            </section>
          </div>
        </Wrap>

        {/* Hero action — Issue allowance form (live mode only). Sim mode
            uses the Execute → ?beat=1 link on the scheduled-events row. */}
        {isLive && (
          <Wrap>
            <IssueAllocationPanel />
          </Wrap>
        )}

        {/* Audit log — full width at the bottom */}
        <Wrap>
          <section className="bg-surface rounded-2xl border border-border pt-6 pb-2 flex flex-col min-h-[240px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="font-display font-normal text-[18px] px-[22px] pb-3 border-b border-border flex items-baseline gap-[10px]">
              Audit log
              <small className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted font-normal">
                · immutable · newest first
              </small>
            </h3>
            <div className="overflow-y-auto py-1 max-h-[420px]">
              {state.audit.length === 0 ? (
                <p className="px-6 py-6 text-xs italic text-dim">
                  Empty. The audit log writes itself when events fire.
                </p>
              ) : (
                state.audit.map((entry, i) => (
                  <AuditRow key={entry.id} entry={entry} fresh={i === 0} />
                ))
              )}
            </div>
          </section>
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

// ─── primitives (route-local) ──────────────────────────────────────────────

// ─── layout primitives shared with /company aesthetic ───────────────────

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1280px] mx-auto w-full">{children}</div>
  );
}

function IdentityStrip() {
  return (
    <div className="bg-surface rounded-2xl border border-border px-6 py-4 flex items-center gap-3 flex-wrap shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <span
        aria-hidden
        className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#1a2419,#2d6e4e)] flex-shrink-0"
      />
      <div className="min-w-0">
        <div className="font-mono text-[13px] leading-[1.2] text-foreground">
          eu-ets-authority.eth
        </div>
        <small className="block font-sans text-[10px] text-muted mt-[2px] tracking-[0.06em] uppercase">
          EU ETS Authority · Phase IV oversight
        </small>
      </div>
      <span className="ml-auto inline-flex items-center gap-[5px] text-[10px] tracking-[0.08em] uppercase text-success font-semibold">
        <span aria-hidden>✓</span>Authority
      </span>
      <span className="text-[10px] text-muted font-mono tracking-[0.08em] uppercase hidden sm:inline">
        Powers · ISSUE FREEZE PAUSE AUDIT
      </span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
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
    </div>
  );
}

function SchedRow({
  ref_,
  who,
  meta,
  qty,
  right,
  tone,
}: {
  ref_: string;
  who: string;
  meta: string;
  qty: string;
  right: React.ReactNode;
  tone?: "live" | "executed";
}) {
  const toneCls =
    tone === "live"
      ? "border-accent bg-accent-soft"
      : tone === "executed"
        ? "bg-[#f7f8f4] opacity-75 border-border"
        : "border-border";
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-[14px] py-3 border rounded-[10px] mb-2 ${toneCls}`}
    >
      <span className="font-mono text-[10px] text-muted tracking-[0.04em] bg-status-scheduled-bg px-2 py-1 rounded-[4px]">
        {ref_}
      </span>
      <span className="text-xs">
        <strong className="font-mono font-medium text-foreground">{who}</strong>
        <span className="block text-[10px] text-muted mt-[2px]">{meta}</span>
      </span>
      <span className="font-display text-[22px] -tracking-[0.01em]">
        {qty}
        <small className="font-sans text-[10px] text-muted ml-1">EUA</small>
      </span>
      {right}
    </div>
  );
}

function AuditRow({ entry, fresh }: { entry: AuditEntry; fresh: boolean }) {
  return (
    <div
      className={`grid grid-cols-[70px_90px_1fr_auto] gap-3 px-[22px] py-[11px] border-b border-border-row text-xs items-baseline last:border-b-0 ${
        fresh ? "flash-slow" : ""
      }`}
    >
      <span className="font-mono text-[10px] text-dim tracking-[0.04em]">
        {entry.ts}
      </span>
      <KindChip kind={entry.kind} />
      <span className="leading-snug">
        <AuditBody entry={entry} />
      </span>
      <span className="text-[10px] text-dim">
        {entry.txHash ? (
          <EtherscanTx hash={entry.txHash} short={entry.hash} className="text-[10px]" />
        ) : (
          <span className="font-mono">{entry.hash}</span>
        )}
      </span>
    </div>
  );
}

function AuditBody({ entry }: { entry: AuditEntry }) {
  const meta = (
    text: string,
  ): React.ReactNode => (
    <span className="block text-[10px] text-muted mt-[3px] font-mono tracking-[0.02em]">
      {text}
    </span>
  );
  const strongCls = "font-mono text-foreground";

  switch (entry.kind) {
    case "ISSUE":
      return (
        <>
          <strong className={strongCls}>{entry.amount}</strong> →{" "}
          <EnsLink name={entry.to} />
          {" · "}
          {meta(entry.meta)}
        </>
      );
    case "SWAP":
      return (
        <>
          <EnsLink name={entry.from} className="!font-semibold" /> ⇄{" "}
          <EnsLink name={entry.to} className="!font-semibold" /> ·{" "}
          <strong className={strongCls}>{entry.outAmount}</strong> sold ·{" "}
          {entry.inAmount} received{meta(entry.meta)}
        </>
      );
    case "RETIRE":
      return (
        <>
          <strong className={strongCls}>{entry.amount}</strong> ·{" "}
          <EnsLink name={entry.from} />
          {meta(entry.meta)}
        </>
      );
    case "FREEZE":
    case "PAUSE":
      return (
        <>
          <EnsLink name={entry.target} className="!font-semibold" />
          {meta(entry.reason)}
        </>
      );
  }
}

function RosterRow({
  name,
  sub,
  balance,
  status,
  statusTone = "success",
  last = false,
}: {
  name: string;
  sub: string;
  balance: string;
  status: string;
  statusTone?: "success" | "muted";
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto_auto] gap-3 py-[10px] text-xs items-baseline ${
        last ? "" : "border-b border-border-row"
      }`}
    >
      <span>
        <EnsLink name={name} className="!text-xs" />
        <small className="block font-sans text-[10px] text-muted mt-[2px]">
          {sub}
        </small>
      </span>
      <span className="font-mono tabular-nums">{balance}</span>
      <span
        className={`text-[10px] tracking-[0.08em] uppercase font-semibold ${
          statusTone === "success" ? "text-success" : "text-muted"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
