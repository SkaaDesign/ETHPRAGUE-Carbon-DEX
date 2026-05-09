// Public Observer — cinematic editorial intelligence layer.
// Replaces dashboard tabs with a chapter-rail editorial flow.

const { COUNTRY_NAMES } = window.SEED;

// ---------- chapters ----------
const CHAPTERS = [
  { id: "market",      n: "01", label: "Hero" },
  { id: "depth",       n: "02", label: "Liquidity" },
  { id: "trades",      n: "03", label: "Flow" },
  { id: "regions",     n: "04", label: "Regions" },
  { id: "retirements", n: "05", label: "Retired" },
  { id: "reglog",      n: "06", label: "Authority" },
  { id: "proof",       n: "07", label: "Sources" },
];

// ---------- helpers ----------
function PriceSpark({ trades, w = 1200, h = 220, color = "var(--o-mint)" }) {
  const data = React.useMemo(() => {
    const arr = [...trades].reverse().map(t => t.price);
    if (arr.length < 2) return [2.5, 2.5];
    return arr;
  }, [trades]);
  const min = Math.min(...data) * 0.985;
  const max = Math.max(...data) * 1.015;
  const span = max - min || 1;
  const pts = data.map((p, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((p - min) / span) * h;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const fill = `${path} L${w},${h} L0,${h} Z`;
  // gridlines
  const grid = [];
  for (let i = 0; i <= 4; i++) {
    grid.push(<line key={i} x1="0" y1={(h / 4) * i} x2={w} y2={(h / 4) * i} stroke="var(--o-line-soft)" strokeWidth="1" />);
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h, overflow: "visible" }}>
      <defs>
        <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="hero-glow" x="-2%" y="-50%" width="104%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {grid}
      <path d={fill} fill="url(#hero-fill)" />
      <path d={path} stroke={color} strokeWidth="2" fill="none" filter="url(#hero-glow)" opacity="0.55" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
      )}
    </svg>
  );
}

function MiniSpark({ values, color = "var(--o-mint)", w = 120, h = 28 }) {
  if (!values || values.length < 2) values = [1, 1];
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function deltaPct(trades) {
  if (trades.length < 2) return 0;
  const last = trades[0].price;
  const oldest = trades[trades.length - 1].price;
  return ((last - oldest) / oldest) * 100;
}

function fmt(n, dec = 0) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function elapsed(d) {
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
}

// ---------- chapter rail ----------
function ChapterRail({ active, onJump, paused, currentBlock }) {
  return (
    <nav className="cn-rail">
      {CHAPTERS.map(c => (
        <button key={c.id} className={`cn-rail-item ${active === c.id ? "active" : ""}`} onClick={() => onJump(c.id)}>
          <span className="num">{c.n}</span>
          <span>{c.label}</span>
        </button>
      ))}
      <span className="cn-rail-meta">
        <span className="pulse"></span>
        {paused ? "Halted" : "On-chain · live"}
        <span style={{ opacity: 0.6 }}>· #{currentBlock.toLocaleString()}</span>
      </span>
    </nav>
  );
}

// ---------- shell ----------
function PublicShell({ state, tab, setTab }) {
  const refs = {
    market: React.useRef(null),
    depth: React.useRef(null),
    trades: React.useRef(null),
    regions: React.useRef(null),
    retirements: React.useRef(null),
    reglog: React.useRef(null),
    proof: React.useRef(null),
  };
  const [active, setActive] = React.useState("market");

  function jumpTo(id) {
    setTab(id);
    const el = refs[id]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Track active section by IntersectionObserver
  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        const id = visible[0].target.dataset.cnSection;
        if (id) setActive(id);
      }
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    Object.values(refs).forEach(r => r.current && obs.observe(r.current));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <ChapterRail active={active} onJump={jumpTo} paused={state.paused} currentBlock={state.currentBlock} />
      <ObserverHero state={state} ref={refs.market} />
      <ObserverDepth state={state} ref={refs.depth} />
      <ObserverFlow state={state} ref={refs.trades} />
      <ObserverRegions state={state} ref={refs.regions} />
      <ObserverRetirements state={state} ref={refs.retirements} />
      <ObserverRegLog state={state} ref={refs.reglog} />
      <ObserverProof state={state} ref={refs.proof} />
      <ObserverFootnote state={state} />
    </>
  );
}

// ---------- 01 Hero ----------
const ObserverHero = React.forwardRef(function ObserverHero({ state }, ref) {
  const price = state.pool.eurs / state.pool.eua;
  const dpct = deltaPct(state.trades);
  const totalSupply = state.audit.filter(a => a.action === "Minted").reduce((s, a) => {
    const m = a.detail.match(/([\d,]+)\s*EUA/);
    return s + (m ? parseInt(m[1].replace(/,/g, ""), 10) : 0);
  }, 0);
  const totalRetired = state.retirements.reduce((s, r) => s + r.amount, 0);
  const verifiedCount = state.companies.filter(c => c.status === "verified").length;
  const dayVol = state.trades.reduce((s, t) => s + t.eurs, 0);

  return (
    <section ref={ref} data-cn-section="market" className="cn-hero">
      <div className="cn-hero-glow"></div>
      <div className="cn-hero-grid"></div>
      <div className="cn-wrap">
        <div className="cn-hero-eyebrow">EU ETS · Public Observer · Base Sepolia</div>
        <h1 className="cn-display">
          A live record of <em>every</em>{" "}
          <span className="accent">European emission</span>{" "}
          allowance, on-chain.
        </h1>
        <p className="cn-lede">
          {fmt(verifiedCount)} verified emitters and buyers. {fmt(state.trades.length)} swaps since
          opening. {fmt(totalRetired)} EUA permanently retired. Every event is a public, signed
          regulatory action — verifiable without permission.
        </p>

        <div className="cn-hero-ticker">
          <div className="cn-ticker-cell">
            <span className="lbl">EUA · spot</span>
            <span className="val">{fmt(price, 3)}<span className="unit">EURS</span></span>
            <span className={`delta ${dpct >= 0 ? "up" : "down"}`}>
              {dpct >= 0 ? "▲" : "▼"} {fmt(Math.abs(dpct), 2)}%
              <span style={{ color: "var(--o-text-3)", marginLeft: 6 }}>· session</span>
            </span>
          </div>
          <div className="cn-ticker-cell">
            <span className="lbl">Volume · 24h</span>
            <span className="val">{fmt(dayVol / 1000, 1)}<span className="unit">k EURS</span></span>
            <span className="delta">{state.trades.length} swaps · {fmt(state.trades.reduce((s, t) => s + t.eua, 0))} EUA</span>
          </div>
          <div className="cn-ticker-cell">
            <span className="lbl">Allowance · in circulation</span>
            <span className="val">{fmt(totalSupply / 1000, 2)}<span className="unit">k EUA</span></span>
            <span className="delta">{fmt(totalRetired)} retired permanently</span>
          </div>
          <div className="cn-ticker-cell">
            <span className="lbl">DEX status</span>
            <span className="val" style={{ color: state.paused ? "var(--o-rose)" : "var(--o-mint)" }}>
              {state.paused ? "Halted" : "Active"}
            </span>
            <span className="delta">
              eu-ets-authority.eth · block #{state.currentBlock.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

// ---------- 02 Depth ----------
const ObserverDepth = React.forwardRef(function ObserverDepth({ state }, ref) {
  const price = state.pool.eurs / state.pool.eua;
  const dpct = deltaPct(state.trades);
  const sample = state.trades.slice(0, 80);

  return (
    <section ref={ref} data-cn-section="depth" className="cn-section">
      <div className="cn-wrap">
        <div className="cn-section-num">02 · Liquidity</div>
        <h2 className="cn-section-h">
          Price <em>discovers itself</em> — every block, against an automated reserve.
        </h2>
        <p className="cn-section-sub">
          A constant-product pool of EURS and EUA settles all trades. The line below is the price you
          would have paid, second by second.
        </p>

        <div className="cn-chart">
          <div className="cn-chart-head">
            <div>
              <div className="lbl">EUA / EURS · session</div>
              <div className="now">{fmt(price, 3)}<span className="unit">EURS per EUA</span></div>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                marginTop: 8,
                color: dpct >= 0 ? "var(--o-mint)" : "var(--o-rose)",
                letterSpacing: "0.06em",
              }}>
                {dpct >= 0 ? "▲" : "▼"} {fmt(Math.abs(dpct), 2)}% from session open
              </div>
            </div>
            <div className="legend">
              <span><span className="swatch" style={{ background: "var(--o-mint)" }}></span>Spot price</span>
              <span style={{ color: "var(--o-text-3)" }}>{state.trades.length} prints · last {elapsed(state.trades[0]?.time)}</span>
            </div>
          </div>
          <PriceSpark trades={sample} />
        </div>

        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ padding: 24, border: "1px solid var(--o-line-soft)", borderRadius: 8, background: "var(--o-surface)" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--o-text-3)", marginBottom: 16 }}>
              Pool reserve · EURS
            </div>
            <div style={{ fontSize: 36, fontWeight: 300, fontFeatureSettings: "'tnum'", letterSpacing: "-0.02em" }}>
              {fmt(state.pool.eurs, 0)}
              <span style={{ fontSize: 13, color: "var(--o-text-3)", marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace" }}>EURS</span>
            </div>
            <div className="cn-depth"><div className="a" style={{ width: `${(state.pool.eurs / (state.pool.eurs + state.pool.eua * price)) * 100}%` }}></div><div className="b" style={{ flex: 1 }}></div></div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--o-text-3)", letterSpacing: "0.04em" }}>
              {fmt((state.pool.eurs / (state.pool.eurs + state.pool.eua * price)) * 100, 1)}% of pool value · stablecoin leg
            </div>
          </div>
          <div style={{ padding: 24, border: "1px solid var(--o-line-soft)", borderRadius: 8, background: "var(--o-surface)" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--o-text-3)", marginBottom: 16 }}>
              Pool reserve · EUA
            </div>
            <div style={{ fontSize: 36, fontWeight: 300, fontFeatureSettings: "'tnum'", letterSpacing: "-0.02em" }}>
              {fmt(state.pool.eua, 0)}
              <span style={{ fontSize: 13, color: "var(--o-text-3)", marginLeft: 8, fontFamily: "'IBM Plex Mono', monospace" }}>EUA</span>
            </div>
            <div className="cn-depth"><div className="a" style={{ width: "100%", background: "var(--o-amber)" }}></div></div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--o-text-3)", letterSpacing: "0.04em" }}>
              {fmt(state.pool.eua / 1000, 2)}k tonnes of allowance · awaiting buyers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

// ---------- 03 Flow / live trades ----------
const ObserverFlow = React.forwardRef(function ObserverFlow({ state }, ref) {
  const recent = state.trades.slice(0, 14);
  return (
    <section ref={ref} data-cn-section="trades" className="cn-section">
      <div className="cn-wrap">
        <div className="cn-section-num">03 · Flow</div>
        <h2 className="cn-section-h">
          Capital moves <em>between obligations</em>. The ledger is the audit.
        </h2>
        <p className="cn-section-sub">
          Each row is a swap between two verified entities, atomic on Base Sepolia.
          No off-exchange settlement. No private books.
        </p>

        <div style={{ borderTop: "1px solid var(--o-line-soft)", borderBottom: "1px solid var(--o-line-soft)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 60px 1fr 100px 110px 110px", gap: 16, padding: "14px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--o-text-3)", borderBottom: "1px solid var(--o-line-soft)" }}>
            <span>Time</span>
            <span>Seller</span>
            <span></span>
            <span>Buyer</span>
            <span style={{ textAlign: "right" }}>EUA</span>
            <span style={{ textAlign: "right" }}>Px (EURS)</span>
            <span style={{ textAlign: "right" }}>Tx</span>
          </div>
          {recent.map((t, i) => (
            <div key={t.id} className={`cn-trade ${i === 0 && state.lastTradeIsNew ? "is-new" : ""}`}>
              <span className="t">{elapsed(t.time)}</span>
              <span className="from">{t.from}</span>
              <span className="arrow">→</span>
              <span className="to">{t.to}</span>
              <span className="qty">{fmt(t.eua)}<span className="u">EUA</span></span>
              <span className="px">{fmt(t.price, 3)}</span>
              <a className="tx" href={`https://sepolia.basescan.org/tx/${t.tx}`} target="_blank" rel="noreferrer">{t.tx.slice(0, 6)}…{t.tx.slice(-4)} ↗</a>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--o-text-3)", letterSpacing: "0.18em", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
          <span>Showing latest {recent.length} of {state.trades.length} session prints</span>
          <span>Source · CarbonDEX.sol — events.Swap</span>
        </div>
      </div>
    </section>
  );
});

// ---------- 04 Regions ----------
const ObserverRegions = React.forwardRef(function ObserverRegions({ state }, ref) {
  // Aggregate retirements + minted by country
  const byCountry = {};
  state.audit.filter(a => a.action === "Minted").forEach(a => {
    const target = state.companies.find(c => c.ens === a.target);
    if (!target) return;
    const m = a.detail.match(/([\d,]+)\s*EUA/);
    const amt = m ? parseInt(m[1].replace(/,/g, ""), 10) : 0;
    byCountry[target.country] = byCountry[target.country] || { minted: 0, retired: 0, traders: new Set() };
    byCountry[target.country].minted += amt;
    byCountry[target.country].traders.add(target.ens);
  });
  state.companies.forEach(c => {
    byCountry[c.country] = byCountry[c.country] || { minted: 0, retired: 0, traders: new Set() };
    byCountry[c.country].traders.add(c.ens);
  });
  state.retirements.forEach(r => {
    if (!byCountry[r.origin]) byCountry[r.origin] = { minted: 0, retired: 0, traders: new Set() };
    byCountry[r.origin].retired += r.amount;
  });

  const list = Object.entries(byCountry).slice(0, 8).map(([cc, d]) => ({
    cc, name: COUNTRY_NAMES[cc] || cc,
    minted: d.minted, retired: d.retired, traders: d.traders.size,
  })).sort((a, b) => b.minted - a.minted);

  // Synthetic sparks per country
  const sparkData = (seed) => {
    const arr = [];
    let v = 1 + (seed % 7) * 0.05;
    for (let i = 0; i < 24; i++) {
      v += (Math.sin((i + seed) * 0.7) + Math.cos((i + seed) * 0.3)) * 0.04;
      arr.push(v);
    }
    return arr;
  };

  return (
    <section ref={ref} data-cn-section="regions" className="cn-section">
      <div className="cn-wrap">
        <div className="cn-section-num">04 · Regions</div>
        <h2 className="cn-section-h">
          Allowance issued, by <em>jurisdiction</em>.
        </h2>
        <p className="cn-section-sub">
          Where the EU ETS Authority has minted credits, mapped against the verified emitters
          permitted to hold them. Click any region for the contract trail.
        </p>

        <div className="cn-regions">
          {list.map((r, i) => (
            <div key={r.cc} className="cn-region">
              <span className="cc">{r.cc}</span>
              <span className="name">{r.name}</span>
              <span className="v">{fmt(r.minted)}</span>
              <span className="vsub">EUA issued · {r.traders} entit{r.traders === 1 ? "y" : "ies"}</span>
              <div className="spark">
                <MiniSpark values={sparkData(r.cc.charCodeAt(0) + i * 3)} color={i % 2 ? "var(--o-mint)" : "var(--o-amber)"} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// ---------- 05 Retirements ----------
const ObserverRetirements = React.forwardRef(function ObserverRetirements({ state }, ref) {
  const [selected, setSelected] = React.useState(null);
  const totalRetired = state.retirements.reduce((s, r) => s + r.amount, 0);
  return (
    <section ref={ref} data-cn-section="retirements" className="cn-section">
      <div className="cn-wrap">
        <div className="cn-section-num">05 · Retired</div>
        <h2 className="cn-section-h">
          {fmt(totalRetired)} EUA, <em>permanently burned</em>.
        </h2>
        <p className="cn-section-sub">
          Retirement is one-way. A burned allowance cannot be re-issued, transferred, or traded. Every
          retirement below is a finalised act of compliance, signed by the retiring entity.
        </p>

        {state.retirements.length === 0 ? (
          <div className="cn-empty-cn">
            No retirements on the ledger yet. The first retirement will appear here, permanently.
          </div>
        ) : (
          <div className="cn-memorial">
            {state.retirements.map(r => (
              <div key={r.id} className="cn-memorial-row" onClick={() => setSelected(r)}>
                <span className="amount">{fmt(r.amount)}<span className="u">EUA</span></span>
                <span className="by">
                  Retired by <span className="ens">{r.by}</span>
                  <span className="meta">{r.sector} · vintage {r.vintage} · origin {r.origin}</span>
                </span>
                <span className="when">{fmtDate(r.time)}<br /><span style={{ opacity: 0.6 }}>block #{r.block.toLocaleString()}</span></span>
                <a className="tx" href={`https://sepolia.basescan.org/tx/${r.tx}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{r.tx.slice(0, 8)}… ↗</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="kicker">Retirement #{selected.id}</div>
          <h2 className="h1" style={{ margin: "8px 0 16px" }}>{fmt(selected.amount)} EUA retired permanently</h2>
          <div className="col" style={{ gap: 6, fontSize: 13 }}>
            <div className="spec-row"><span>By</span><span className="v"><ENSName ens={selected.by} /></span></div>
            <div className="spec-row"><span>Sector</span><span className="v">{selected.sector}</span></div>
            <div className="spec-row"><span>Vintage</span><span className="v">{selected.vintage}</span></div>
            <div className="spec-row"><span>Origin</span><span className="v">{selected.origin} — {COUNTRY_NAMES[selected.origin] || ""}</span></div>
            <div className="spec-row"><span>Beneficiary</span><span className="v"><ENSName ens={selected.beneficiary} /></span></div>
            <div className="spec-row"><span>Reason URI</span><span className="v">{selected.reason || "—"}</span></div>
            <div className="spec-row"><span>Timestamp</span><span className="v">{fmtDate(selected.time)}</span></div>
            <div className="spec-row"><span>Block</span><span className="v">#{selected.block.toLocaleString()}</span></div>
            <div className="spec-row"><span>Tx</span><span className="v"><TxHash hash={selected.tx} /></span></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <Sourcify contract="Retirement.sol" />
            <button className="btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </section>
  );
});

// ---------- 06 Reg log ----------
const ObserverRegLog = React.forwardRef(function ObserverRegLog({ state }, ref) {
  const recent = state.audit.slice(0, 12);
  return (
    <section ref={ref} data-cn-section="reglog" className="cn-section">
      <div className="cn-wrap">
        <div className="cn-section-num">06 · Authority</div>
        <h2 className="cn-section-h">
          The regulator <em>writes in public</em>.
        </h2>
        <p className="cn-section-sub">
          Every action by eu-ets-authority.eth — every mint, freeze, register, pause — emits a
          RegulatoryAction event. The history below cannot be edited or amended.
        </p>

        <div className="cn-status-row" style={{ marginBottom: 48 }}>
          <div className={`cn-status ${state.paused ? "crit" : "good"}`}>
            <span className="dot"></span>
            <span className="signal">DEX state</span>
            <h3>{state.paused ? "Trading is halted by the authority" : "Trading is open and uninterrupted"}</h3>
            <p>{state.paused
              ? `Paused at block #${(state.pausedBlock || 0).toLocaleString()} · all swaps will revert until resumed.`
              : "All verified participants may swap. The authority can pause atomically at any time."}</p>
            <span className="read">Source · CarbonDEX.emergencyPause</span>
          </div>
          <div className="cn-status warn">
            <span className="dot"></span>
            <span className="signal">Compliance frontier</span>
            <h3>{state.companies.filter(c => c.status === "frozen").length} accounts under freeze</h3>
            <p>Frozen entities cannot transfer, swap, or retire. Status persists until unfreeze is signed by the authority.</p>
            <span className="read">Source · ComplianceRegistry.freeze</span>
          </div>
          <div className="cn-status good">
            <span className="dot"></span>
            <span className="signal">Verification</span>
            <h3>{state.companies.filter(c => c.status === "verified").length} entities verified to trade</h3>
            <p>Each registered through ComplianceRegistry. ENS resolution + on-chain country and allowance type.</p>
            <span className="read">Source · ComplianceRegistry.register</span>
          </div>
        </div>

        <div className="cn-timeline">
          {recent.map((a, i) => (
            <div key={i} className="cn-tl-row">
              <span className="t">{fmtDate(a.time).slice(11, 19)} UTC<span className="blk">block #{a.block.toLocaleString()}</span></span>
              <span className={`a ${a.action.toLowerCase()}`}>{a.action}</span>
              <span className="desc">
                {a.target === "DEX"
                  ? <><span className="ens">eu-ets-authority.eth</span> {a.action.toLowerCase()} <strong>the exchange</strong></>
                  : <><span className="ens">eu-ets-authority.eth</span> {a.action.toLowerCase()} <span className="ens">{a.target}</span></>}
                <span className="meta">{a.detail}</span>
              </span>
              <a className="tx" href={`https://sepolia.basescan.org/tx/${a.tx}`} target="_blank" rel="noreferrer">{a.tx.slice(0, 8)}… ↗</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// ---------- 07 Sources ----------
const ObserverProof = React.forwardRef(function ObserverProof({ state }, ref) {
  const contracts = [
    { name: "CarbonDEX.sol", role: "AMM swap engine", addr: "0x4d8e7c3a2b1f5e9d6c8a7b4e3f2d1c5b8a9e6d72" },
    { name: "CarbonCredit.sol", role: "EUA token (ERC-1155)", addr: "0x2c5d9e1f3a7b8c4d6e2f9a1b3c5d7e8f2a4b6c81" },
    { name: "Retirement.sol", role: "Permanent burn ledger", addr: "0x9f2c8d4e1a6b3c7f5d2e8a9b4c6f1d3e5a8c7b2d" },
    { name: "ComplianceRegistry.sol", role: "KYC + freeze logic", addr: "0x5f3a1c9e7b2d4f8c6a3b9d1e5f7c2a8d4b6e9f12" },
  ];
  return (
    <section ref={ref} data-cn-section="proof" className="cn-proof">
      <div className="cn-wrap">
        <div className="cn-section-num">07 · Sources</div>
        <h2 className="cn-section-h">
          Four contracts. <em>Verified bytecode.</em> Read them yourself.
        </h2>
        <p className="cn-section-sub">
          Every value above is derived from these four contracts. Source code is published to Sourcify
          and matches the bytecode deployed on Base Sepolia.
        </p>
        <div className="cn-proof-grid">
          {contracts.map(c => (
            <a key={c.name} className="cn-proof-cell" href={`https://sourcify.dev/#/lookup/${c.addr}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <span className="lbl">{c.role}</span>
              <span className="name">{c.name}</span>
              <span className="addr">{c.addr.slice(0, 10)}…{c.addr.slice(-6)}</span>
              <span className="ok">✓ Verified on Sourcify ↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
});

// ---------- footnote ----------
function ObserverFootnote({ state }) {
  return (
    <footer className="cn-foot">
      <div className="cn-wrap" style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: 0 }}>
        <span>Carbon Credit Exchange · Public Observer · v0.1</span>
        <span>Block #{state.currentBlock.toLocaleString()} · Base Sepolia</span>
      </div>
    </footer>
  );
}

Object.assign(window, {
  PublicShell, ObserverHero, ObserverDepth, ObserverFlow,
  ObserverRegions, ObserverRetirements, ObserverRegLog, ObserverProof,
});
