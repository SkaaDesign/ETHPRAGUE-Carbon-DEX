import Link from "next/link";

const roles = [
  {
    href: "/company",
    label: "Company",
    description:
      "Verified emitters hold allowances, trade on the DEX, and surrender against emissions.",
  },
  {
    href: "/regulator",
    label: "Regulator",
    description:
      "EU ETS Authority. Scheduled allocation events, compliance roster, audit log, freeze powers.",
  },
  {
    href: "/public",
    label: "Public",
    description:
      "Read-only observer. Live trades, cap accounting, permanent retirement record.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-8 py-24">
      <header className="mb-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Carbon DEX
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-medium leading-[1.05] tracking-tight">
          Regulator-supervised on-chain settlement for EU-compliance carbon
          allowances.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          The secondary-market layer of the EU ETS, brought on-chain. Issuance is
          calendar-driven, trades are public, and surrender is permanent.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className="flex flex-col gap-3 bg-surface p-8 transition hover:bg-accent-soft/30"
          >
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {role.label}
            </span>
            <p className="text-sm leading-relaxed text-foreground">
              {role.description}
            </p>
          </Link>
        ))}
      </section>

      <footer className="mt-auto pt-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ETHPrague 2026 · Sourcify-verified contracts on Sepolia
        </p>
      </footer>
    </main>
  );
}
