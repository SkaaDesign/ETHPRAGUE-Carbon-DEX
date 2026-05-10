"use client";

// Sectors browser — 4 of EU ETS Phase IV's largest covered sectors,
// laid out as equal-weight cards. In production each would deep-link
// to a sector page (verified emitters, allocation calendar, retirement
// aggregates); for the demo, click fires a "coming soon" toast.
//
// Sources for the sector picks (Annex I, Directive 2003/87/EC + amendments):
//  - Power & heat generation: largest emitting sector, full auctioning since 2013
//  - Cement: clinker production, carbon-leakage listed, free allocation in transition
//  - Iron & steel: BOF + EAF; carbon-leakage listed; free allocation through 2026
//  - Aviation: intra-EEA flights since 2012; CORSIA-aligned for international from 2027
//
// Installation counts approximate, drawn from EUTL-reported active accounts.

import { useState, useEffect } from "react";

type Sector = {
  key: string;
  name: string;
  desc: string;
  count: string;
};

const SECTORS: Sector[] = [
  {
    key: "power",
    name: "Power generation",
    desc: "Combustion installations above 20 MW thermal input. Full auctioning since 2013 — no free allocation.",
    count: "2,734 installations",
  },
  {
    key: "heavy-industry",
    name: "Heavy industry",
    desc: "Cement, iron & steel, aluminium, chemicals, refining. Carbon-leakage protected through Phase IV under CBAM.",
    count: "3,180 installations",
  },
  {
    key: "aviation",
    name: "Aviation",
    desc: "Intra-EEA flight operators since 2012. CORSIA-aligned for international from 2027.",
    count: "412 operators",
  },
  {
    key: "maritime",
    name: "Maritime shipping",
    desc: "Vessels above 5,000 GT calling at EU ports. Newest in scope — phased in 2024 to 2027.",
    count: "1,547 vessels",
  },
];

export function SectorCards() {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SECTORS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setToast(`${s.name} sector page — coming soon`)}
            className="group relative text-left rounded-2xl p-6 bg-surface border border-border-public shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:border-success hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-success/40"
          >
            <div className="flex justify-between items-start gap-3 mb-10">
              <div>
                <h4 className="font-eea-serif text-[19px] leading-[1.15] mb-[6px] text-foreground-deep">
                  {s.name}
                </h4>
                <p className="text-[11px] leading-[1.45] font-eea-sans text-muted-public">
                  {s.desc}
                </p>
              </div>
              <SectorIcon kind={s.key} />
            </div>
            <div className="flex items-center justify-between">
              <ArrowGlyph />
              <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-muted-public">
                {s.count}
              </span>
            </div>
          </button>
        ))}
      </div>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-foreground-deep text-bright rounded-[10px] shadow-2xl text-[12px] font-mono tracking-[0.04em] flex items-center gap-3"
          style={{ animation: "slideup 0.18s ease-out" }}
        >
          <span aria-hidden className="w-[6px] h-[6px] rounded-full bg-accent" />
          {toast}
        </div>
      )}
    </>
  );
}

function SectorIcon({ kind }: { kind: string }) {
  // Lightweight abstract glyphs differentiating each card visually.
  let path: React.ReactNode = null;
  if (kind === "power") {
    path = <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />;
  } else if (kind === "heavy-industry") {
    path = (
      <>
        <rect x="3" y="13" width="5" height="8" />
        <rect x="10" y="9" width="5" height="12" />
        <rect x="17" y="5" width="4" height="16" />
        <path d="M3 13V9l5-3M10 9V5l5-2" />
      </>
    );
  } else if (kind === "aviation") {
    path = (
      <path d="M21 16l-7-4V5a2 2 0 00-4 0v7l-7 4v2l7-2v4l-2 1v1l4-1 4 1v-1l-2-1v-4l7 2v-2z" />
    );
  } else if (kind === "maritime") {
    path = (
      <>
        <path d="M2 18l2 3h16l2-3M4 16V8l8-3 8 3v8" />
        <path d="M12 5v11M8 11h8" />
      </>
    );
  }
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-success/35 flex-shrink-0 transition-colors group-hover:text-success/60"
      aria-hidden
    >
      {path}
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-foreground-deep transition-all duration-200 group-hover:translate-x-[3px] group-hover:text-success"
      aria-hidden
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
