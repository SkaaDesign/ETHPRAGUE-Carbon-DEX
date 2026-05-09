import Link from "next/link";

export default function PublicPage() {
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
            Public observer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Read-only. No wallet required.
          </p>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-success">
          ● Wallet not required
        </span>
      </header>

      <section className="mt-12 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
        <div className="bg-surface p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Issued
          </p>
          <p className="mt-3 text-4xl font-medium tabular-nums">—</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">EUAs</p>
        </div>
        <div className="bg-surface p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Retired
          </p>
          <p className="mt-3 text-4xl font-medium tabular-nums">—</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">EUAs</p>
        </div>
        <div className="bg-surface p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            In circulation
          </p>
          <p className="mt-3 text-4xl font-medium tabular-nums">—</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">EUAs</p>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Live trades
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Real-time DEX swap log. Wallet-free. Will populate once contracts are
            wired.
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Permanent retirements
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            On-chain offset proofs companies cite in disclosures. Permanent.
            Public.
          </p>
        </div>
      </section>
    </main>
  );
}
