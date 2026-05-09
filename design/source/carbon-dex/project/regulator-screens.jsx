// Regulator screens — pannable canvas with 6 directions × surfaces
// Surfaces: Live trade feed + PAUSE button (centerpiece) · PAUSE confirmation modal
// Directions: A Nordic · B SAP · C Bloomberg · D Editorial · E gov.uk green · F War room

const TRADES = [
  { t:'14:32:07', from:'company-a.eth', to:'company-b.eth', amt:500, p:2.50, tx:'0x3f7a…b291' },
  { t:'14:31:42', from:'company-d.eth', to:'company-b.eth', amt:1200, p:2.49, tx:'0x8e21…f00c' },
  { t:'14:30:18', from:'company-b.eth', to:'company-a.eth', amt:200, p:2.51, tx:'0x12bc…44a1' },
  { t:'14:28:55', from:'company-e.eth', to:'company-c.eth', amt:850, p:2.50, tx:'0x9a17…0bd2' },
  { t:'14:27:11', from:'company-a.eth', to:'company-d.eth', amt:1500, p:2.48, tx:'0xc5e2…ff09' },
  { t:'14:25:33', from:'company-b.eth', to:'company-e.eth', amt:300, p:2.52, tx:'0x4d18…a273' },
  { t:'14:23:08', from:'company-c.eth', to:'company-a.eth', amt:680, p:2.50, tx:'0xb812…6611' },
  { t:'14:21:47', from:'company-d.eth', to:'company-c.eth', amt:420, p:2.49, tx:'0x77f3…ee45' },
  { t:'14:20:02', from:'company-a.eth', to:'company-e.eth', amt:1000, p:2.50, tx:'0x21a4…1190' },
];

// =============== LIVE FEED + PAUSE — 6 directions ===============

function FeedA() {
  return (
    <div className="rs-frame r-a">
      <div className="topbar">
        <span className="badge"><span className="d"/>Regulator</span>
        <h1>Carbon DEX · oversight</h1>
        <div className="right">
          <span className="ens">eu-ets-authority.eth</span>
          <span style={{color:'#6b6860'}}>·</span>
          <span className="net">Base Sepolia</span>
        </div>
      </div>
      <div className="body">
        <div className="nav">
          <div className="ti">Operations</div>
          <div className="it">Overview</div>
          <div className="it">Mint credits</div>
          <div className="it">Compliance registry</div>
          <div className="it on">Live trade feed</div>
          <div className="it">Audit log</div>
          <div className="ti" style={{paddingTop:18}}>Authority</div>
          <div className="it">Permissions</div>
          <div className="it">Settings</div>
        </div>
        <div className="main">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
            <div>
              <h2>Live trade feed</h2>
              <div className="sub" style={{display:'flex',gap:10,alignItems:'center'}}>
                <span className="live-dot"/> 47 trades today · 12,420 EUA volume · spot 2.50 EURS/EUA
              </div>
            </div>
            <button style={{background:'#b91c1c',color:'#fff',padding:'14px 22px',border:0,borderRadius:4,fontFamily:'IBM Plex Sans',fontSize:13,fontWeight:600,letterSpacing:'0.12em',cursor:'pointer',boxShadow:'0 8px 22px rgba(185,28,28,0.25)'}}>
              ■ PAUSE TRADING
            </button>
          </div>
          <div className="stats">
            <div className="stat"><div className="l">Spot price</div><div className="v">2.50 <small>EURS/EUA</small></div></div>
            <div className="stat"><div className="l">Volume 24h</div><div className="v">12,420 <small>EUA</small></div></div>
            <div className="stat"><div className="l">Active wallets</div><div className="v">12</div></div>
            <div className="stat green"><div className="l">DEX status</div><div className="v" style={{fontSize:18,paddingTop:6}}>● Active</div></div>
          </div>
          <div className="panel">
            <div className="ph"><h3>Trades · last 9</h3><span className="meta">streaming · auto-update</span></div>
            <table>
              <thead><tr><th>Time UTC</th><th>From</th><th>To</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>Rate</th><th>Tx</th></tr></thead>
              <tbody>
                {TRADES.map((tr,i) => (
                  <tr key={i}>
                    <td className="mono">{tr.t}</td>
                    <td><span className="ens">{tr.from}</span></td>
                    <td><span className="ens">{tr.to}</span></td>
                    <td className="amt">{tr.amt.toLocaleString()}</td>
                    <td className="amt">{tr.p.toFixed(2)}</td>
                    <td className="mono" style={{color:'#6b6860',fontSize:11}}>{tr.tx} ↗</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedB() {
  return (
    <div className="rs-frame r-b">
      <div className="topbar">
        <span className="crumb">SAP Regulatory Suite › <b>Carbon DEX Oversight</b> › Live Feed</span>
        <div className="right">
          <span>eu-ets-authority.eth</span>
          <span style={{opacity:0.5}}>|</span>
          <span>Base Sepolia</span>
        </div>
      </div>
      <div className="body">
        <div className="nav">
          <div className="it">⌂</div>
          <div className="it">+</div>
          <div className="it">☰</div>
          <div className="it on">≡</div>
          <div className="it">📋</div>
          <div className="it">⚙</div>
        </div>
        <div className="main">
          <div className="pagebar">
            <h2>Live Trade Feed</h2>
            <span className="id">VW_TRADES_001 · view 14.05.26</span>
          </div>
          <div className="toolbar">
            <button>⟳ Refresh</button>
            <button>⊞ Filter</button>
            <button>↓ Export CSV</button>
            <span style={{flex:1}}/>
            <button className="p" style={{background:'#bb0000'}}>■ Emergency Pause</button>
          </div>
          <div className="content">
            <div className="stats">
              <div className="stat"><div className="l">Spot Price (EURS/EUA)</div><div className="v">2.50</div></div>
              <div className="stat"><div className="l">Volume 24h</div><div className="v">12,420</div></div>
              <div className="stat"><div className="l">Active Wallets</div><div className="v">12</div></div>
              <div className="stat"><div className="l">Status</div><div className="v" style={{color:'#107e3e',fontSize:14,paddingTop:4}}>● Active</div></div>
            </div>
            <div className="panel">
              <div className="panel-h"><span>Recent Trades</span><span style={{fontSize:11,color:'#6a6d70'}}>9 records · streaming</span></div>
              <table>
                <thead><tr><th>Time</th><th>From</th><th>To</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>Rate</th><th>Transaction</th></tr></thead>
                <tbody>
                  {TRADES.map((tr,i) => (
                    <tr key={i}>
                      <td className="mono">{tr.t}</td>
                      <td>{tr.from}</td>
                      <td>{tr.to}</td>
                      <td className="amt">{tr.amt.toLocaleString()}</td>
                      <td className="amt">{tr.p.toFixed(2)}</td>
                      <td className="mono" style={{fontSize:11,color:'#0a6ed1'}}>{tr.tx} ↗</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedC() {
  return (
    <div className="rs-frame r-c">
      <div className="topbar">
        <span className="ttl">CDEX</span><span className="pipe">│</span>
        <span>REGULATOR</span><span className="pipe">│</span>
        <span style={{color:'#5fdf6e'}}>EU-ETS-AUTH</span>
        <div className="right">
          <span className="live">● LIVE</span>
          <span>BASE-SEPOLIA</span>
          <span>14:32:07Z</span>
        </div>
      </div>
      <div className="body">
        <div className="nav">
          <div className="ti">OPS</div>
          <div className="it">F1 OVERVIEW</div>
          <div className="it">F2 MINT</div>
          <div className="it">F3 KYC</div>
          <div className="it on">F4 LIVE</div>
          <div className="it">F5 AUDIT</div>
          <div className="ti" style={{paddingTop:14}}>HALT</div>
          <div className="it" style={{color:'#ff5544'}}>F12 PAUSE DEX</div>
        </div>
        <div className="main">
          <div className="head">
            <h2>LIVE TRADE FEED · CDEX-001</h2>
            <span className="meta">REFRESH 250ms · BLOCK 18,294,441</span>
          </div>
          <div className="stats">
            <div className="stat"><div className="l">SPOT</div><div className="v amber">2.5000</div></div>
            <div className="stat"><div className="l">VOL 24H</div><div className="v">12,420</div></div>
            <div className="stat"><div className="l">WALLETS</div><div className="v">12</div></div>
            <div className="stat"><div className="l">STATUS</div><div className="v green">● ACTIVE</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 200px',gap:12}}>
            <div className="panel">
              <div className="panel-h"><span>SWAPS · STREAMING</span><span className="id">9 / 47 TODAY</span></div>
              <table>
                <thead><tr><th>TIME</th><th>FROM</th><th>TO</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>RATE</th></tr></thead>
                <tbody>
                  {TRADES.map((tr,i) => (
                    <tr key={i}>
                      <td>{tr.t}</td>
                      <td><span className="ens">{tr.from}</span></td>
                      <td><span className="ens">{tr.to}</span></td>
                      <td className="amt">{tr.amt}</td>
                      <td className="amt">{tr.p.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel" style={{background:'#1a0a0a',borderColor:'#ff5544'}}>
              <div className="panel-h" style={{color:'#ff5544',borderBottomColor:'#ff5544'}}>EMERGENCY</div>
              <div style={{padding:14,fontSize:10,color:'#b8b6b0',lineHeight:1.6}}>
                <div style={{color:'#ff5544',letterSpacing:'0.12em',marginBottom:8}}>F12 · CIRCUIT BREAKER</div>
                Halts all swaps until UNPAUSE. Visible to all participants. Tx: emergencyPause()
                <button style={{marginTop:14,width:'100%',padding:14,background:'#ff5544',color:'#0a0c0d',fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,letterSpacing:'0.16em',border:0,cursor:'pointer'}}>■ PAUSE DEX</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedD() {
  return (
    <div className="rs-frame r-d">
      <div className="topbar">
        <span className="nameplate">The Registry</span>
        <span className="pipe">·</span>
        <span className="sec">Regulator's edition</span>
        <div className="right">№ 2026-117 · 14.V · BASE-SEPOLIA</div>
      </div>
      <div className="body">
        <div className="nav">
          <div className="ti">Sections</div>
          <div className="it">A · Overview</div>
          <div className="it">B · Mint</div>
          <div className="it">C · Compliance</div>
          <div className="it on">D · Live feed</div>
          <div className="it">E · Audit</div>
          <div className="it">F · Halt</div>
        </div>
        <div className="main">
          <div className="masthead">
            <h2>Forty-seven trades cleared since open.</h2>
            <span className="date">14.V.2026 · 14:32 UTC</span>
          </div>
          <div className="stats">
            <div className="stat"><div className="l">Spot</div><div className="v">2.50<small>EURS/EUA</small></div></div>
            <div className="stat"><div className="l">Volume 24h</div><div className="v">12,420<small>EUA</small></div></div>
            <div className="stat"><div className="l">Wallets active</div><div className="v">12</div></div>
            <div className="stat" style={{background:'#1a1917',color:'#f3efe5'}}>
              <div className="l" style={{color:'#d4a035'}}>Halt control</div>
              <button style={{background:'#b91c1c',color:'#fff',padding:'10px 14px',border:0,fontFamily:'IBM Plex Sans',fontSize:12,fontWeight:600,letterSpacing:'0.12em',cursor:'pointer',marginTop:4,width:'100%'}}>■ PAUSE TRADING</button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h"><h3><i>Trades, in order of arrival.</i></h3><span className="meta">9 of 47 · streaming</span></div>
            <table>
              <thead><tr><th>Time UTC</th><th>From</th><th>To</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>Rate</th><th>Tx</th></tr></thead>
              <tbody>
                {TRADES.map((tr,i) => (
                  <tr key={i}>
                    <td className="mono" style={{color:'#6b6860'}}>{tr.t}</td>
                    <td><span className="ens">{tr.from}</span></td>
                    <td><span className="ens">{tr.to}</span></td>
                    <td className="amt">{tr.amt.toLocaleString()}</td>
                    <td className="amt">{tr.p.toFixed(2)}</td>
                    <td className="mono" style={{color:'#6b6860',fontSize:11}}>{tr.tx} ↗</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedE() {
  return (
    <div className="rs-frame r-e">
      <div className="topbar">
        <div className="crown">★</div>
        <div className="ttl">EU Emissions Trading System<small>Regulator workspace · live oversight</small></div>
        <div className="right">
          <span>eu-ets-authority.eth</span>
          <span style={{opacity:0.5}}>·</span>
          <span>Base Sepolia</span>
        </div>
      </div>
      <div className="body">
        <div className="nav">
          <div className="ti">Operations</div>
          <div className="it">Overview</div>
          <div className="it">Mint credits</div>
          <div className="it">Compliance registry</div>
          <div className="it on">Live trade feed</div>
          <div className="it">Audit log</div>
        </div>
        <div className="main">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
            <div>
              <h2>Live trade feed</h2>
              <p className="sub" style={{display:'flex',gap:10,alignItems:'center'}}>
                <span className="live-dot"/> 47 trades today across the European market
              </p>
            </div>
            <button style={{background:'#b91c1c',color:'#fff',padding:'14px 24px',border:0,borderRadius:8,fontFamily:'Inter',fontSize:14,fontWeight:700,letterSpacing:'0.04em',cursor:'pointer',boxShadow:'0 6px 18px rgba(185,28,28,0.3)'}}>
              ⏸ Pause trading
            </button>
          </div>
          <div className="stats">
            <div className="stat brand"><div className="l">Spot price</div><div className="v">€2.50<small style={{color:'rgba(255,255,255,0.7)'}}>per EUA</small></div><div className="delta" style={{color:'#bbf7d0'}}>+1.2% · 24h</div></div>
            <div className="stat"><div className="l">Volume 24h</div><div className="v">12,420<small>EUA</small></div><div className="delta">+8.1%</div></div>
            <div className="stat"><div className="l">Active wallets</div><div className="v">12</div><div className="delta">+2 today</div></div>
            <div className="stat"><div className="l">DEX status</div><div className="v" style={{color:'#16a34a',fontSize:18}}>● Operating</div><div className="delta">since 12:00 UTC</div></div>
          </div>
          <div className="panel">
            <div className="panel-h"><h3>Trades, last 9</h3><span className="meta">Streaming · 250ms</span></div>
            <table>
              <thead><tr><th>Time UTC</th><th>From</th><th>To</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>Rate</th><th>Tx</th></tr></thead>
              <tbody>
                {TRADES.map((tr,i) => (
                  <tr key={i}>
                    <td className="mono" style={{color:'#4a5550'}}>{tr.t}</td>
                    <td style={{color:'#0b6b34',fontWeight:500}}>{tr.from}</td>
                    <td style={{color:'#0b6b34',fontWeight:500}}>{tr.to}</td>
                    <td className="amt">{tr.amt.toLocaleString()}</td>
                    <td className="amt">€{tr.p.toFixed(2)}</td>
                    <td className="mono" style={{color:'#16a34a',fontSize:11}}>{tr.tx} ↗</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedF() {
  return (
    <div className="rs-frame r-f">
      <div className="topbar">
        <span className="panel-screw"/>
        <div className="ttl">CONTROL CONSOLE 7-A<small>EU ETS · CARBON DEX OVERSIGHT</small></div>
        <div className="leds">
          <span className="lbl">PWR</span><span className="led g"/>
          <span className="lbl" style={{marginLeft:8}}>NET</span><span className="led g"/>
          <span className="lbl" style={{marginLeft:8}}>HALT</span><span className="led r"/>
        </div>
        <span className="panel-screw" style={{marginLeft:14}}/>
      </div>
      <div className="body">
        <div className="nav">
          <div className="ti">CONSOLE</div>
          <div className="it">[01] OVERVIEW</div>
          <div className="it">[02] MINT</div>
          <div className="it">[03] KYC</div>
          <div className="it on">[04] FEED</div>
          <div className="it">[05] AUDIT</div>
          <div className="ti" style={{paddingTop:14}}>EMERGENCY</div>
          <div className="it" style={{color:'#ff5544'}}>[F12] HALT</div>
        </div>
        <div className="main">
          <div className="head">
            <h2>▸ LIVE TRADE FEED · TERMINAL 7-A</h2>
            <span className="ts">14:32:07Z · BLK 18294441 · STREAM ON</span>
          </div>
          <div className="stats">
            <div className="stat"><div className="l">SPOT EURS/EUA</div><div className="v a">02.500</div></div>
            <div className="stat"><div className="l">VOLUME 24H</div><div className="v">12,420</div></div>
            <div className="stat"><div className="l">WALLETS</div><div className="v">012</div></div>
            <div className="stat"><div className="l">STATUS</div><div className="v">▶ NOMINAL</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 220px',gap:12}}>
            <div className="panel">
              <div className="panel-h"><span>▸ SWAP STREAM</span><span className="led"/></div>
              <table>
                <thead><tr><th>TIME</th><th>FROM</th><th>TO</th><th style={{textAlign:'right'}}>EUA</th><th style={{textAlign:'right'}}>RATE</th></tr></thead>
                <tbody>
                  {TRADES.map((tr,i) => (
                    <tr key={i}>
                      <td>{tr.t}</td>
                      <td><span className="ens">{tr.from}</span></td>
                      <td><span className="ens">{tr.to}</span></td>
                      <td className="amt">{tr.amt}</td>
                      <td className="amt" style={{color:'#ffaa44'}}>{tr.p.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel" style={{background:'#1a0808',borderColor:'#ff5544'}}>
              <div className="panel-h" style={{color:'#ff5544',background:'linear-gradient(to bottom,#3a1010,#1a0808)',borderBottomColor:'#ff5544'}}>
                ▸ HALT CONTROL <span className="led" style={{background:'#ff5544',boxShadow:'0 0 8px #ff5544'}}/>
              </div>
              <div style={{padding:14}}>
                <div style={{fontSize:9,color:'#ff8a7a',letterSpacing:'0.16em',marginBottom:10}}>CIRCUIT BREAKER F12</div>
                <div style={{fontSize:10,color:'#d4d8d2',lineHeight:1.6,marginBottom:14}}>
                  CALLS emergencyPause() ON CarbonDEX.sol. ALL SWAPS REVERT. ACTION IS LOGGED.
                </div>
                <button style={{width:'100%',padding:'18px 14px',background:'linear-gradient(to bottom,#ff5544,#cc3322)',color:'#fff',border:'2px solid #1a0808',borderRadius:4,fontFamily:'IBM Plex Mono',fontSize:13,fontWeight:700,letterSpacing:'0.16em',boxShadow:'0 4px 0 #6a1010, inset 0 1px 0 rgba(255,255,255,0.3)',cursor:'pointer'}}>■ PAUSE</button>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:10}}>
                  <div style={{textAlign:'center',padding:6,background:'#14160f',border:'1px solid #404a3e',fontSize:9,color:'#6a6d68',letterSpacing:'0.12em'}}>ARMED<br/><span style={{color:'#ff5544',fontSize:11}}>●</span></div>
                  <div style={{textAlign:'center',padding:6,background:'#14160f',border:'1px solid #404a3e',fontSize:9,color:'#6a6d68',letterSpacing:'0.12em'}}>READY<br/><span style={{color:'#5fdf6e',fontSize:11}}>●</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== PAUSE CONFIRMATION MODAL — 6 directions ===============

function PauseA() {
  return (
    <div className="modal-bg a">
      <div style={{background:'#fff',border:'1px solid #d8d4c8',borderRadius:6,width:480,padding:0,boxShadow:'0 30px 80px rgba(0,0,0,0.4)'}}>
        <div style={{padding:'22px 26px 0'}}>
          <span className="pause-pill"><span className="d"/>Emergency action</span>
          <h3 style={{fontFamily:'Fraunces, serif',fontSize:24,fontWeight:500,letterSpacing:'-0.01em',marginTop:14,marginBottom:6}}>Pause all DEX trading?</h3>
          <p style={{fontSize:13,color:'#6b6860',lineHeight:1.55,marginBottom:14}}>This halts every swap on CarbonDEX.sol. All in-flight transactions will revert. The pause is visible to every wallet in real time.</p>
        </div>
        <div style={{padding:'0 26px 18px'}}>
          <div style={{padding:14,background:'#fafaf6',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,color:'#4a4740',lineHeight:1.6}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>Action</span><span className="mono">emergencyPause()</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>Contract</span><span className="mono">CarbonDEX.sol</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>Authority</span><span className="ens">eu-ets-authority.eth</span></div>
          </div>
          <div style={{marginTop:14}}>
            <div style={{fontSize:11,color:'#6b6860',marginBottom:5}}>Type <b>PAUSE</b> to confirm</div>
            <input value="PAUSE" readOnly style={{width:'100%',padding:'10px 12px',border:'1px solid #b91c1c',borderRadius:4,fontFamily:'IBM Plex Mono',fontSize:14,letterSpacing:'0.18em',color:'#b91c1c',fontWeight:700}}/>
          </div>
        </div>
        <div style={{padding:'14px 26px 22px',display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:8}}>
          <button style={{padding:12,background:'#fff',border:'1px solid #d8d4c8',borderRadius:4,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
          <button style={{padding:12,background:'#b91c1c',color:'#fff',border:0,borderRadius:4,fontSize:13,fontWeight:600,cursor:'pointer'}}>Pause trading →</button>
        </div>
      </div>
    </div>
  );
}

function PauseB() {
  return (
    <div className="modal-bg b">
      <div style={{background:'#fff',width:460,boxShadow:'0 12px 40px rgba(0,0,0,0.25)',fontFamily:'Inter, sans-serif'}}>
        <div style={{background:'#bb0000',color:'#fff',padding:'10px 16px',fontSize:13,fontWeight:500,display:'flex',gap:10,alignItems:'center'}}>
          ⚠ Emergency Pause Confirmation
        </div>
        <div style={{padding:18,fontSize:13,color:'#32363a'}}>
          <p style={{marginBottom:14}}>You are about to invoke the emergency pause. Trading will be halted across the entire DEX until the unpause action is executed.</p>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:14}}>
            <tbody>
              <tr><td style={{padding:'6px 8px',background:'#fafbfc',color:'#6a6d70',width:'40%'}}>Action</td><td style={{padding:'6px 8px',border:'1px solid #d5dce2',fontFamily:'IBM Plex Mono'}}>emergencyPause()</td></tr>
              <tr><td style={{padding:'6px 8px',background:'#fafbfc',color:'#6a6d70'}}>Contract</td><td style={{padding:'6px 8px',border:'1px solid #d5dce2',fontFamily:'IBM Plex Mono'}}>CarbonDEX.sol · 0x8e21…f00c</td></tr>
              <tr><td style={{padding:'6px 8px',background:'#fafbfc',color:'#6a6d70'}}>Authority</td><td style={{padding:'6px 8px',border:'1px solid #d5dce2',fontFamily:'IBM Plex Mono'}}>eu-ets-authority.eth</td></tr>
              <tr><td style={{padding:'6px 8px',background:'#fafbfc',color:'#6a6d70'}}>Block</td><td style={{padding:'6px 8px',border:'1px solid #d5dce2',fontFamily:'IBM Plex Mono'}}>~18,294,442</td></tr>
            </tbody>
          </table>
          <div style={{padding:10,background:'#fef0e0',border:'1px solid #f0c896',color:'#8c5400',fontSize:12}}>
            ⓘ Confirmation: type <b>PAUSE</b> in capital letters to proceed.
          </div>
          <input value="PAUSE" readOnly style={{width:'100%',padding:'8px 10px',border:'1px solid #d5dce2',marginTop:10,fontFamily:'IBM Plex Mono',fontSize:14,letterSpacing:'0.18em',color:'#bb0000'}}/>
        </div>
        <div style={{padding:'10px 16px',background:'#fafbfc',borderTop:'1px solid #d5dce2',display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button style={{padding:'7px 16px',background:'#fff',border:'1px solid #d5dce2',fontSize:12,cursor:'pointer'}}>Cancel</button>
          <button style={{padding:'7px 16px',background:'#bb0000',color:'#fff',border:0,fontSize:12,fontWeight:500,cursor:'pointer'}}>Execute Pause</button>
        </div>
      </div>
    </div>
  );
}

function PauseC() {
  return (
    <div className="modal-bg c">
      <div style={{background:'#0a0c0d',border:'1px solid #ff5544',width:460,padding:0,fontFamily:'IBM Plex Mono, monospace',color:'#e8e6df',boxShadow:'0 30px 80px rgba(255,85,68,0.2), inset 0 0 0 1px rgba(255,85,68,0.2)'}}>
        <div style={{padding:'10px 14px',background:'#1a0a0a',borderBottom:'1px solid #ff5544',color:'#ff5544',fontSize:10,letterSpacing:'0.2em',fontWeight:700,display:'flex',justifyContent:'space-between'}}>
          <span>▸ EMERGENCY HALT · F12</span>
          <span style={{color:'#6b6860'}}>14:32:07Z</span>
        </div>
        <div style={{padding:18,fontSize:11,lineHeight:1.7}}>
          <div style={{color:'#ff5544',fontSize:14,letterSpacing:'0.12em',marginBottom:12}}>PAUSE ALL DEX TRADING ?</div>
          <div style={{color:'#b8b6b0',marginBottom:14}}>
            CALLS emergencyPause() ON CarbonDEX. ALL SWAPS REVERT UNTIL UNPAUSE. ACTION IS RECORDED IN REGULATORYACTION EVENT LOG.
          </div>
          <div style={{borderTop:'1px solid #2a2c2e',borderBottom:'1px solid #2a2c2e',padding:'10px 0',margin:'14px 0',fontSize:10}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>FN</span><span style={{color:'#d4a035'}}>emergencyPause()</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>CONTRACT</span><span>0x8e21…f00c</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>AUTHORITY</span><span style={{color:'#d4a035'}}>eu-ets-authority.eth</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span style={{color:'#6b6860'}}>NET</span><span>BASE-SEPOLIA</span></div>
          </div>
          <div style={{color:'#6b6860',fontSize:9,letterSpacing:'0.12em',marginBottom:6}}>TYPE [PAUSE] TO ARM</div>
          <div style={{padding:'10px 12px',background:'#1a1c1e',border:'1px solid #ff5544',color:'#ff5544',fontSize:14,letterSpacing:'0.2em'}}>PAUSE_</div>
        </div>
        <div style={{padding:'10px 14px',borderTop:'1px solid #2a2c2e',display:'flex',gap:8}}>
          <button style={{flex:1,padding:'10px',background:'transparent',border:'1px solid #2a2c2e',color:'#b8b6b0',fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.12em',cursor:'pointer'}}>[ESC] CANCEL</button>
          <button style={{flex:1.6,padding:'10px',background:'#ff5544',color:'#0a0c0d',border:0,fontFamily:'IBM Plex Mono',fontSize:11,fontWeight:700,letterSpacing:'0.16em',cursor:'pointer'}}>[F12] EXECUTE</button>
        </div>
      </div>
    </div>
  );
}

function PauseD() {
  return (
    <div className="modal-bg d">
      <div style={{background:'#f3efe5',width:520,padding:32,border:'2px solid #1a1917',boxShadow:'0 30px 80px rgba(0,0,0,0.5)'}}>
        <div style={{borderTop:'4px solid #1a1917',borderBottom:'1px solid #1a1917',padding:'10px 0',marginBottom:20,display:'flex',justifyContent:'space-between'}}>
          <span style={{fontFamily:'IBM Plex Mono',fontSize:10,letterSpacing:'0.2em',textTransform:'uppercase',color:'#6b6860'}}>Form HLT-12 · halt order</span>
          <span style={{fontFamily:'IBM Plex Mono',fontSize:10,letterSpacing:'0.16em',color:'#6b6860'}}>14.V.2026 · 14:32 UTC</span>
        </div>
        <h3 style={{fontFamily:'Fraunces, serif',fontSize:30,fontWeight:500,lineHeight:1.1,letterSpacing:'-0.02em',marginBottom:12,color:'#b91c1c'}}>By order of the Authority,<br/>halt all trading.</h3>
        <p style={{fontSize:13,color:'#1a1917',lineHeight:1.55,marginBottom:18,fontStyle:'italic'}}>This filing invokes the emergency-pause provision granted to <span className="ens">eu-ets-authority.eth</span> under EU ETS Phase IV § 7.4. Trading shall not resume until a corresponding unpause is filed.</p>
        <div style={{padding:'14px 0',borderTop:'1px solid #1a1917',borderBottom:'1px solid #1a1917',marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,fontSize:12}}>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>Action</div><div className="mono">emergencyPause()</div></div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>Contract</div><div className="mono">CarbonDEX.sol</div></div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>Authority</div><div className="ens">eu-ets-authority.eth</div></div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>Network</div><div className="mono">Base Sepolia</div></div>
        </div>
        <div style={{fontSize:11,color:'#6b6860',marginBottom:6,fontFamily:'IBM Plex Mono',letterSpacing:'0.12em',textTransform:'uppercase'}}>Sign by typing PAUSE</div>
        <div style={{padding:'10px 12px',background:'#fff',border:'1px solid #1a1917',fontFamily:'IBM Plex Mono',fontSize:16,letterSpacing:'0.24em',color:'#b91c1c',marginBottom:18,fontWeight:600}}>PAUSE</div>
        <div style={{display:'flex',gap:10}}>
          <button style={{flex:1,padding:'12px 14px',background:'#f3efe5',border:'1px solid #1a1917',color:'#1a1917',fontSize:12,fontFamily:'IBM Plex Sans',fontWeight:500,cursor:'pointer'}}>Withdraw</button>
          <button style={{flex:1.6,padding:'12px 14px',background:'#b91c1c',color:'#fff',border:0,fontSize:12,fontFamily:'IBM Plex Sans',fontWeight:600,letterSpacing:'0.08em',cursor:'pointer'}}>File halt order →</button>
        </div>
      </div>
    </div>
  );
}

function PauseE() {
  return (
    <div className="modal-bg e">
      <div style={{background:'#fff',width:480,borderRadius:12,overflow:'hidden',fontFamily:'Inter, sans-serif',boxShadow:'0 30px 80px rgba(0,0,0,0.4)'}}>
        <div style={{background:'linear-gradient(135deg, #b91c1c, #dc2626)',padding:22,color:'#fff'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11,padding:'4px 10px',background:'rgba(255,255,255,0.18)',borderRadius:100,fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:14}}>
            ⏸ Emergency action
          </div>
          <h3 style={{fontSize:22,fontWeight:700,letterSpacing:'-0.01em',marginBottom:6}}>Pause European carbon trading?</h3>
          <p style={{fontSize:13,opacity:0.95,lineHeight:1.5}}>All swaps will be halted immediately. The pause is publicly visible to every wallet, immediately, on every portal.</p>
        </div>
        <div style={{padding:22}}>
          <div style={{background:'#f6fbf7',border:'1px solid #e0e7e3',borderRadius:8,padding:14,marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span style={{color:'#4a5550'}}>Action</span><span className="mono" style={{fontWeight:600}}>emergencyPause()</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span style={{color:'#4a5550'}}>Contract</span><span className="mono" style={{fontWeight:600}}>CarbonDEX.sol</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:13}}><span style={{color:'#4a5550'}}>Authority</span><span style={{color:'#0b6b34',fontWeight:600}}>eu-ets-authority.eth</span></div>
          </div>
          <label style={{fontSize:12,color:'#0c1f15',fontWeight:600,marginBottom:6,display:'block'}}>Type <span style={{color:'#b91c1c'}}>PAUSE</span> to confirm</label>
          <input value="PAUSE" readOnly style={{width:'100%',padding:'12px 14px',border:'2px solid #b91c1c',borderRadius:8,fontFamily:'JetBrains Mono',fontSize:15,letterSpacing:'0.2em',color:'#b91c1c',fontWeight:700}}/>
        </div>
        <div style={{padding:'14px 22px 22px',display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:10}}>
          <button style={{padding:14,background:'#fff',border:'1px solid #e0e7e3',borderRadius:8,fontSize:14,fontWeight:600,color:'#0c1f15',cursor:'pointer'}}>Cancel</button>
          <button style={{padding:14,background:'#b91c1c',color:'#fff',border:0,borderRadius:8,fontSize:14,fontWeight:700,letterSpacing:'0.02em',cursor:'pointer'}}>⏸ Pause trading</button>
        </div>
      </div>
    </div>
  );
}

function PauseF() {
  return (
    <div className="modal-bg f">
      <div style={{background:'linear-gradient(to bottom,#2c2e2a,#1a1c19)',width:520,border:'2px solid #404a3e',padding:0,fontFamily:'IBM Plex Mono, monospace',color:'#d4d8d2',boxShadow:'0 30px 80px rgba(255,85,68,0.3), inset 0 0 0 1px rgba(0,0,0,0.4)',position:'relative'}}>
        {/* corner screws */}
        <span style={{position:'absolute',top:8,left:8,width:8,height:8,background:'radial-gradient(circle,#6a6d68,#2c2e2a)',borderRadius:'50%',boxShadow:'inset 0 0 2px rgba(0,0,0,0.5)'}}/>
        <span style={{position:'absolute',top:8,right:8,width:8,height:8,background:'radial-gradient(circle,#6a6d68,#2c2e2a)',borderRadius:'50%',boxShadow:'inset 0 0 2px rgba(0,0,0,0.5)'}}/>
        <span style={{position:'absolute',bottom:8,left:8,width:8,height:8,background:'radial-gradient(circle,#6a6d68,#2c2e2a)',borderRadius:'50%',boxShadow:'inset 0 0 2px rgba(0,0,0,0.5)'}}/>
        <span style={{position:'absolute',bottom:8,right:8,width:8,height:8,background:'radial-gradient(circle,#6a6d68,#2c2e2a)',borderRadius:'50%',boxShadow:'inset 0 0 2px rgba(0,0,0,0.5)'}}/>
        <div style={{padding:'14px 22px',background:'linear-gradient(to bottom,#3a1010,#1f0a0a)',borderBottom:'2px solid #ff5544',color:'#ff5544',fontSize:11,letterSpacing:'0.24em',fontWeight:700,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>▣ CIRCUIT BREAKER · F12</span>
          <span style={{display:'inline-flex',gap:6,alignItems:'center'}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:'#ff5544',boxShadow:'0 0 8px #ff5544'}}/>
            ARMED
          </span>
        </div>
        <div style={{padding:24}}>
          <div style={{fontSize:9,color:'#ff8a7a',letterSpacing:'0.2em',marginBottom:6,fontWeight:700}}>WARNING · IRREVOCABLE WITHOUT UNPAUSE ORDER</div>
          <div style={{fontSize:18,color:'#ff5544',letterSpacing:'0.12em',marginBottom:14,fontWeight:700,textShadow:'0 0 12px rgba(255,85,68,0.3)'}}>HALT MARKET ?</div>
          <div style={{fontSize:11,color:'#d4d8d2',lineHeight:1.7,marginBottom:18}}>
            EXECUTING WILL CALL <span style={{color:'#ffaa44'}}>emergencyPause()</span> ON THE CARBON DEX. ALL TRANSACTIONS IN-FLIGHT REVERT. STATE BROADCASTS TO ALL PARTICIPANTS WITHIN 12 SECONDS.
          </div>
          <div style={{padding:'10px 12px',background:'#14160f',border:'1px solid #404a3e',marginBottom:18,fontSize:10,lineHeight:1.7}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#6a6d68'}}>FN</span><span style={{color:'#ffaa44'}}>emergencyPause()</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#6a6d68'}}>CONTRACT</span><span>CarbonDEX.sol</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#6a6d68'}}>OPERATOR</span><span style={{color:'#ffaa44'}}>eu-ets-authority.eth</span></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#6a6d68'}}>EST. BLK</span><span>18,294,442</span></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:14,alignItems:'center',marginBottom:18}}>
            <div style={{fontSize:9,color:'#6a6d68',letterSpacing:'0.16em',textAlign:'center'}}>KEY 1<br/><span style={{display:'inline-block',width:18,height:18,background:'radial-gradient(circle,#ffaa44,#cc6600)',borderRadius:'50%',boxShadow:'0 0 10px #ffaa44',marginTop:4}}/></div>
            <div style={{padding:'12px 14px',background:'#14160f',border:'2px solid #ff5544',color:'#ff5544',fontSize:18,letterSpacing:'0.3em',fontWeight:700,textAlign:'center'}}>PAUSE</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr',gap:10}}>
            <button style={{padding:'14px',background:'linear-gradient(to bottom,#404a3e,#2c2e2a)',color:'#d4d8d2',border:'1px solid #404a3e',fontFamily:'IBM Plex Mono',fontSize:11,letterSpacing:'0.16em',fontWeight:700,cursor:'pointer',boxShadow:'0 3px 0 #1a1c19, inset 0 1px 0 rgba(255,255,255,0.1)'}}>[ESC] STAND DOWN</button>
            <button style={{padding:'14px',background:'linear-gradient(to bottom,#ff5544,#cc3322)',color:'#fff',border:'2px solid #1a0808',fontFamily:'IBM Plex Mono',fontSize:12,letterSpacing:'0.18em',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 0 #6a1010, inset 0 1px 0 rgba(255,255,255,0.3)'}}>▣ EXECUTE F12</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== CANVAS ASSEMBLY ===============

function App() {
  return (
    <DesignCanvas>
      <DCSection id="feed" title="Live trade feed + PAUSE button" subtitle="Demo centerpiece — 6 directions">
        <DCArtboard id="fa" label="A · Nordic institutional" width={1280} height={800}><FeedA/></DCArtboard>
        <DCArtboard id="fb" label="B · SAP enterprise" width={1280} height={800}><FeedB/></DCArtboard>
        <DCArtboard id="fc" label="C · Bloomberg terminal" width={1280} height={800}><FeedC/></DCArtboard>
        <DCArtboard id="fd" label="D · Editorial broadsheet" width={1280} height={800}><FeedD/></DCArtboard>
        <DCArtboard id="fe" label="E · Modern gov.uk green" width={1280} height={800}><FeedE/></DCArtboard>
        <DCArtboard id="ff" label="F · War room console" width={1280} height={800}><FeedF/></DCArtboard>
      </DCSection>

      <DCSection id="confirm" title="PAUSE confirmation modal" subtitle="The 'type PAUSE' moment — 6 directions">
        <DCArtboard id="pa" label="A · Nordic" width={720} height={640}><PauseA/></DCArtboard>
        <DCArtboard id="pb" label="B · SAP" width={720} height={640}><PauseB/></DCArtboard>
        <DCArtboard id="pc" label="C · Terminal" width={720} height={640}><PauseC/></DCArtboard>
        <DCArtboard id="pd" label="D · Broadsheet" width={760} height={720}><PauseD/></DCArtboard>
        <DCArtboard id="pe" label="E · gov.uk green" width={720} height={680}><PauseE/></DCArtboard>
        <DCArtboard id="pf" label="F · War room" width={760} height={760}><PauseF/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
