// App shell — beat controller, narration, three-up portals.

const { useState, useEffect } = React;

function App() {
  const [beat, setBeat] = useState(0);
  // Auto-switch the Company laptop role to match the beat's hero
  const [role, setRole] = useState('A'); // beat 1 → A, beat 2/3 → B
  const [autoRole, setAutoRole] = useState(true);

  // When beat changes, auto-flip role
  useEffect(() => {
    if (!autoRole) return;
    if (beat <= 1) setRole('A');
    else setRole('B');
  }, [beat, autoRole]);

  const s = stateAt(beat);
  const narr = NARRATION[beat];

  function advance(n) { setBeat(Math.max(0, Math.min(3, n))); }

  return (
    <div className="stage">
      <div className="stage-head">
        <div>
          <div className="stage-title"><small>Carbon DEX · Live demo · 09 May 2026</small>Happy path — three portals, three beats.</div>
        </div>
        <div className="stage-deck">
          One transaction per beat. Issuance event fires; Company B swaps EURS for EUA on the on-chain DEX; Company B surrenders against verified emissions and the cap actually contracts. Public read-only, no wallet required.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="beat-bar">
          <button className={beat === 0 ? 'on' : ''} onClick={() => advance(0)}>
            <span className="num">00</span> Pre-demo
          </button>
          <button className={beat === 1 ? 'on' : ''} onClick={() => advance(1)}>
            <span className="num">01</span> Issuance
          </button>
          <button className={beat === 2 ? 'on' : ''} onClick={() => advance(2)}>
            <span className="num">02</span> Trade
          </button>
          <button className={beat === 3 ? 'on' : ''} onClick={() => advance(3)}>
            <span className="num">03</span> Retire
          </button>
        </div>
        <button className="beat-bar reset" onClick={() => advance(0)}>↺ Reset</button>
        {beat < 3 && (
          <button className="beat-bar reset" onClick={() => advance(beat + 1)} style={{ color: '#d4a035' }}>
            Advance to beat {beat + 1} →
          </button>
        )}
      </div>

      <div className="stage-narration">
        <b>{narr.tag}</b>{narr.text}
      </div>

      <div className="portals">
        <section className="portal" data-screen-label="Public observer">
          <div className="portal-tag">
            <span className="dot"></span>
            <span className="who">Public observer</span>
            <span className="role">read-only · no wallet</span>
          </div>
          <PublicPortal s={s} />
        </section>

        <section className="portal" data-screen-label="Regulator">
          <div className="portal-tag">
            <span className="dot" style={{ background: '#2d6e4e' }}></span>
            <span className="who">eu-ets-authority.eth</span>
            <span className="role">supervisory</span>
          </div>
          <RegulatorPortal
            s={s}
            onIssue={() => advance(1)}
          />
        </section>

        <section className="portal" data-screen-label="Company">
          <div className="portal-tag">
            <span className="dot" style={{ background: '#d4a035' }}></span>
            <span className="who">{role === 'A' ? 'cement-mainz.eth' : 'aluminium-bratislava.eth'}</span>
            <span className="role">{role === 'A' ? 'verified · cement · DE' : 'verified · aluminium · SK'}</span>
          </div>
          <CompanyPortal
            s={s}
            role={role}
            setRole={(r) => { setAutoRole(false); setRole(r); }}
            onSwap={() => advance(2)}
            onRetire={() => advance(3)}
          />
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
