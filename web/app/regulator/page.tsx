"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";

export default function RegulatorPage() {
  const { isConnected, address } = useAccount();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 py-12">
      <header className="flex items-start justify-between border-b border-border pb-8">
        <div>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Carbon DEX
          </Link>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            EU ETS Authority
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scheduled allocation events. Compliance roster. Audit log. Authority
            controls (freeze, pause).
          </p>
        </div>
        <ConnectButton showBalance={false} />
      </header>

      <section className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-3">
        <div className="bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Scheduled allocation events
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Calendar-driven issuance events, pre-computed upstream from sector
            benchmark × historical activity. Status flows{" "}
            <span className="font-mono">SCHEDULED → CONFIRMED → EXECUTED</span>.
          </p>
        </div>
        <div className="bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Compliance roster
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Verified addresses. Status: verified / frozen. Click for drill-down.
          </p>
        </div>
        <div className="bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Authority controls
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Discretionary powers: <span className="font-mono">freeze</span>,{" "}
            <span className="font-mono">unfreeze</span>,{" "}
            <span className="font-mono">pause</span>. Issuance is a process, not
            a button.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-md border border-border bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Audit log
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {isConnected
            ? `Connected as ${address}. Live event stream lands here once contracts are wired.`
            : "Connect the regulator wallet to see and act on the live event stream."}
        </p>
      </section>
    </main>
  );
}
