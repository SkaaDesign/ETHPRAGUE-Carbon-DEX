// Company portal: Connect → KYC gate → Frozen → Dashboard → Trade → Receipt → Portfolio → Retire → Cert

const { CURRENT_USER, REGULATOR_USER, COUNTRY_NAMES } = window.SEED;

// =================================================================
// Connect Wallet (no-wallet state)
// =================================================================
function CompanyConnect({ onConnect }) {
  return (
    <div className="center-stage">
      <div className="center-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <span style={{ transform: "scale(1.4)", transformOrigin: "center" }}><Logo /></span>
        </div>
        <h1 className="h1" style={{ textAlign: "center", marginBottom: 4 }}>Carbon Credit Exchange</h1>
        <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 0, marginBottom: 24 }}>
          EU ETS compliance trading — verified participants only
        </p>
        <hr className="divider" />
        <button className="btn company lg full" style={{ marginTop: 20 }} onClick={onConnect}>
          Connect Wallet
        </button>
        <p className="muted" style={{ fontSize: 12, marginTop: 12, marginBottom: 0, textAlign: "center" }}>
          Only addresses registered in the EU ETS Compliance Registry may trade.
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, gap: 8, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 11 }}>ComplianceRegistry.sol</span>
          <Sourcify contract="ComplianceRegistry.sol" />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// KYC Gate (connected, not verified)
// =================================================================
function CompanyKycGate({ onViewPublic }) {
  return (
    <div className="center-stage">
      <div className="center-card">
        <Chip kind="pending">Pending</Chip>
        <h2 className="h1" style={{ margin: "16px 0 6px" }}>Verification pending</h2>
        <div className="ens" style={{ fontSize: 14 }}>{CURRENT_USER.ens}</div>
        <div className="mono muted" style={{ fontSize: 12 }}>{CURRENT_USER.addr}</div>
        <p style={{ fontSize: 13, color: "var(--c-text-secondary)", lineHeight: 1.55, margin: "20px 0" }}>
          Your address has not been registered in the EU ETS Compliance Registry.
          Contact the EU ETS Authority to complete verification.
        </p>
        <div style={{ borderTop: "1px solid var(--c-border-subtle)", paddingTop: 16 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Registry contract</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="mono" style={{ fontSize: 12 }}>0x5f3a...8b12</span>
            <Sourcify contract="ComplianceRegistry.sol" />
          </div>
        </div>
        <button className="btn ghost full" style={{ marginTop: 20 }} onClick={onViewPublic}>
          View public market →
        </button>
      </div>
    </div>
  );
}

// =================================================================
// Frozen state
// =================================================================
function CompanyFrozen() {
  return (
    <div className="center-stage">
      <div className="center-card">
        <Chip kind="frozen">Frozen</Chip>
        <h2 className="h1" style={{ margin: "16px 0 6px" }}>Account frozen</h2>
        <div className="ens" style={{ fontSize: 14 }}>{CURRENT_USER.ens}</div>
        <div className="mono muted" style={{ fontSize: 12 }}>{CURRENT_USER.addr}</div>
        <div className="warning-box danger" style={{ marginTop: 20 }}>
          <span>⚠</span>
          <div>
            <strong>Trading suspended by EU ETS Authority.</strong><br/>
            All swap and retirement actions are disabled until your account is unfrozen.
            Contact <span className="ens">eu-ets-authority.eth</span> for resolution.
          </div>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: "var(--c-text-secondary)" }}>
          Reason on record: <em>Pending review</em>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Dashboard
// =================================================================
function CompanyDashboard({ state, go }) {
  const { balances, portfolio, trades, kyc, paused } = state;
  const myEns = CURRENT_USER.ens;
  const recent = trades.slice(0, 5);
  const totalRetired = state.retirements.filter(r => r.by === myEns).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="kicker">Company portal</div>
          <h1 className="h1" style={{ marginTop: 4 }}>Welcome, {CURRENT_USER.ens}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip kind={kyc}>{kyc === "verified" ? "Verified" : kyc === "frozen" ? "Frozen" : "Pending"}</Chip>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="metric">
          <span className="label">EUA Balance</span>
          <span className="value">{fmtNum(balances.eua)}<span className="unit">EUA</span></span>
        </div>
        <div className="metric">
          <span className="label">EURS Balance</span>
          <span className="value">{fmtNum(balances.eurs, 2)}<span className="unit">EURS</span></span>
        </div>
        <div className="metric">
          <span className="label">Total Retired</span>
          <span className="value">{fmtNum(totalRetired)}<span className="unit">EUA</span></span>
        </div>
        <div className="metric">
          <span className="label">KYC Status</span>
          <span style={{ marginTop: 4 }}>
            <Chip kind={kyc}>{kyc === "verified" ? "Verified" : kyc === "frozen" ? "Frozen" : "Pending"}</Chip>
          </span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="panel" style={{ padding: 0 }}>
          <div className="panel-header">
            <span className="panel-title">Quick actions</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn company full lg"
              disabled={paused || kyc !== "verified"}
              onClick={() => go("trade")}
            >
              Trade EURS ↔ EUA →
            </button>
            <button
              className="btn full"
              disabled={paused || kyc !== "verified"}
              onClick={() => go("retire")}
            >
              Retire credits →
            </button>
            <button className="btn ghost full" onClick={() => go("portfolio")}>
              View portfolio →
            </button>
            {paused && (
              <div className="warning-box danger" style={{ marginTop: 8 }}>
                <span>⬤</span>
                <div>Trading is paused by the EU ETS Authority. Actions will resume once the DEX is unpaused.</div>
              </div>
            )}
          </div>
        </div>
        <div className="panel flush">
          <div className="panel-header">
            <span className="panel-title">Credit batches</span>
            <button className="btn sm ghost" onClick={() => go("portfolio")}>View all →</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Vintage</th>
                <th>Sector</th>
                <th>Origin</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.length === 0 && (
                <tr><td colSpan={5}><div className="empty">No credits in portfolio</div></td></tr>
              )}
              {portfolio.map(b => (
                <tr key={b.tokenId}>
                  <td className="mono">#{b.tokenId}</td>
                  <td>{b.vintage}</td>
                  <td>{b.sector}</td>
                  <td><Country code={b.origin} /></td>
                  <td className="num">{fmtNum(b.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel flush">
        <div className="panel-header">
          <span className="panel-title">Recent market trades</span>
          <span className="live-dot">Live</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Time</th>
              <th>From</th>
              <th>To</th>
              <th className="num">EUA</th>
              <th className="num">EURS/EUA</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(t => (
              <tr key={t.id}>
                <td className="mono">{fmtTime(t.time)}</td>
                <td><ENSName ens={t.from} /></td>
                <td><ENSName ens={t.to} /></td>
                <td className="num">{fmtNum(t.eua)}</td>
                <td className="num">{fmtNum(t.price, 3)}</td>
                <td><TxHash hash={t.tx} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================================================================
// Trade / Swap
// =================================================================
function CompanyTrade({ state, swap, go, lastSwap }) {
  const { balances, pool, paused, kyc } = state;
  const [direction, setDirection] = React.useState("eursToEua"); // or "euaToEurs"
  const [amountIn, setAmountIn] = React.useState("");
  const [advanced, setAdvanced] = React.useState(false);
  const [slippage, setSlippage] = React.useState(1); // %
  const [confirming, setConfirming] = React.useState(false);

  const fromTok = direction === "eursToEua" ? "EURS" : "EUA";
  const toTok = direction === "eursToEua" ? "EUA" : "EURS";
  const fromBal = direction === "eursToEua" ? balances.eurs : balances.eua;

  // Constant product with 0.3% fee
  function quote(amtIn) {
    if (!amtIn || amtIn <= 0) return { out: 0, priceImpact: 0, newPrice: pool.eurs / pool.eua };
    const reserveIn = direction === "eursToEua" ? pool.eurs : pool.eua;
    const reserveOut = direction === "eursToEua" ? pool.eua : pool.eurs;
    const amtInWithFee = amtIn * 0.997;
    const out = (amtInWithFee * reserveOut) / (reserveIn + amtInWithFee);
    const newReserveIn = reserveIn + amtIn;
    const newReserveOut = reserveOut - out;
    const oldPrice = direction === "eursToEua" ? reserveIn / reserveOut : reserveOut / reserveIn;
    const newPrice = direction === "eursToEua" ? newReserveIn / newReserveOut : newReserveOut / newReserveIn;
    const priceImpact = Math.abs(newPrice - oldPrice) / oldPrice * 100;
    return { out, priceImpact, newPrice };
  }

  const amt = parseFloat(amountIn) || 0;
  const q = quote(amt);
  const minReceived = q.out * (1 - slippage / 100);

  const insufficient = amt > fromBal;
  const ready = amt > 0 && !insufficient && !paused && kyc === "verified" && !confirming;

  let label;
  if (paused) label = "DEX paused";
  else if (kyc !== "verified") label = kyc === "frozen" ? "Account frozen" : "KYC required";
  else if (!amt) label = "Enter an amount";
  else if (insufficient) label = `Insufficient ${fromTok} balance`;
  else if (confirming) label = "Confirming…";
  else label = `Swap ${fromTok} for ${toTok}`;

  function flip() {
    setDirection(d => d === "eursToEua" ? "euaToEurs" : "eursToEua");
    setAmountIn("");
  }

  function onSwap() {
    if (!ready) return;
    setConfirming(true);
    setTimeout(() => {
      swap({ direction, amtIn: amt, amtOut: q.out, price: q.newPrice });
      setConfirming(false);
      go("trade-receipt");
    }, 1500);
  }

  // Receipt screen
  if (lastSwap && go.current === "trade-receipt") return null;

  return (
    <div className="center-stage">
      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 16 }}>
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("dashboard")}>← Dashboard</button>
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 className="h1">Trade</h2>
            <span className="kicker">CarbonDEX.sol</span>
          </div>

          <div className="swap-row">
            <div className="top">
              <span>You pay</span>
              <span className="muted">Balance: <span className="mono">{fmtNum(fromBal, fromTok === "EURS" ? 2 : 0)} {fromTok}</span></span>
            </div>
            <div className="body">
              <TokenPill symbol={fromTok} />
              <input
                className="input amount"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                style={{ flex: 1 }}
              />
            </div>
            <div className="bottom">
              <button className="btn ghost sm" onClick={() => setAmountIn(String(fromBal))}>Max</button>
              <span className="muted mono">≈ {fromTok === "EURS" ? "€" : ""}{fmtNum(amt, 2)}</span>
            </div>
          </div>

          <div className="swap-flip">
            <button onClick={flip} aria-label="Flip">⇅</button>
          </div>

          <div className="swap-row">
            <div className="top">
              <span>You receive</span>
              <span className="muted mono">1 EUA = {fmtNum(pool.eurs / pool.eua, 3)} EURS</span>
            </div>
            <div className="body">
              <TokenPill symbol={toTok} />
              <input
                className="input amount"
                value={q.out ? fmtNum(q.out, toTok === "EURS" ? 2 : 0) : ""}
                readOnly
                placeholder="0"
                style={{ flex: 1, color: "var(--c-text-mono)" }}
              />
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: "var(--c-text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Price impact</span>
              <span className="mono" style={{
                color: q.priceImpact > 3 ? "var(--c-danger)" :
                       q.priceImpact > 1 ? "var(--c-warning)" :
                       "var(--c-text-primary)"
              }}>
                {q.priceImpact > 0 ? `${fmtNum(q.priceImpact, 2)}%` : "—"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Min received ({slippage}% slippage)</span>
              <span className="mono">{q.out ? fmtNum(minReceived, toTok === "EURS" ? 2 : 0) + " " + toTok : "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Fee (0.3%)</span>
              <span className="mono">{amt ? fmtNum(amt * 0.003, fromTok === "EURS" ? 2 : 0) + " " + fromTok : "—"}</span>
            </div>
            <button className="btn ghost sm" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => setAdvanced(a => !a)}>
              {advanced ? "Hide" : "Show"} advanced
            </button>
            {advanced && (
              <div className="field" style={{ marginTop: 4 }}>
                <span className="field-label">Slippage tolerance</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0.5, 1, 2, 5].map(s => (
                    <button
                      key={s}
                      className={`btn sm ${slippage === s ? "primary" : ""}`}
                      onClick={() => setSlippage(s)}
                    >{s}%</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {q.priceImpact > 3 && (
            <div className="warning-box danger" style={{ marginTop: 12 }}>
              <span>⚠</span>
              <div>High price impact ({fmtNum(q.priceImpact, 2)}%). You may receive significantly less than expected.</div>
            </div>
          )}

          <button
            className={`btn lg full ${ready ? "company" : ""}`}
            disabled={!ready}
            style={{ marginTop: 16 }}
            onClick={onSwap}
          >
            {confirming && <span className="spin"></span>}
            {label}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--c-text-secondary)" }}>
          <span>CarbonDEX.sol</span>
          <Sourcify contract="CarbonDEX.sol" />
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Trade Receipt
// =================================================================
function CompanyTradeReceipt({ lastSwap, go }) {
  if (!lastSwap) {
    return (
      <div className="center-stage">
        <div className="center-card">
          <p className="muted">No recent swap.</p>
          <button className="btn" onClick={() => go("trade")}>Make a trade →</button>
        </div>
      </div>
    );
  }
  const { direction, amtIn, amtOut, price, tx, block, time } = lastSwap;
  const fromTok = direction === "eursToEua" ? "EURS" : "EUA";
  const toTok = direction === "eursToEua" ? "EUA" : "EURS";
  return (
    <div className="center-stage">
      <div className="center-card">
        <div className="receipt-tick">✓</div>
        <h2 className="h1" style={{ margin: 0 }}>Swap confirmed</h2>
        <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.55 }}>
          <PlainEnglishTx>
            <ENSName ens={CURRENT_USER.ens} /> swapped <span className="mono">{fmtNum(amtIn, fromTok === "EURS" ? 2 : 0)} {fromTok}</span> for{" "}
            <span className="mono">{fmtNum(amtOut, toTok === "EURS" ? 2 : 0)} {toTok}</span> at{" "}
            <span className="mono">{fmtNum(price, 3)} EURS/EUA</span>
          </PlainEnglishTx>
        </div>
        <div style={{ marginTop: 20, padding: 16, background: "var(--c-row-alt)", borderRadius: 4, display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Tx</span><TxHash hash={tx} label="" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Block</span><span className="mono">#{block.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Timestamp</span><span className="mono">{fmtDate(time)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 20 }}>
          <span className="muted" style={{ fontSize: 12 }}>CarbonDEX.sol</span>
          <Sourcify contract="CarbonDEX.sol" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn full" onClick={() => go("retire")}>Retire these credits →</button>
          <button className="btn full" onClick={() => go("trade")}>Trade again</button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Portfolio
// =================================================================
function CompanyPortfolio({ state, go }) {
  const { portfolio, balances, retirements, trades } = state;
  const myEns = CURRENT_USER.ens;
  const myTrades = trades.filter(t => t.from === myEns || t.to === myEns).slice(0, 8);
  const myRetirements = retirements.filter(r => r.by === myEns);

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button className="btn ghost sm" onClick={() => go("dashboard")}>← Dashboard</button>
        <h1 className="h1">Portfolio</h1>
        <button className="btn company sm" onClick={() => go("trade")} disabled={state.paused || state.kyc !== "verified"}>Trade →</button>
      </div>

      <div className="col" style={{ gap: 24 }}>
        <div className="panel flush">
          <div className="panel-header">
            <span className="panel-title">Holdings</span>
            <span className="muted" style={{ fontSize: 12 }}>{portfolio.length} batches · {fmtNum(portfolio.reduce((s, b) => s + b.balance, 0))} EUA</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Vintage</th>
                <th>Sector</th>
                <th>Origin</th>
                <th className="num">Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map(b => (
                <tr key={b.tokenId}>
                  <td className="mono">#{b.tokenId}</td>
                  <td>{b.vintage}</td>
                  <td>{b.sector}</td>
                  <td><Country code={b.origin} /></td>
                  <td className="num">{fmtNum(b.balance)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost sm company" onClick={() => go("retire", b.tokenId)} disabled={state.paused || state.kyc !== "verified"}>Retire</button>
                  </td>
                </tr>
              ))}
              {portfolio.length === 0 && (
                <tr><td colSpan={6}><div className="empty">No batches in portfolio</div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid-2-eq">
          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>EURS Balance</div>
            <div className="mono" style={{ fontSize: 28 }}>{fmtNum(balances.eurs, 2)} <span className="muted" style={{ fontSize: 14 }}>EURS</span></div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Stablecoin used to settle EUA trades on-chain.</div>
          </div>
          <div className="panel">
            <div className="kicker" style={{ marginBottom: 8 }}>Retirements (lifetime)</div>
            <div className="mono" style={{ fontSize: 28 }}>{fmtNum(myRetirements.reduce((s, r) => s + r.amount, 0))} <span className="muted" style={{ fontSize: 14 }}>EUA</span></div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{myRetirements.length} retirement event{myRetirements.length === 1 ? "" : "s"} on-chain.</div>
          </div>
        </div>

        <div className="panel flush">
          <div className="panel-header">
            <span className="panel-title">Trade history</span>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th className="num">Amount</th>
                <th>Counterparty</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {myTrades.length === 0 && (
                <tr><td colSpan={5}><div className="empty">No trade history yet</div></td></tr>
              )}
              {myTrades.map(t => {
                const youSent = t.from === myEns;
                return (
                  <tr key={t.id}>
                    <td className="mono">{fmtTime(t.time)}</td>
                    <td>{youSent ? "Sold EUA" : "Bought EUA"}</td>
                    <td className="num" style={{ color: youSent ? "var(--c-danger)" : "var(--c-success)" }}>
                      {youSent ? "−" : "+"}{fmtNum(t.eua)} EUA
                    </td>
                    <td><ENSName ens={youSent ? t.to : t.from} /></td>
                    <td><TxHash hash={t.tx} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel flush">
          <div className="panel-header">
            <span className="panel-title">Retirements</span>
          </div>
          {myRetirements.length === 0 ? (
            <div style={{ padding: 16 }}>
              <div className="empty">No retirements yet — your first retirement will appear here</div>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th className="num">Amount</th>
                  <th>Sector</th>
                  <th>Vintage</th>
                  <th>Beneficiary</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {myRetirements.map(r => (
                  <tr key={r.id} className="clickable" onClick={() => go("retire-cert", r.id)}>
                    <td className="mono">{fmtTime(r.time)}</td>
                    <td className="num">{fmtNum(r.amount)} EUA</td>
                    <td>{r.sector}</td>
                    <td>{r.vintage}</td>
                    <td><ENSName ens={r.beneficiary} /></td>
                    <td><TxHash hash={r.tx} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Retire credits
// =================================================================
function CompanyRetire({ state, retire, go, preselect }) {
  const { portfolio, paused, kyc } = state;
  const [batchId, setBatchId] = React.useState(preselect || (portfolio[0] && portfolio[0].tokenId) || "");
  const [amount, setAmount] = React.useState("");
  const [beneficiary, setBeneficiary] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const batch = portfolio.find(b => b.tokenId === batchId);
  const amt = parseInt(amount, 10) || 0;
  const tooMuch = batch && amt > batch.balance;
  const ready = batch && amt > 0 && !tooMuch && !paused && kyc === "verified";

  function doConfirm() {
    setConfirming(true);
    setTimeout(() => {
      const id = retire({
        tokenId: batchId,
        amount: amt,
        beneficiary: beneficiary || CURRENT_USER.ens,
        reason: reason || "",
      });
      setConfirming(false);
      setShowConfirm(false);
      go("retire-cert", id);
    }, 1500);
  }

  return (
    <div className="center-stage">
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => go("dashboard")}>← Dashboard</button>
        <div className="panel">
          <h2 className="h1" style={{ marginTop: 0, marginBottom: 4 }}>Retire carbon credits</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 0, marginBottom: 24 }}>
            This action is permanent and cannot be undone.
          </p>

          <div className="col" style={{ gap: 16 }}>
            <div className="field">
              <span className="field-label">Select batch</span>
              <select className="select" value={batchId} onChange={e => setBatchId(e.target.value)}>
                {portfolio.map(b => (
                  <option key={b.tokenId} value={b.tokenId}>
                    #{b.tokenId} — {b.sector} {b.vintage} — {fmtNum(b.balance)} EUA available
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="field-label">Amount to retire</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input mono"
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="0"
                  style={{ flex: 1 }}
                />
                <span style={{ display: "inline-flex", alignItems: "center", padding: "0 12px", border: "1px solid var(--c-border)", borderRadius: 4, fontSize: 13, color: "var(--c-text-secondary)" }}>EUA</span>
                {batch && (
                  <button className="btn sm" onClick={() => setAmount(String(batch.balance))}>Max</button>
                )}
              </div>
              {batch && (
                <span className="field-help">Available: <span className="mono">{fmtNum(batch.balance)} EUA</span></span>
              )}
              {tooMuch && (
                <span className="field-help" style={{ color: "var(--c-danger)" }}>Exceeds available balance.</span>
              )}
            </div>
            <div className="field">
              <span className="field-label">Beneficiary <span className="muted">(optional)</span></span>
              <input
                className="input mono"
                value={beneficiary}
                onChange={e => setBeneficiary(e.target.value)}
                placeholder="company-b.eth or 0x address"
              />
              <span className="field-help">Defaults to your address.</span>
            </div>
            <div className="field">
              <span className="field-label">Reason / evidence URI <span className="muted">(optional)</span></span>
              <input
                className="input mono"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="ipfs://... or https://..."
              />
              <span className="field-help">Links your sustainability report to this offset.</span>
            </div>
          </div>

          {amt > 0 && batch && (
            <div className="warning-box" style={{ marginTop: 20 }}>
              <span>⚠</span>
              <div>
                Retiring <span className="mono">{fmtNum(amt)} EUA</span> will <strong>permanently burn</strong> these credits. This cannot be reversed.
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn full" onClick={() => go("dashboard")}>Cancel</button>
            <button
              className={`btn full ${ready ? "company" : ""}`}
              disabled={!ready}
              onClick={() => setShowConfirm(true)}
            >
              Retire {amt > 0 ? fmtNum(amt) + " EUA" : "credits"} →
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Sourcify contract="Retirement.sol" />
          </div>
        </div>
      </div>

      {showConfirm && batch && (
        <Modal onClose={() => !confirming && setShowConfirm(false)}>
          <h2 className="h1" style={{ marginTop: 0 }}>Confirm retirement</h2>
          <p style={{ fontSize: 13, color: "var(--c-text-secondary)", marginBottom: 16 }}>
            You are about to permanently burn:
          </p>
          <div style={{ background: "var(--c-row-alt)", borderRadius: 4, padding: 16, marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 22 }}>{fmtNum(amt)} EUA</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {batch.sector} sector · vintage {batch.vintage} · origin {batch.origin}
            </div>
          </div>
          <div className="col" style={{ gap: 8, fontSize: 13, marginBottom: 20 }}>
            <div className="spec-row"><span>Beneficiary</span><span className="v"><ENSName ens={beneficiary || CURRENT_USER.ens} /></span></div>
            <div className="spec-row"><span>Reason URI</span><span className="v">{reason || "—"}</span></div>
          </div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            This will emit a permanent on-chain retirement event.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn full" onClick={() => setShowConfirm(false)} disabled={confirming}>Cancel</button>
            <button className="btn company full" onClick={doConfirm} disabled={confirming}>
              {confirming && <span className="spin"></span>}
              {confirming ? "Confirming…" : "Confirm & sign wallet"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =================================================================
// Retirement Certificate
// =================================================================
function CompanyRetireCert({ state, certId, go }) {
  const r = state.retirements.find(r => r.id === certId) || state.retirements[state.retirements.length - 1];
  if (!r) {
    return (
      <div className="center-stage">
        <div className="center-card">
          <p className="muted">No retirement certificate to display.</p>
          <button className="btn" onClick={() => go("dashboard")}>← Dashboard</button>
        </div>
      </div>
    );
  }
  return (
    <div className="center-stage" style={{ padding: 32 }}>
      <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 640 }}>
          <button className="btn ghost sm" onClick={() => go("dashboard")}>← Dashboard</button>
          <span className="kicker">Certificate of retirement</span>
        </div>
        <div className="cert">
          <div className="stamp">
            <span>Retired</span>
            <span className="big">{fmtNum(r.amount)}</span>
            <span>EUA</span>
          </div>
          <div className="cert-head">
            <div className="cert-eyebrow">EU Emissions Trading System</div>
            <div className="cert-title">Certificate of Carbon Credit Retirement</div>
          </div>
          <div className="cert-amount">{fmtNum(r.amount)} EUA</div>
          <div className="cert-amount-sub">permanently burned · vintage {r.vintage}</div>
          <dl className="cert-grid">
            <dt>Sector</dt><dd>{r.sector}</dd>
            <dt>Vintage</dt><dd>{r.vintage}</dd>
            <dt>Origin</dt><dd>{r.origin} — {COUNTRY_NAMES[r.origin] || ""}</dd>
            <dt>Methodology</dt><dd>EU ETS Phase IV</dd>
            <dt>Retired by</dt><dd>{r.by}</dd>
            <dt>Beneficiary</dt><dd>{r.beneficiary}</dd>
            <dt>Reason URI</dt><dd>{r.reason || "—"}</dd>
            <dt>Timestamp</dt><dd>{fmtDate(r.time)}</dd>
            <dt>Block</dt><dd>#{r.block.toLocaleString()}</dd>
            <dt>Tx hash</dt><dd>{r.tx.slice(0, 18)}…</dd>
          </dl>
          <div className="cert-foot">
            <span>Retirement.sol</span>
            <Sourcify contract="Retirement.sol" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">Download as PDF</button>
          <button className="btn ghost">Share on-chain link</button>
          <button className="btn ghost" onClick={() => go("dashboard")}>Done</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CompanyConnect, CompanyKycGate, CompanyFrozen, CompanyDashboard,
  CompanyTrade, CompanyTradeReceipt, CompanyPortfolio, CompanyRetire, CompanyRetireCert,
});
