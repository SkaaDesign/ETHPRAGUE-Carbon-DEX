// Regulator portal: Overview, Mint, KYC, Live feed + Pause, Audit log

const { REGULATOR_USER, COMPANY_SEED, SECTORS, VINTAGES, COUNTRY_NAMES } = window.SEED;

// =================================================================
// Regulator dashboard wrapper with sidebar
// =================================================================
function RegulatorShell({ state, page, setPage, children }) {
  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "mint", label: "Mint credits" },
    { id: "kyc", label: "Compliance Registry" },
    { id: "feed", label: "Live trade feed", num: state.trades.length },
    { id: "audit", label: "Audit log", num: state.audit.length },
  ];
  return (
    <div className="with-sidebar">
      <aside className="sidebar">
        <div className="nav-section">EU ETS Authority</div>
        <div style={{ padding: "0 20px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="ens" style={{ fontSize: 12 }}>{REGULATOR_USER.ens}</span>
          <span className="mono muted" style={{ fontSize: 11 }}>{REGULATOR_USER.addr.slice(0, 10)}…</span>
        </div>
        <div className="nav-section">Console</div>
        {navItems.map(n => (
          <div
            key={n.id}
            className={`nav-item ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
          >
            {n.label}
            {n.num !== undefined && <span className="num">{n.num}</span>}
          </div>
        ))}
      </aside>
      <div className="main">
        {children}
      </div>
    </div>
  );
}

// =================================================================
// Overview
// =================================================================
function RegulatorOverview({ state, setPage }) {
  const totalSupply = state.audit
    .filter(a => a.action === "Minted")
    .reduce((s, a) => {
      const m = a.detail.match(/([\d,]+)\s*EUA/);
      return s + (m ? parseInt(m[1].replace(/,/g, ""), 10) : 0);
    }, 0);
  const tradesToday = state.trades.length;
  const verifiedCount = state.companies.filter(c => c.status === "verified").length;
  const recent = state.audit.slice(0, 8);

  return (
    <div className="container wide">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="kicker">Regulator</div>
          <h1 className="h1" style={{ marginTop: 4 }}>Console overview</h1>
        </div>
        <span className="muted" style={{ fontSize: 12 }}>
          Signed in as <ENSName ens={REGULATOR_USER.ens} />
        </span>
      </div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="metric">
          <span className="label">Total supply</span>
          <span className="value">{fmtNum(totalSupply)}<span className="unit">EUA</span></span>
        </div>
        <div className="metric">
          <span className="label">Companies KYC'd</span>
          <span className="value">{verifiedCount}<span className="unit">verified</span></span>
        </div>
        <div className="metric">
          <span className="label">Trades today</span>
          <span className="value">{tradesToday}</span>
        </div>
        <div className="metric">
          <span className="label">DEX status</span>
          <span style={{ marginTop: 4 }}>
            {state.paused
              ? <Chip kind="frozen">Paused</Chip>
              : <Chip kind="verified">Active</Chip>}
          </span>
        </div>
      </div>

      <div className="grid-2-eq" style={{ marginBottom: 16 }}>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <span className="panel-title">Quick actions</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn regulator full lg" onClick={() => setPage("mint")}>Mint new credits →</button>
            <button className="btn full" onClick={() => setPage("kyc")}>Compliance registry →</button>
            <button className="btn full" onClick={() => setPage("feed")}>Live trade feed →</button>
            <button className="btn ghost full" onClick={() => setPage("audit")}>Open audit log →</button>
          </div>
        </div>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <span className="panel-title">Pool reserves</span>
            <span className="muted mono" style={{ fontSize: 12 }}>1 EUA = {fmtNum(state.pool.eurs / state.pool.eua, 3)} EURS</span>
          </div>
          <div style={{ padding: 20 }}>
            <div className="depth-bar">
              <div className="eurs" style={{ width: `${(state.pool.eurs / (state.pool.eurs + state.pool.eua * (state.pool.eurs / state.pool.eua))) * 100}%` }}></div>
              <div className="eua" style={{ flex: 1 }}></div>
            </div>
            <div className="depth-legend">
              <span><span className="swatch" style={{ background: "#1B4F8A" }}></span>EURS reserve <span className="mono">{fmtNum(state.pool.eurs, 0)}</span></span>
              <span><span className="swatch" style={{ background: "#1A4A35" }}></span>EUA reserve <span className="mono">{fmtNum(state.pool.eua, 0)}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel flush">
        <div className="panel-header">
          <span className="panel-title">Recent regulatory actions</span>
          <button className="btn sm ghost" onClick={() => setPage("audit")}>View all →</button>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((a, i) => (
              <tr key={i}>
                <td className="mono">{fmtTime(a.time)}</td>
                <td><span className={`action-chip ${a.action.toLowerCase()}`}>{a.action}</span></td>
                <td><ENSName ens={a.target} /></td>
                <td className="muted">{a.detail}</td>
                <td><TxHash hash={a.tx} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// Mint credits
// =================================================================
function RegulatorMint({ state, mint, setPage }) {
  const [recipient, setRecipient] = React.useState("company-a.eth");
  const [tokenId, setTokenId] = React.useState("003");
  const [amount, setAmount] = React.useState("1000");
  const [vintage, setVintage] = React.useState(2024);
  const [sector, setSector] = React.useState("Energy");
  const [origin, setOrigin] = React.useState("DE");
  const [methodology, setMethodology] = React.useState("EU-ETS-P4-001");
  const [confirming, setConfirming] = React.useState(false);
  const [success, setSuccess] = React.useState(null);

  const amt = parseInt(amount, 10) || 0;
  const ready = amt > 0 && recipient && tokenId && !confirming;
  const recipientCo = state.companies.find(c => c.ens === recipient);

  function doMint() {
    setConfirming(true);
    setTimeout(() => {
      const tx = mint({ recipient, tokenId, amount: amt, vintage, sector, origin, methodology });
      setConfirming(false);
      setSuccess({ tx, recipient, amount: amt, vintage, sector });
    }, 1200);
  }

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="h1">Mint carbon credits</h1>
        <span className="kicker">CarbonCredit.sol</span>
      </div>

      <div className="panel">
        <div className="col" style={{ gap: 16 }}>
          <div className="field">
            <span className="field-label">Recipient address or ENS name</span>
            <input className="input mono" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="company.eth" />
            {recipientCo && (
              <span className="field-help">
                Resolves to <span className="mono">{recipientCo.addr.slice(0, 10)}…{recipientCo.addr.slice(-4)}</span> · <Country code={recipientCo.country} /> · {recipientCo.type}
              </span>
            )}
          </div>

          <div className="kicker" style={{ marginTop: 4 }}>Credit batch details</div>
          <div className="grid-2-eq">
            <div className="field">
              <span className="field-label">Token ID (batch)</span>
              <input className="input mono" value={tokenId} onChange={e => setTokenId(e.target.value)} />
            </div>
            <div className="field">
              <span className="field-label">Amount (EUA)</span>
              <input className="input mono" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))} />
            </div>
            <div className="field">
              <span className="field-label">Vintage year</span>
              <select className="select" value={vintage} onChange={e => setVintage(parseInt(e.target.value, 10))}>
                {VINTAGES.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Sector</span>
              <select className="select" value={sector} onChange={e => setSector(e.target.value)}>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Origin country</span>
              <select className="select" value={origin} onChange={e => setOrigin(e.target.value)}>
                {Object.entries(COUNTRY_NAMES).map(([cc, name]) => (
                  <option key={cc} value={cc}>{name} ({cc})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Methodology ID</span>
              <input className="input mono" value={methodology} onChange={e => setMethodology(e.target.value)} />
            </div>
          </div>

          <div style={{ background: "var(--c-row-alt)", borderRadius: 4, padding: 16, fontSize: 13, lineHeight: 1.6 }}>
            <div className="kicker" style={{ marginBottom: 6 }}>Preview</div>
            <PlainEnglishTx>
              <ENSName ens={REGULATOR_USER.ens} /> will mint <span className="mono">{fmtNum(amt)} EUA</span>{" "}
              ({sector}, {vintage}, {origin}) to <ENSName ens={recipient} />
            </PlainEnglishTx>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Sourcify contract="CarbonCredit.sol" />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => setPage("overview")}>Cancel</button>
              <button className={`btn lg ${ready ? "regulator" : ""}`} disabled={!ready} onClick={doMint}>
                {confirming && <span className="spin"></span>}
                {confirming ? "Confirming…" : `Mint ${fmtNum(amt)} EUA →`}
              </button>
            </div>
          </div>

          {success && (
            <div style={{ marginTop: 8, padding: 16, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--c-success)", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                <span>✓</span> Minted {fmtNum(success.amount)} EUA ({success.sector}, {success.vintage}) to {success.recipient}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--c-text-secondary)" }}>
                <TxHash hash={success.tx} />
                <Sourcify contract="CarbonCredit.sol" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// KYC table
// =================================================================
function RegulatorKyc({ state, freeze, unfreeze, register }) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showRegister, setShowRegister] = React.useState(false);
  const [confirmFreeze, setConfirmFreeze] = React.useState(null);

  const rows = state.companies.filter(c => {
    if (filter !== "all" && c.status !== filter) return false;
    if (search && !(c.ens.includes(search.toLowerCase()) || c.addr.includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="container wide">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="h1">Compliance Registry</h1>
        <Sourcify contract="ComplianceRegistry.sol" />
      </div>

      <div className="panel flush">
        <div className="panel-header">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn regulator sm" onClick={() => setShowRegister(true)}>+ Register company</button>
            <select className="select" style={{ width: "auto", height: 32, fontSize: 12 }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All ({state.companies.length})</option>
              <option value="verified">Verified</option>
              <option value="frozen">Frozen</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <input className="input" style={{ width: 220, height: 32 }} placeholder="Search ENS or address…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>ENS / Address</th>
              <th>Country</th>
              <th>Type</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.ens}>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <ENSName ens={c.ens} addr={c.addr} />
                    <span className="mono muted" style={{ fontSize: 11 }}>{c.addr.slice(0, 10)}…{c.addr.slice(-4)}</span>
                  </div>
                </td>
                <td><Country code={c.country} /></td>
                <td>{c.type}</td>
                <td><Chip kind={c.status}>{c.status === "verified" ? "Verified" : c.status === "frozen" ? "Frozen" : "Pending"}</Chip></td>
                <td style={{ textAlign: "right" }}>
                  {c.status === "verified" && (
                    <button className="btn sm" onClick={() => setConfirmFreeze(c)}>Freeze</button>
                  )}
                  {c.status === "frozen" && (
                    <button className="btn sm" onClick={() => unfreeze(c.ens)}>Unfreeze</button>
                  )}
                  {c.status === "pending" && (
                    <button className="btn sm regulator" onClick={() => unfreeze(c.ens)}>Approve</button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5}><div className="empty">No companies match your filter</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showRegister && (
        <Modal onClose={() => setShowRegister(false)}>
          <RegisterCompanyForm onClose={() => setShowRegister(false)} register={register} />
        </Modal>
      )}

      {confirmFreeze && (
        <Modal onClose={() => setConfirmFreeze(null)}>
          <h2 className="h1" style={{ marginTop: 0 }}>Freeze company?</h2>
          <p style={{ fontSize: 13, color: "var(--c-text-secondary)", marginBottom: 12 }}>
            You are about to freeze:
          </p>
          <div style={{ background: "var(--c-row-alt)", borderRadius: 4, padding: 16, marginBottom: 16 }}>
            <div className="ens" style={{ fontSize: 14 }}>{confirmFreeze.ens}</div>
            <div className="mono muted" style={{ fontSize: 12 }}>{confirmFreeze.addr.slice(0, 10)}…{confirmFreeze.addr.slice(-4)}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{COUNTRY_NAMES[confirmFreeze.country]} — {confirmFreeze.type}</div>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--c-text-secondary)" }}>
            This will prevent all trading and credit transfers from this address. You can unfreeze at any time.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn full" onClick={() => setConfirmFreeze(null)}>Cancel</button>
            <button className="btn danger full" onClick={() => { freeze(confirmFreeze.ens); setConfirmFreeze(null); }}>
              Freeze {confirmFreeze.ens}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RegisterCompanyForm({ onClose, register }) {
  const [addr, setAddr] = React.useState("");
  const [country, setCountry] = React.useState("DE");
  const [type, setType] = React.useState("Emitter");
  function submit() {
    if (!addr) return;
    register({ ens: addr.endsWith(".eth") ? addr : null, addr: addr.startsWith("0x") ? addr : "0x" + Math.random().toString(16).slice(2, 42), country, type });
    onClose();
  }
  return (
    <>
      <h2 className="h1" style={{ marginTop: 0 }}>Register company</h2>
      <div className="col" style={{ gap: 14, marginTop: 16 }}>
        <div className="field">
          <span className="field-label">Address or ENS</span>
          <input className="input mono" value={addr} onChange={e => setAddr(e.target.value)} placeholder="0x… or company.eth" />
        </div>
        <div className="field">
          <span className="field-label">Country</span>
          <select className="select" value={country} onChange={e => setCountry(e.target.value)}>
            {Object.entries(COUNTRY_NAMES).map(([cc, name]) => (
              <option key={cc} value={cc}>{name} ({cc})</option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="field-label">Allowance type</span>
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            <option>Emitter</option>
            <option>Buyer</option>
            <option>Both</option>
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button className="btn full" onClick={onClose}>Cancel</button>
        <button className="btn regulator full" onClick={submit}>Register →</button>
      </div>
    </>
  );
}

// =================================================================
// Live feed + Pause
// =================================================================
function RegulatorFeed({ state, pause, unpause }) {
  const [confirmPause, setConfirmPause] = React.useState(false);
  const [pauseInput, setPauseInput] = React.useState("");
  const [confirmUnpause, setConfirmUnpause] = React.useState(false);

  return (
    <div className="container wide">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="kicker">Live</div>
          <h1 className="h1" style={{ marginTop: 4 }}>Trade feed</h1>
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          <span className="live-dot" style={{ marginRight: 12 }}>{state.paused ? "Paused" : "Live"}</span>
          {state.trades.length} trades
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
        <div className="panel flush">
          <div className="panel-header">
            <span className="panel-title">Real-time swaps</span>
            <span className="muted mono" style={{ fontSize: 12 }}>1 EUA = {fmtNum(state.pool.eurs / state.pool.eua, 3)} EURS</span>
          </div>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            <table className="tbl">
              <thead style={{ position: "sticky", top: 0 }}>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>→</th>
                  <th>To</th>
                  <th className="num">EUA</th>
                  <th className="num">EURS</th>
                  <th className="num">Price</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {state.trades.map((t, i) => (
                  <tr key={t.id} className={i === 0 && state.lastTradeIsNew ? "feed-row-new" : ""}>
                    <td className="mono">{fmtTime(t.time)}</td>
                    <td><ENSName ens={t.from} /></td>
                    <td className="muted">→</td>
                    <td><ENSName ens={t.to} /></td>
                    <td className="num">{fmtNum(t.eua)}</td>
                    <td className="num">{fmtNum(t.eurs, 0)}</td>
                    <td className="num">{fmtNum(t.price, 3)}</td>
                    <td><TxHash hash={t.tx} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col" style={{ gap: 12 }}>
          <div className="panel" style={{ borderColor: "var(--c-paused-border)", background: state.paused ? "var(--c-paused-bg)" : "var(--c-surface)" }}>
            <div className="kicker" style={{ marginBottom: 12, color: "var(--c-danger)", letterSpacing: "0.18em" }}>Emergency</div>
            {!state.paused ? (
              <>
                <button className="pause-cta" style={{ width: "100%" }} onClick={() => setConfirmPause(true)}>
                  Pause DEX
                </button>
                <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5 }}>
                  Halts all trading network-wide. Visible to all participants. Unpause at any time.
                </p>
              </>
            ) : (
              <>
                <button className="pause-cta unpause-cta" style={{ width: "100%" }} onClick={() => setConfirmUnpause(true)}>
                  Unpause DEX
                </button>
                <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0, lineHeight: 1.5, color: "var(--c-danger)" }}>
                  DEX is currently paused since <span className="mono">{state.pausedAt ? fmtTime(state.pausedAt) : "—"}</span>.
                </p>
              </>
            )}
          </div>
          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>Pool reserves</div>
            <div className="depth-bar">
              <div className="eurs" style={{ width: `${(state.pool.eurs / (state.pool.eurs + state.pool.eua * 2.5)) * 100}%` }}></div>
              <div className="eua" style={{ flex: 1 }}></div>
            </div>
            <div className="depth-legend" style={{ flexDirection: "column", gap: 6 }}>
              <span><span className="swatch" style={{ background: "#1B4F8A" }}></span>EURS <span className="mono">{fmtNum(state.pool.eurs, 0)}</span></span>
              <span><span className="swatch" style={{ background: "#1A4A35" }}></span>EUA <span className="mono">{fmtNum(state.pool.eua, 0)}</span></span>
            </div>
          </div>
          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>Today</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="spec-row"><span>Trades</span><span className="v">{state.trades.length}</span></div>
              <div className="spec-row"><span>Volume (EUA)</span><span className="v">{fmtNum(state.trades.reduce((s, t) => s + t.eua, 0))}</span></div>
              <div className="spec-row"><span>Volume (EURS)</span><span className="v">{fmtNum(state.trades.reduce((s, t) => s + t.eurs, 0), 0)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {confirmPause && (
        <Modal onClose={() => setConfirmPause(false)}>
          <h2 className="h1" style={{ marginTop: 0, color: "var(--c-danger)" }}>Pause DEX?</h2>
          <p style={{ fontSize: 13, lineHeight: 1.55 }}>
            This will <strong>immediately halt all trading.</strong> All swap transactions will revert.
            This is visible to all participants in real time.
          </p>
          <div className="field" style={{ marginTop: 16 }}>
            <span className="field-label">Type <span className="mono" style={{ color: "var(--c-danger)" }}>PAUSE</span> to confirm</span>
            <input className="input mono" value={pauseInput} onChange={e => setPauseInput(e.target.value)} autoFocus />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn full" onClick={() => { setConfirmPause(false); setPauseInput(""); }}>Cancel</button>
            <button
              className="btn danger full"
              disabled={pauseInput !== "PAUSE"}
              onClick={() => { pause(); setConfirmPause(false); setPauseInput(""); }}
            >
              Pause trading
            </button>
          </div>
        </Modal>
      )}

      {confirmUnpause && (
        <Modal onClose={() => setConfirmUnpause(false)}>
          <h2 className="h1" style={{ marginTop: 0, color: "var(--c-success)" }}>Unpause DEX?</h2>
          <p style={{ fontSize: 13, lineHeight: 1.55 }}>
            This will resume all trading network-wide. All participants will be notified instantly.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn full" onClick={() => setConfirmUnpause(false)}>Cancel</button>
            <button className="btn regulator full" onClick={() => { unpause(); setConfirmUnpause(false); }}>
              Resume trading
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =================================================================
// Audit log
// =================================================================
function RegulatorAudit({ state }) {
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(null);

  const rows = state.audit.filter(a => {
    if (filter !== "all" && a.action !== filter) return false;
    if (search && !(a.target.includes(search.toLowerCase()) || a.detail.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  const types = ["all", ...Array.from(new Set(state.audit.map(a => a.action)))];

  return (
    <div className="container wide">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 className="h1">Audit log</h1>
        <Sourcify contract="Regulator.sol" />
      </div>
      <div className="panel flush">
        <div className="panel-header">
          <div style={{ display: "flex", gap: 8 }}>
            <select className="select" style={{ width: "auto", height: 32, fontSize: 12 }} value={filter} onChange={e => setFilter(e.target.value)}>
              {types.map(t => <option key={t} value={t}>{t === "all" ? "All actions" : t}</option>)}
            </select>
            <button className="btn sm">Export CSV</button>
          </div>
          <input className="input" style={{ width: 220, height: 32 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Time (UTC)</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
              <th>Block</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={i} className="clickable" onClick={() => setSelected(a)}>
                <td className="mono">{fmtTime(a.time)}</td>
                <td><span className={`action-chip ${a.action.toLowerCase()}`}>{a.action}</span></td>
                <td>{a.target === "DEX" ? <span className="mono">DEX</span> : <ENSName ens={a.target} />}</td>
                <td className="muted">{a.detail}</td>
                <td className="mono muted">#{a.block.toLocaleString()}</td>
                <td><TxHash hash={a.tx} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6}><div className="empty">No matching events</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <div className="kicker">RegulatoryAction event</div>
          <h2 className="h1" style={{ margin: "8px 0 16px" }}>{selected.action}</h2>
          <div className="col" style={{ gap: 6, fontSize: 13 }}>
            <div className="spec-row"><span>Action</span><span className="v"><span className={`action-chip ${selected.action.toLowerCase()}`}>{selected.action}</span></span></div>
            <div className="spec-row"><span>Target</span><span className="v">{selected.target}</span></div>
            <div className="spec-row"><span>Detail</span><span className="v">{selected.detail}</span></div>
            <div className="spec-row"><span>Timestamp</span><span className="v">{fmtDate(selected.time)}</span></div>
            <div className="spec-row"><span>Block</span><span className="v">#{selected.block.toLocaleString()}</span></div>
            <div className="spec-row"><span>Tx</span><span className="v"><TxHash hash={selected.tx} /></span></div>
            <div className="spec-row"><span>Emitter</span><span className="v"><ENSName ens={selected.by} /></span></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, {
  RegulatorShell, RegulatorOverview, RegulatorMint, RegulatorKyc, RegulatorFeed, RegulatorAudit,
});
