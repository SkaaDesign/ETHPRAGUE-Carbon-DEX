"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";

export default function CompanyPage() {
  const { isConnected, address } = useAccount();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-12">
      <header className="flex items-start justify-between border-b border-border pb-8">
        <div>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            ← Carbon DEX
          </Link>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            Company portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified emitter. Hold allowances, swap on the DEX, surrender against
            emissions.
          </p>
        </div>
        <ConnectButton showBalance={false} />
      </header>

      <section className="mt-12">
        {isConnected ? (
          <div className="rounded-md border border-border bg-surface p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Connected as
            </p>
            <p className="mt-2 font-mono text-sm break-all">{address}</p>
            <p className="mt-6 text-sm text-muted-foreground">
              Holdings, swap form, and surrender form will land here once contracts
              are wired (next step). For now: connect verifies the wallet flow
              works.
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface p-12 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Wallet not connected
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Connect a wallet (MetaMask, Rabby, hardware) to view holdings and
              transact.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
