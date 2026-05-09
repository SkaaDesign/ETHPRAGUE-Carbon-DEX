// REGULATOR — Editorial Calm. Audit log + scheduled events + KPIs + roster.

function RegulatorPortal({ s, onIssue }) {
  return (
    <div className="ec">
      <div className="ec-top">
        <div className="ec-brand"><span className="m"></span> Regulator console</div>
        <div className="ec-time">{s.clock}<small>UTC · 09 MAY 2026</small></div>
        <div className="ec-pills">
          <span className="ec-pill on">Audit</span>
          <span className="ec-pill">Scheduled</span>
          <span className="ec-pill">Roster</span>
          <span className="ec-pill">Powers</span>
        </div>
      </div>

      <div className="ec-body">
        <div className="reg-counters">
          <div className="reg-counter">
            <div className="lbl">Issued · vintage 2026</div>
            <div className="val">{fmt(s.supply)}<small>EUA</small></div>
          </div>
          <div className="reg-counter">
            <div className="lbl">In circulation</div>
            <div className="val">{fmt(s.inCirculation)}<small>EUA</small></div>
          </div>
          <div className="reg-counter">
            <div className="lbl">Retired</div>
            <div className="val">{fmt(s.retired)}<small>EUA</small></div>
          </div>
          <div className="reg-counter">
            <div className="lbl">Pool depth</div>
            <div className="val">{fmt(s.poolEua)}<small>EUA</small></div>
          </div>
        </div>

        <div className="sched">
          <h3>Scheduled allocation events</h3>
          <p>Pre-computed: sector benchmark × historical activity. Issuance is a process, not a button-click.</p>
          <div className={'sched-row ' + (s.beat === 0 ? 'live' : 'executed')}>
            <span className="ref">2026-FA-DE-001</span>
            <span className="who">
              <strong>cement-mainz.eth</strong>
              <span className="meta">free allocation · cement · DE · vintage 2026</span>
            </span>
            <span className="qty">1,000<small>EUA</small></span>
            {s.beat === 0
              ? <button className="ec-cta warn" onClick={onIssue}>Execute →</button>
              : <span className="status EXECUTED">Executed</span>}
          </div>
          <div className="sched-row">
            <span className="ref">2026-FA-SK-014</span>
            <span className="who">
              <strong>aluminium-bratislava.eth</strong>
              <span className="meta">free allocation · aluminium · SK · vintage 2026</span>
            </span>
            <span className="qty">820<small>EUA</small></span>
            <span className="status CONFIRMED">Confirmed</span>
          </div>
          <div className="sched-row">
            <span className="ref">2026-AU-Q3-EEX</span>
            <span className="who">
              <strong>EEX auction settlement</strong>
              <span className="meta">post-auction custodian wrap · Q3 2026</span>
            </span>
            <span className="qty">2,400<small>EUA</small></span>
            <span className="status SCHEDULED">Scheduled</span>
          </div>
        </div>

        <div className="audit-log">
          <h3>Audit log <small>· immutable · newest first</small></h3>
          <div className="audit-list">
            {s.audit.length === 0 && (
              <div style={{ padding: '24px', color: '#8a8780', fontSize: 12, fontStyle: 'italic' }}>
                Empty. The audit log writes itself when events fire.
              </div>
            )}
            {s.audit.map((a, i) => (
              <div className={'audit-row ' + (i === 0 ? 'fresh' : '')} key={a.id}>
                <span className="ts">{a.ts}</span>
                <span className={'kind ' + a.kind}>{a.kind}</span>
                <span className="body">{a.body}</span>
                <span className="hash">{a.hash}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="roster">
          <h3>Compliance roster</h3>
          <div className="roster-row">
            <span className="name">cement-mainz.eth <small>cement · DE</small></span>
            <span className="bal">{fmt(s.coBal)} EUA</span>
            <span className="status">{s.beat >= 3 ? '✓ Surrendered Q4' : '✓ Verified'}</span>
          </div>
          <div className="roster-row">
            <span className="name">aluminium-bratislava.eth <small>aluminium · SK</small></span>
            <span className="bal">820 EUA</span>
            <span className="status">✓ Verified</span>
          </div>
          <div className="roster-row">
            <span className="name">Carbon DEX Pool <small>AMM · EURS ⇄ EUA</small></span>
            <span className="bal">{fmt(s.poolEua)} EUA</span>
            <span className="status" style={{ color: '#6b6860' }}>liquidity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.RegulatorPortal = RegulatorPortal;
