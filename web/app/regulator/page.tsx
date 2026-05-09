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
  CTAButton,
  EditorialShell,
  Eyebrow,
  KindChip,
  LiveBadge,
  StatusPill,
} from "@/components/ui";
import { BeatSwitcher } from "@/components/BeatSwitcher";

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
  const { state, isLive } = await getStateForRoute(usp);
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
        {/* 1. KPI counters — single white tile, 4 columns */}
        <section className="bg-surface rounded-[14px] grid grid-cols-4 overflow-hidden">
          <Counter label="Issued · vintage 2026" value={fmt(state.supply)} />
          <Counter label="In circulation" value={fmt(state.inCirculation)} />
          <Counter label="Retired" value={fmt(state.retired)} />
          <Counter label="Pool depth" value={fmt(state.poolEua)} last />
        </section>

        {/* 2. Scheduled allocation events */}
        <section className="bg-surface rounded-[14px] px-[22px] py-[18px]">
          <h3 className="font-display font-normal text-[17px] mb-1">
            Scheduled allocation events
          </h3>
          <p className="text-[11px] text-muted mb-[14px]">
            Pre-computed: sector benchmark × historical activity. Issuance is a
            process, not a button-click.
          </p>

          {/* Row a) cement-mainz — live at Beat 0, executed at Beat ≥ 1 */}
          <SchedRow
            ref_="2026-FA-DE-001"
            who="cement-mainz.verified-entity.eth"
            meta="free allocation · cement · DE · vintage 2026"
            qty="1,000"
            tone={beat === 0 ? "live" : "executed"}
            right={
              beat === 0 ? (
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

        {/* 3. Audit log */}
        <section className="bg-surface rounded-[14px] pt-[18px] pb-2 flex flex-col flex-1 min-h-[240px] overflow-hidden">
          <h3 className="font-display font-normal text-[18px] px-[22px] pb-3 border-b border-border flex items-baseline gap-[10px]">
            Audit log
            <small className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted font-normal">
              · immutable · newest first
            </small>
          </h3>
          <div className="flex-1 overflow-y-auto py-1">
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

        {/* 4. Compliance roster */}
        <section className="bg-surface rounded-[14px] px-[22px] py-[18px]">
          <h3 className="font-display font-normal text-[17px] mb-3">
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
            balance="820 EUA"
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
      </EditorialShell>
      <div className="fixed top-3 right-4 z-50 px-3 py-[6px] bg-surface border border-border rounded-full shadow-sm">
        <LiveBadge isLive={isLive} beat={beat} />
      </div>
      <BeatSwitcher current={beat} />
    </>
  );
}

// ─── primitives (route-local) ──────────────────────────────────────────────

function Counter({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={`px-5 py-[18px] ${last ? "" : "border-r border-border"}`}>
      <Eyebrow>{label}</Eyebrow>
      <div className="font-display text-[30px] leading-none -tracking-[0.02em] tabular-nums">
        {value}
        <small className="font-sans text-[11px] text-muted ml-1 font-normal">
          EUA
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
      className={`grid grid-cols-[auto_1fr_auto_auto] gap-[14px] items-center px-[14px] py-3 border rounded-[10px] mb-2 ${toneCls}`}
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
      <span className="font-mono text-[10px] text-dim">
        {"hash" in entry ? entry.hash : ""}
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
          <strong className={strongCls}>{entry.amount}</strong> → {entry.to}
          {" · "}
          {meta(entry.meta)}
        </>
      );
    case "SWAP":
      return (
        <>
          <strong className={strongCls}>{entry.from}</strong> ⇄ {entry.to} ·{" "}
          <strong className={strongCls}>{entry.outAmount}</strong> sold ·{" "}
          {entry.inAmount} received{meta(entry.meta)}
        </>
      );
    case "RETIRE":
      return (
        <>
          <strong className={strongCls}>{entry.amount}</strong> · {entry.from}
          {meta(entry.meta)}
        </>
      );
    case "FREEZE":
    case "PAUSE":
      return (
        <>
          <strong className={strongCls}>{entry.target}</strong>
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
      <span className="font-mono">
        {name}
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
