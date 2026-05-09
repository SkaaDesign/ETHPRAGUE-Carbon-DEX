// COMPANY A PORTAL — Editorial Calm. cement-mainz.eth is the sole protagonist.
// Beat 0: awaiting allocation
// Beat 1: receives 1000 EUA — allocation receipt
// Beat 2: sells 200 EUA into pool — swap form, then settled receipt
// Beat 3: retires 200 EUA — surrender form, then certificate

function CompanyPortal({ s, onSwap, onRetire }) {
  return (
    <div className="ec">
      <div className="ec-top">
        <div className="ec-brand"><span className="m"></span> Company portal</div>
        <div className="ec-time" style={{ marginLeft: 8 }}>{s.clock}<small>UTC · WALLET CONNECTED</small></div>
        <div className="ec-pills">
          <span className="ec-pill on">Overview</span>
          <span className="ec-pill">Trade</span>
          <span className="ec-pill">Retire</span>
          <span className="ec-pill">Reports</span>
        </div>
      </div>

      <div className="ec-body">
        {/* Identity + balance */}
        <div className="co-balance-tile">
          <div className="co-id">
            <span className="av"></span>
            <div className="ens">
              cement-mainz.eth
              <small>verified emitter · cement · DE</small>
            </div>
            <span className="verified">Verified</span>
          </div>
          <div className="ec-eb">Wallet balance · vintage 2026</div>
          <div className="ec-balance" key={'bal-' + s.beat}>
            {fmt(s.coBal)}
            <span className="unit">EUA</span>
            {s.beat === 1 && <span className="delta">▲ +1,000 received</span>}
            {s.beat === 2 && <span className="delta down">▼ −200 sold</span>}
            {s.beat === 3 && <span className="delta down">▼ −200 retired</span>}
          </div>
          <div className="ec-row" style={{ borderTop: '1px solid #f0eee6', marginTop: 8, paddingTop: 14 }}>
            <span className="l">EURS balance</span><span className="v">{fmt(s.coEurs)} EURS</span>
          </div>
          <div className="ec-row">
            <span className="l">Surrender deadline</span><span className="v">30 Sept 2027</span>
          </div>
          <div className="ec-row">
            <span className="l">Network</span><span className="v">Sepolia · block 18,294,441</span>
          </div>
        </div>

        {/* Beat-driven action / receipt area */}
        {s.beat === 0 && (
          <div className="awaiting">
            Awaiting 2026 free-allocation event.
            <small>Regulator · ref 2026-FA-DE-001</small>
          </div>
        )}

        {s.beat === 1 && (
          <div className="receipt">
            <div className="head">
              <span className="ttl">Allocation receipt</span>
              <span className="ref">2026-FA-DE-001</span>
            </div>
            <div className="toast" style={{ marginBottom: 14 }}>
              <span className="tag">RECEIVED</span>
              <div>
                <strong>1,000 EUA</strong> from <span style={{ color: '#d4a035', fontFamily: 'IBM Plex Mono, monospace' }}>eu-ets-authority.eth</span>.<br/>
                Period 2026 · sector Industry · origin DE · ref 2026-FA-DE-001.
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 14px', fontSize: 12 }}>
              <span style={{ color: '#6b6860' }}>tx hash</span><a className="tx-link" href="#">0x4d1a…7e2 ↗</a>
              <span style={{ color: '#6b6860' }}>contract</span><span className="sourcify">Sourcify-verified</span>
              <span style={{ color: '#6b6860' }}>provenance</span><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>regulator → cement-mainz.eth</span>
              <span style={{ color: '#6b6860' }}>event</span><span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>CreditMinted(to, 1000, 2026, …)</span>
            </div>
            <button className="ec-cta" style={{ marginTop: 14 }} onClick={onSwap}>Open trade →</button>
          </div>
        )}

        {s.beat === 2 && (
          <div className="receipt">
            <div className="head">
              <span className="ttl">Swap settled</span>
              <span className="ref">tx 0x2c4f…81b</span>
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', marginBottom: 12 }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, letterSpacing: '-0.02em' }}>200 EUA</span>
              <span style={{ color: '#6b6860' }}>→</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 30, letterSpacing: '-0.02em', color: '#2d6e4e' }}>14,028 EURS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 14px', fontSize: 12 }}>
              <span style={{ color: '#6b6860' }}>price</span><span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>70.14 EURS / EUA</span>
              <span style={{ color: '#6b6860' }}>slippage</span><span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>0.18% · within 0.50% tol.</span>
              <span style={{ color: '#6b6860' }}>counterparty</span><span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Carbon DEX Pool</span>
              <span style={{ color: '#6b6860' }}>contract</span><span className="sourcify">Sourcify-verified</span>
            </div>
            <button className="ec-cta" style={{ marginTop: 16 }} onClick={onRetire}>Surrender for compliance →</button>
          </div>
        )}

        {s.beat === 3 && (
          <div className="cert">
            <div className="seal">EU ETS<br/>RETIRED</div>
            <div className="kicker">Permanent retirement certificate</div>
            <h2>200 EUA<br/>permanently destroyed.</h2>
            <dl>
              <dt>Holder</dt><dd>cement-mainz.eth</dd>
              <dt>Beneficiary</dt><dd>Q4-2026 emissions · cement-mainz DE</dd>
              <dt>Vintage</dt><dd>2026</dd>
              <dt>Reason URI</dt><dd>ipfs://QmYz…2026.pdf</dd>
              <dt>Tx hash</dt><dd>0x9ae1…c4f</dd>
              <dt>Block</dt><dd>18,294,441 · Sepolia</dd>
              <dt>Issued</dt><dd>09 May 2026 · 15:04 UTC</dd>
            </dl>
            <div className="qr">
              <span className="qr-box"></span>
              <div>Scannable proof for sustainability disclosure filings.<br/>
                <a className="tx-link" href="#">Download PDF ↗</a> · <a className="tx-link" href="#">Cite this URL</a>
              </div>
            </div>
          </div>
        )}

        {/* Holdings strip */}
        <div className="ec-tile" style={{ padding: '16px 22px' }}>
          <div className="ec-eb">Holdings · live</div>
          <div className="ec-row">
            <span className="l">Allowances on hand</span>
            <span className="v">{fmt(s.coBal)} EUA</span>
          </div>
          <div className="ec-row">
            <span className="l">Spot price</span>
            <span className="v">{s.price.toFixed(2)} EURS / EUA</span>
          </div>
          <div className="ec-row">
            <span className="l">Mark-to-market value</span>
            <span className="v">{fmt(Math.round(s.coBal * s.price))} EURS</span>
          </div>
          <div className="ec-row">
            <span className="l">Retired (lifetime)</span>
            <span className="v">{fmt(s.retired)} EUA</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pre-trade screen variant — beat 1 alt: show swap form before user clicks.
// Used as a separate artboard ("01b — Swap form ready") if needed.
function CompanyTradeForm({ s, onSwap }) {
  return (
    <div className="swap-form">
      <div className="ec-eb">Sell allowance</div>
      <h3>Swap EUA → EURS</h3>
      <div className="swap-leg">
        <div className="lbl">You sell</div>
        <div className="amt">{fmt(QTY_TRADE)}<small>EUA · vintage 2026</small></div>
      </div>
      <div className="swap-arrow">↓</div>
      <div className="swap-leg">
        <div className="lbl">You receive</div>
        <div className="amt" style={{ color: '#d4f158' }}>{fmt(Math.round(QTY_TRADE * PRICE))}<small>EURS</small></div>
      </div>
      <div className="swap-meta">
        <span className="l">Pool depth</span><span className="v">{fmt(s.poolEua)} EUA</span>
        <span className="l">Spot price</span><span className="v">{s.price.toFixed(2)} EURS / EUA</span>
        <span className="l">Slippage tol.</span><span className="v">0.50%</span>
        <span className="l">Counterparty</span><span className="v">Carbon DEX Pool ✓</span>
      </div>
      <button className="ec-cta" onClick={onSwap}>Confirm swap · sign in wallet</button>
    </div>
  );
}

window.CompanyPortal = CompanyPortal;
window.CompanyTradeForm = CompanyTradeForm;
