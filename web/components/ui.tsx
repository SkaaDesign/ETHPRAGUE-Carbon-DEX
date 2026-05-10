// Carbon DEX — shared primitives.
//
// All components here are server-renderable (no React hooks). Components
// requiring interactivity or browser-only APIs live in their own files
// with `"use client"`.
//
// Visual languages:
//   - Editorial Calm  → /regulator + /company  (IBM Plex Sans + Fraunces)
//   - EEA Editorial   → /public                (Source Sans 3 + Source Serif 4)
//
// Tokens (--color-*, --font-*) come from web/app/globals.css.

import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `.ec-eb` — small uppercase mono label.
 * Used everywhere as section / panel header.
 */
export function Eyebrow({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: "muted" | "muted-public" | "accent" | "success";
  className?: string;
}) {
  const tones = {
    muted: "text-muted",
    "muted-public": "text-muted-public",
    accent: "text-accent",
    success: "text-success",
  };
  return (
    <p
      className={`font-mono text-[9px] uppercase tracking-[0.2em] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

type CTAVariant = "default" | "ghost" | "warn" | "danger" | "lime";

/**
 * `.ec-cta` — pill button. Default is dark; variants for actions:
 *   warn (copper) → "Execute" on regulator scheduled events
 *   lime → swap-form CTA on /company
 *   ghost → secondary
 *   danger → destructive (freeze, etc.)
 */
export function CTAButton({
  variant = "default",
  children,
  className = "",
  ...props
}: {
  variant?: CTAVariant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<CTAVariant, string> = {
    default:
      "bg-foreground text-white hover:bg-[#3a3833] disabled:bg-border-strong disabled:text-muted",
    ghost:
      "bg-transparent text-foreground border border-border-strong hover:bg-surface",
    warn: "bg-accent text-foreground hover:bg-accent-hover",
    danger: "bg-danger text-white",
    lime: "bg-accent-lime text-foreground hover:bg-accent-lime-hover font-semibold",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[13px] leading-none tracking-[0.01em] cursor-pointer disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.14)] ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

type StatusKind = "SCHEDULED" | "CONFIRMED" | "EXECUTED";

/**
 * `.status.SCHEDULED|CONFIRMED|EXECUTED` — regulator scheduled-event status.
 * Mono, 9px, uppercase, tight 4-px-radius pill.
 */
export function StatusPill({ kind }: { kind: StatusKind }) {
  const styles: Record<StatusKind, string> = {
    SCHEDULED: "bg-status-scheduled-bg text-status-scheduled-text",
    CONFIRMED: "bg-status-confirmed-bg text-status-confirmed-text",
    EXECUTED: "bg-status-executed-bg text-status-executed-text",
  };
  const label =
    kind === "SCHEDULED"
      ? "Scheduled"
      : kind === "CONFIRMED"
        ? "Confirmed"
        : "Executed";
  return (
    <span
      className={`inline-block font-mono text-[9px] tracking-[0.16em] uppercase px-2 py-1 rounded-[3px] ${styles[kind]}`}
    >
      {label}
    </span>
  );
}

type AuditKind = "ISSUE" | "SWAP" | "RETIRE" | "FREEZE" | "PAUSE";

/**
 * `.kind.ISSUE|SWAP|RETIRE|...` — audit-log entry chip.
 * Each kind has its own bg+text pair from globals.css tokens.
 */
export function KindChip({ kind }: { kind: AuditKind }) {
  const styles: Record<AuditKind, string> = {
    ISSUE: "bg-chip-issue-bg text-chip-issue-text",
    SWAP: "bg-chip-swap-bg text-chip-swap-text",
    RETIRE: "bg-chip-retire-bg text-chip-retire-text",
    FREEZE: "bg-danger text-white",
    PAUSE: "bg-accent text-foreground",
  };
  return (
    <span
      className={`inline-block font-mono text-[10px] tracking-[0.16em] font-semibold px-2 py-[2px] rounded-[3px] text-center ${styles[kind]}`}
    >
      {kind}
    </span>
  );
}

/**
 * `.sourcify` — inline checkmark badge.
 * Shown next to verified contract addresses.
 */
export function SourcifyBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[5px] text-[10px] tracking-[0.08em] uppercase text-success font-semibold ${className}`}
    >
      <span aria-hidden>✓</span>Sourcify-verified
    </span>
  );
}

/**
 * Chain-error banner — surfaces when `getStateForRoute` caught an RPC failure
 * and dropped to sim. Renders nothing when `error` is undefined. The route is
 * still rendering with sim-fallback data; this banner is what tells the user
 * "the numbers below are not live, here's why" instead of pretending.
 */
export function ChainErrorBanner({
  error,
  className = "",
}: {
  error?: string;
  className?: string;
}) {
  if (!error) return null;
  return (
    <div
      role="status"
      className={`bg-accent-soft border border-accent rounded-[10px] px-5 py-[14px] text-xs leading-[1.5] flex gap-3 items-start ${className}`}
    >
      <span
        aria-hidden
        className="font-mono text-[10px] tracking-[0.16em] uppercase bg-accent text-foreground px-2 py-[3px] rounded-[3px] flex-shrink-0 mt-[1px]"
      >
        Sim · fallback
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[13px] leading-[1.3] mb-[2px]">
          Chain reads failed — showing simulated state.
        </p>
        <p className="font-mono text-[10px] text-muted break-words leading-[1.45]">
          {error}
        </p>
      </div>
    </div>
  );
}

/**
 * `.tx-link` — tx hash / external link styled as success-green underline mono.
 */
export function TxLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-[11px] text-success underline ${className}`}
    >
      {children}
    </Link>
  );
}

/**
 * Live / sim badge — small visual cue surfacing whether the route is
 * reading from Sepolia (live) or from the stateAt() simulation. Lives in
 * the page header next to the brand or nav.
 */
export function LiveBadge({
  isLive,
  beat,
  className = "",
}: {
  isLive: boolean;
  beat: number;
  className?: string;
}) {
  if (isLive) {
    return (
      <span
        className={`inline-flex items-center gap-[5px] font-mono text-[10px] tracking-[0.08em] uppercase text-success ${className}`}
      >
        <span
          aria-hidden
          className="w-[6px] h-[6px] rounded-full bg-success"
          style={{ animation: "pulse 2s infinite" }}
        />
        LIVE · Sepolia
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-[5px] font-mono text-[10px] tracking-[0.08em] uppercase text-muted ${className}`}
    >
      <span aria-hidden className="w-[6px] h-[6px] rounded-full bg-accent" />
      SIM · Beat {beat}
    </span>
  );
}

/**
 * EU flag — public observer header.
 * CSS-drawn 22×16 blue rectangle with a yellow star.
 */
export function EUFlag({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="EU flag"
      className={`inline-flex items-center justify-center w-[22px] h-4 bg-eu-blue rounded-[1px] ${className}`}
    >
      <span className="text-eu-yellow text-[8px] leading-none" aria-hidden>
        ★
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shells
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `.ec` shell — Editorial Calm wrapper for /regulator + /company.
 * Cream body, brand+clock+pills header, vertical-stack body slot.
 *
 * The body content is laid out by the route — this just provides the
 * outer chrome (cream surface, header strip, font defaults).
 */
export function EditorialShell({
  brand,
  clock,
  clockSuffix,
  pills,
  children,
}: {
  brand: ReactNode;
  clock: string;
  clockSuffix?: string;
  pills: { label: string; active?: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ec-textured flex flex-col font-sans text-foreground">
      <header className="flex items-center gap-[14px] px-5 pt-4 pb-[14px]">
        <div className="flex items-center gap-2 font-display font-medium text-base">
          <span aria-hidden className="w-4 h-4 rounded-full bg-foreground" />
          {brand}
        </div>
        <div className="font-mono text-[11px] leading-[1.1] text-muted-strong">
          {clock}
          {clockSuffix && (
            <small className="block text-[9px] text-dim mt-[2px] tracking-[0.06em] uppercase">
              {clockSuffix}
            </small>
          )}
        </div>
        <nav className="flex gap-[5px] ml-auto">
          {pills.map((p) => (
            <span
              key={p.label}
              className={`px-3 py-[6px] border rounded-full text-[11px] cursor-default ${
                p.active
                  ? "bg-foreground text-white border-foreground"
                  : "bg-surface text-muted-strong border-border-strong"
              }`}
            >
              {p.label}
            </span>
          ))}
        </nav>
      </header>
      <div className="flex-1 px-5 pb-5 flex flex-col gap-[14px]">{children}</div>
    </div>
  );
}

/**
 * `.pub` shell — EEA Editorial wrapper for /public observer.
 * EU flag header, breadcrumbs, EEA typography by default.
 */
export function EEAShell({
  navItems,
  crumbs,
  children,
}: {
  navItems: { label: string; href: string; active?: boolean }[];
  crumbs: { label: string; href?: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-pub-textured flex flex-col font-eea-sans">
      {/* Top bar */}
      <header className="bg-pub-bg px-6 py-3 border-b border-border-public flex items-center gap-[18px] text-xs">
        <div className="flex items-center gap-[9px] text-foreground font-semibold">
          <EUFlag />
          European Union · ETS Public Registry
        </div>
        <nav className="flex gap-4 ml-auto">
          {navItems.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`text-xs no-underline ${
                n.active
                  ? "text-foreground font-semibold border-b-2 border-success pb-3 -mb-[13px]"
                  : "text-muted-strong-public"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <span className="text-muted-public text-[11px] pl-4 border-l border-border-public">
          EN · 24 langs
        </span>
      </header>

      {/* Breadcrumbs */}
      <div className="px-6 py-3 text-xs text-muted-public bg-pub-elev border-b border-border-public">
        {crumbs.map((c, i) => (
          <span key={c.label}>
            {c.href ? (
              <Link href={c.href} className="text-success no-underline">
                {c.label}
              </Link>
            ) : (
              c.label
            )}
            {i < crumbs.length - 1 && (
              <span className="mx-2 text-[#b0b6ac]">›</span>
            )}
          </span>
        ))}
      </div>

      {children}
    </div>
  );
}
