"use client";

// Beat-switcher dev tool.
//
// Floating bottom-right pill that lets you step through ?beat=0..3 on any
// of the three routes. Hidden by default; set NEXT_PUBLIC_SHOW_BEAT_SWITCHER=1
// in `.env.local` to bring it back during development.
//
// Not a mock — it's a time-traveler over the chain's eventual state. Each
// beat corresponds to a real moment the demo will reach: pre-allocation,
// post-issuance, post-trade, post-retire. The `?beat=N` URL fallback still
// works for stage-demo emergencies regardless of this pill's visibility.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Beat } from "@/lib/demo-state";

const BEATS: { n: Beat; label: string }[] = [
  { n: 0, label: "Pre-demo" },
  { n: 1, label: "Issuance" },
  { n: 2, label: "Trade" },
  { n: 3, label: "Retire" },
];

export function BeatSwitcher({ current }: { current: Beat }) {
  // Hooks must run on every render (rules-of-hooks); the env-gate happens
  // after them. NEXT_PUBLIC_ env values are inlined at build time, so the
  // branch is effectively constant per build.
  const pathname = usePathname();
  const params = useSearchParams();
  if (process.env.NEXT_PUBLIC_SHOW_BEAT_SWITCHER !== "1") return null;

  return (
    <div
      role="navigation"
      aria-label="Demo beat switcher"
      className="fixed bottom-4 right-4 z-50 bg-foreground/95 backdrop-blur-sm border border-border-dark rounded-full p-1 flex gap-0 shadow-2xl"
    >
      {BEATS.map((b) => {
        const next = new URLSearchParams(params?.toString() ?? "");
        next.set("beat", String(b.n));
        const href = `${pathname}?${next.toString()}`;
        const active = b.n === current;
        return (
          <Link
            key={b.n}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`px-3 py-2 text-[11px] font-medium font-sans rounded-full inline-flex items-center gap-2 transition-colors ${
              active
                ? "bg-bright text-foreground"
                : "text-bright-dim hover:text-bright"
            }`}
          >
            <span className="font-mono text-[10px] opacity-60">0{b.n}</span>
            <span>{b.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
