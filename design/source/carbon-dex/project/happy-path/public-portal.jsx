// PUBLIC OBSERVER — EEA Editorial. Read-only registry.
// One Company A protagonist; updates with each beat.

function PublicPortal({ s }) {
  return (
    <div className="pub">
      <div className="pub-top">
        <div className="pub-eu"><span className="pub-flag"></span> European Union · ETS Public Registry</div>
        <nav className="pub-nav">
          <a className="active" href="#">Overview</a>
          <a href="#">Trades</a>
          <a href="#">Retirements</a>
          <a href="#">Authority log</a>
        </nav>
        <span className="pub-lang">EN · 24 langs</span>
      </div>
      <div className="pub-crumbs">
        <a href="#">Climate</a><span>›</span><a href="#">Emissions Trading</a><span>›</span> Public Observer
      </div>

      <div className="pub-hero">
        <div className="pub-eyebrow">Open data · Phase IV · Vintage 2026</div>
        <h1>A shared accounting of Europe's carbon budget — open to anyone, every block.</h1>
      </div>

      <div className="pub-cap">
        <div className="pub-cap-cell">
          <div className="lbl">Issued, vintage 2026</div>
          <div className="val">{fmt(s.supply)} <small>EUA</small></div>
          <div className="delta">{s.beat >= 1 ? '▲ allocated · 09 May 2026' : 'awaiting first allocation'}</div>
        </div>
        <div className="pub-cap-cell">
          <div className="lbl">In circulation</div>
          <div className="val">{fmt(s.inCirculation)} <small>EUA</small></div>
          <div className="delta">
            {s.beat < 2 ? (s.beat < 1 ? 'no supply yet' : '1 holder · 1 issuance')
                        : (s.beat < 3 ? 'pool absorbed 200 EUA' : 'supply contracted by 200')}
          </div>
        </div>
        <div className="pub-cap-cell">
          <div className="lbl">Permanently retired</div>
          <div className="val">{fmt(s.retired)} <small>EUA</small></div>
          <div className={'delta ' + (s.retired ? '' : 'down')}>
            {s.retired ? '▲ surrendered against verified emissions' : 'first retirement expected Q4'}
          </div>
        </div>
      </div>
      <div className="pub-cap-bar">
        {s.supply > 0 && (
          <>
            <div className="seg-issued" style={{ width: ((s.coBal / Math.max(s.supply, 1)) * 100) + '%' }} />
            <div className="seg-pool" style={{ width: (((s.beat >= 2 ? QTY_TRADE : 0) / Math.max(s.supply, 1)) * 100) + '%' }} />
            <div className="seg-retired" style={{ width: ((s.retired / Math.max(s.supply, 1)) * 100) + '%' }} />
          </>
        )}
      </div>
      <div className="pub-cap-legend">
        <span><span className="sw" style={{ background: '#2d6e4e' }}></span>cement-mainz holdings</span>
        <span><span className="sw" style={{ background: '#8ab09c' }}></span>in pool</span>
        <span><span className="sw" style={{ background: '#1a2419' }}></span>retired</span>
      </div>

      <div className="pub-section">
        <h2>Live ledger <small>· every transaction, by anyone, with no login</small></h2>
        <div className="pub-list">
          {s.beat < 1 && (
            <div className="pub-empty">No transactions yet. The 2026 allocation event is queued.</div>
          )}
          {s.beat >= 3 && (
            <div className="pub-row">
              <div className="when">15:04 UTC</div>
              <div className="what">
                <strong>Retirement</strong> · <span className="ens">cement-mainz.eth</span>
                <span className="meta">beneficiary · Q4-2026 emissions · reasonURI: ipfs://QmYz…2026.pdf</span>
              </div>
              <div className="amt">−200 <small>EUA · burned</small></div>
            </div>
          )}
          {s.beat >= 2 && (
            <div className="pub-row">
              <div className="when">14:38 UTC</div>
              <div className="what">
                <strong>Trade</strong> · <span className="ens">cement-mainz.eth</span> → Carbon DEX Pool
                <span className="meta">200 EUA at 70.14 EURS/EUA · 14,028 EURS settled · slippage 0.18%</span>
              </div>
              <div className="amt">−200 <small>EUA · wallet → pool</small></div>
            </div>
          )}
          {s.beat >= 1 && (
            <div className="pub-row">
              <div className="when">14:32 UTC</div>
              <div className="what">
                <strong>Allocation</strong> · <span className="ens">eu-ets-authority.eth</span> → <span className="ens">cement-mainz.eth</span>
                <span className="meta">vintage 2026 · sector cement · origin DE · ref 2026-FA-DE-001</span>
              </div>
              <div className="amt">+1,000 <small>EUA · issued</small></div>
            </div>
          )}
        </div>
      </div>

      <div className="pub-section">
        <h2>Verified entities <small>· compliance roster (12)</small></h2>
        <div className="pub-list">
          <div className="pub-row">
            <div className="when">verified</div>
            <div className="what">
              <span className="ens">cement-mainz.eth</span>
              <span className="meta">cement · DE · holdings {fmt(s.coBal)} EUA · retired {fmt(s.retired)} EUA</span>
            </div>
            <div className="amt">{fmt(s.coBal)} <small>EUA</small></div>
          </div>
          <div className="pub-row">
            <div className="when">verified</div>
            <div className="what">
              <span className="ens">aluminium-bratislava.eth</span>
              <span className="meta">aluminium · SK · 11 other emitters in roster</span>
            </div>
            <div className="amt">820 <small>EUA</small></div>
          </div>
        </div>
      </div>

      <div className="pub-footer">
        <span className="nope">No wallet required · all reads from on-chain events</span>
        <span style={{ marginLeft: 'auto' }}>
          Contracts <a href="#">Sourcify-verified ✓</a> · <a href="#">Methodology</a> · <a href="#">CSV download</a>
        </span>
      </div>
    </div>
  );
}

window.PublicPortal = PublicPortal;
