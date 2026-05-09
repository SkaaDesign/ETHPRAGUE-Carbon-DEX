// Regulator Portal — 9 screens + reality cheat sheet, direction A (Nordic)
// Reuses .r-a styles from regulator-screens.css

const NAV = [
  { id:'overview', label:'Overview' },
  { id:'issue', label:'Issuance' },
  { id:'kyc', label:'Compliance registry' },
  { id:'live', label:'Live trade feed' },
  { id:'surrender', label:'Surrender & reconciliation' },
  { id:'audit', label:'Audit log' },
  { id:'halt', label:'Emergency controls' },
];
const NAV2 = [
  { id:'perm', label:'Permissions' },
  { id:'set', label:'Settings' },
];

function Topbar() {
  return (
    <div className="topbar">
      <span className="badge"><span className="d"/>Regulator</span>
      <h1>Carbon DEX · oversight</h1>
      <div className="right">
        <span className="ens">eu-ets-authority.eth</span>
        <span style={{color:'#6b6860'}}>·</span>
        <span className="net">Base Sepolia</span>
        <span style={{color:'#6b6860',fontSize:11,fontFamily:'IBM Plex Mono'}}>0x5f3a…8b12</span>
      </div>
    </div>
  );
}

function Sidebar({active}) {
  return (
    <div className="nav">
      <div className="ti">Operations</div>
      {NAV.map(n => <div key={n.id} className={'it' + (active===n.id?' on':'')}>{n.label}</div>)}
      <div className="ti" style={{paddingTop:18}}>Authority</div>
      {NAV2.map(n => <div key={n.id} className={'it' + (active===n.id?' on':'')}>{n.label}</div>)}
    </div>
  );
}

function Frame({active, children}) {
  return (
    <div className="rs-frame r-a">
      <Topbar/>
      <div className="body">
        <Sidebar active={active}/>
        <div className="main">{children}</div>
      </div>
    </div>
  );
}

function PageHead({eyebrow, title, sub, right}) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:22,gap:24}}>
      <div>
        {eyebrow && <div style={{fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:'#6b6860',fontWeight:600,marginBottom:6}}>{eyebrow}</div>}
        <h2>{title}</h2>
        {sub && <div className="sub" style={{marginBottom:0,marginTop:6}}>{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// =============== 0 · REALITY CHEAT SHEET ===============

function CheatSheet() {
  return (
    <div className="cheat">
      <div style={{borderTop:'4px solid #1a1917',borderBottom:'1px solid #1a1917',padding:'12px 0',marginBottom:18,display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
        <span style={{fontFamily:'IBM Plex Mono',fontSize:10,letterSpacing:'0.2em',textTransform:'uppercase',color:'#6b6860'}}>Reality cheat sheet · v1</span>
        <span style={{fontFamily:'IBM Plex Mono',fontSize:10,letterSpacing:'0.16em',color:'#6b6860'}}>For pitch · ETHPrague 2026</span>
      </div>
      <h1>What we collapsed,<br/>and what we kept honest.</h1>
      <p className="deck">In real EU ETS, "the regulator" is many actors and several primary-market mechanisms. In our prototype on Base Sepolia, one authority wallet stands in for the whole stack. These adjacent screens (auction calendar, allocation table, surrender) hint at the full reality so the demo doesn't read as naïve.</p>
      <div className="grid">
        <div className="card">
          <span className="role cm">Central</span>
          <h3>European Commission</h3>
          <p>Operates the Union Registry. Sets the cap, runs the EU Transaction Log (EUTL) which validates every transfer. Cancels allowances under the Market Stability Reserve. <b>In our demo:</b> rolled into <code>eu-ets-authority.eth</code>.</p>
        </div>
        <div className="card">
          <span className="role na">National</span>
          <h3>30-ish national administrators</h3>
          <p>DEHSt (DE), Swedish Energy Agency (SE), Dutch Emissions Authority (NL), etc. Open accounts, run KYC, freeze/suspend, distribute free allocations to installations in their country. <b>In our demo:</b> also rolled into the authority wallet.</p>
        </div>
        <div className="card">
          <span className="role mk">Primary market</span>
          <h3>EEX auctions + free allocation</h3>
          <p>EUAs enter circulation two ways: <b>daily auctions on EEX Leipzig</b> (Mon/Tue/Thu, plus Friday for DE) and <b>annual free allocation</b> uploaded as a table per installation. Power gets none free; heavy industry gets a declining portion. <b>In our demo:</b> "Issuance" screen handles both.</p>
        </div>
        <div className="card">
          <span className="role co">Companies + intermediaries</span>
          <h3>Account holders</h3>
          <p>~20,000 accounts. Stationary installations (steel, cement, power), aviation, shipping (40% phase-in 2024). Plus banks and brokers bidding on their behalf. They trade EUAs peer-to-peer or via futures (ICE Endex). <b>In our demo:</b> companies on the DEX.</p>
        </div>
      </div>

      <div style={{marginTop:18,padding:'18px 20px',background:'#fff',border:'1px solid #d8d4c8',borderRadius:6}}>
        <h3 style={{fontFamily:'Fraunces, serif',fontSize:18,fontWeight:500,marginBottom:10}}>The yearly cycle (kept honest in our screens)</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:12,fontSize:12,color:'#4a4740',lineHeight:1.5}}>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>① Allocate</div>Free allocation table goes live February. Installations receive their annual portion.</div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>② Auction & trade</div>Daily auctions on EEX. Companies trade peer-to-peer all year on the secondary market.</div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>③ Verify</div>External verifiers audit each installation's emissions by March 31.</div>
          <div><div style={{fontFamily:'IBM Plex Mono',fontSize:9,letterSpacing:'0.16em',color:'#6b6860',textTransform:'uppercase',marginBottom:4}}>④ Surrender · Apr 30</div>One EUA surrendered per tonne emitted. Short by any → €100/tonne penalty + still owe.</div>
        </div>
      </div>

      <div className="stack">
        <h3>What's not in this prototype, and why</h3>
        <p>Multi-sig governance, verifier onboarding, cross-ETS linking (e.g. Swiss ETS), auction settlement clearing (ECC), MOHA accounts vs trading accounts, Market Stability Reserve auto-adjustment, retail intermediation. All real, all out of scope for a demo. The screens you'll see are: dashboard, issuance, compliance registry, live trade feed, surrender & reconciliation, audit log, emergency controls, permissions, settings. Nine screens, one authority wallet, on-chain.</p>
      </div>
    </div>
  );
}

// =============== 1 · DASHBOARD ===============

function Dashboard() {
  return (
    <Frame active="overview">
      <PageHead
        eyebrow="14 May 2026 · 14:32 UTC"
        title="Overview"
        sub="System pulse, today's actions, pending decisions."
        right={<button style={{padding:'10px 16px',background:'#1a4a35',color:'#fff',border:0,borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>+ New action</button>}
      />
      <div className="stats">
        <div className="stat"><div className="l">Total supply</div><div className="v">4,500 <small>EUA</small></div></div>
        <div className="stat"><div className="l">Verified accounts</div><div className="v">12 <small>/ 14 pending</small></div></div>
        <div className="stat"><div className="l">Trades 24h</div><div className="v">47</div></div>
        <div className="stat green"><div className="l">DEX status</div><div className="v" style={{fontSize:18,paddingTop:6}}>● Active</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginBottom:14}}>
        <div className="panel">
          <div className="ph"><h3>Today's actions · 6</h3><span className="meta">streaming · auto-update</span></div>
          <table>
            <thead><tr><th>Time UTC</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
            <tbody>
              <tr><td className="mono">14:32</td><td><span style={{color:'#166534'}}>● Minted</span></td><td><span className="ens">company-a.eth</span></td><td>1,000 EUA · Energy 2024 · DE</td></tr>
              <tr><td className="mono">13:55</td><td><span style={{color:'#166534'}}>● Registered</span></td><td><span className="ens">company-b.eth</span></td><td>Buyer · FR</td></tr>
              <tr><td className="mono">13:40</td><td><span style={{color:'#b91c1c'}}>● Frozen</span></td><td><span className="ens">company-c.eth</span></td><td>Suspicious trading pattern</td></tr>
              <tr><td className="mono">13:18</td><td><span style={{color:'#166534'}}>● Allocated</span></td><td>Q2 free allocation</td><td>3,200 EUA · 8 installations</td></tr>
              <tr><td className="mono">12:05</td><td><span style={{color:'#166534'}}>● Unpaused</span></td><td>DEX</td><td>Resumed normal operation</td></tr>
              <tr><td className="mono">12:00</td><td><span style={{color:'#b91c1c'}}>● Paused</span></td><td>DEX</td><td>5-minute drill</td></tr>
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="ph"><h3>Pending decisions</h3><span className="meta">3</span></div>
          <div style={{padding:18}}>
            <div style={{borderBottom:'1px solid #ededee',paddingBottom:12,marginBottom:12}}>
              <div style={{fontSize:11,color:'#92400e',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>KYC pending · 14h</div>
              <div style={{fontSize:13,marginBottom:4}}><span className="ens">company-d.eth</span> · Netherlands · Emitter</div>
              <div style={{display:'flex',gap:6,marginTop:8}}><button style={{padding:'4px 10px',fontSize:11,background:'#1a4a35',color:'#fff',border:0,borderRadius:3}}>Approve</button><button style={{padding:'4px 10px',fontSize:11,background:'#fff',color:'#4a4740',border:'1px solid #d8d4c8',borderRadius:3}}>View dossier</button></div>
            </div>
            <div style={{borderBottom:'1px solid #ededee',paddingBottom:12,marginBottom:12}}>
              <div style={{fontSize:11,color:'#92400e',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Surrender shortfall · 2024</div>
              <div style={{fontSize:13,marginBottom:4}}><span className="ens">company-c.eth</span> short 280 EUA · €28,000 penalty</div>
              <div style={{display:'flex',gap:6,marginTop:8}}><button style={{padding:'4px 10px',fontSize:11,background:'#fff',color:'#4a4740',border:'1px solid #d8d4c8',borderRadius:3}}>Open case</button></div>
            </div>
            <div>
              <div style={{fontSize:11,color:'#92400e',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:4}}>Allocation upload · Q3</div>
              <div style={{fontSize:13,marginBottom:4}}>Q3 free allocation table due 15 May</div>
              <div style={{display:'flex',gap:6,marginTop:8}}><button style={{padding:'4px 10px',fontSize:11,background:'#fff',color:'#4a4740',border:'1px solid #d8d4c8',borderRadius:3}}>Open uploader</button></div>
            </div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph"><h3>Cap & circulation · phase IV</h3><span className="meta">2026 cap · 1.43 GtCO₂e EU-wide</span></div>
        <div style={{padding:'18px 22px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:11,color:'#6b6860'}}>
            <span>0</span><span>Issued: 4,500</span><span>Cap: 6,000</span>
          </div>
          <div style={{height:14,background:'#ededee',borderRadius:3,overflow:'hidden',display:'flex'}}>
            <div style={{width:'50%',background:'#1a4a35'}}/>
            <div style={{width:'25%',background:'#5fa884'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:10,fontSize:11,color:'#4a4740'}}>
            <span><span style={{display:'inline-block',width:10,height:10,background:'#1a4a35',marginRight:6,verticalAlign:'middle'}}/>Allocated free · 3,000</span>
            <span><span style={{display:'inline-block',width:10,height:10,background:'#5fa884',marginRight:6,verticalAlign:'middle'}}/>Auctioned · 1,500</span>
            <span><span style={{display:'inline-block',width:10,height:10,background:'#ededee',marginRight:6,verticalAlign:'middle'}}/>Reserve · 1,500</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// =============== 2 · ISSUANCE (auction + free allocation) ===============

function Issuance() {
  return (
    <Frame active="issue">
      <PageHead
        eyebrow="Primary market"
        title="Issuance"
        sub="Auction settlement and annual free allocation. Issuance is recorded as Mint events on CarbonCredit.sol."
      />
      <div style={{display:'flex',gap:24,borderBottom:'1px solid #d8d4c8',marginBottom:18}}>
        <div style={{padding:'10px 0',borderBottom:'2px solid #1a4a35',color:'#1a4a35',fontWeight:500,fontSize:13}}>Auction settlement</div>
        <div style={{padding:'10px 0',color:'#6b6860',fontSize:13}}>Free allocation table</div>
        <div style={{padding:'10px 0',color:'#6b6860',fontSize:13}}>Cancellation</div>
        <div style={{padding:'10px 0',color:'#6b6860',fontSize:13}}>Market Stability Reserve</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14,marginBottom:14}}>
        <div className="panel">
          <div className="ph"><h3>Today's auction · EEX-001</h3><span className="meta">closes 15:00 CET</span></div>
          <div style={{padding:22}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:14,marginBottom:18}}>
              <div><div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#6b6860',marginBottom:4}}>Volume offered</div><div style={{fontSize:22,fontFamily:'IBM Plex Mono',fontWeight:500}}>1,000 <span style={{fontSize:12,color:'#6b6860',fontFamily:'IBM Plex Sans',fontWeight:400}}>EUA</span></div></div>
              <div><div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#6b6860',marginBottom:4}}>Reserve price</div><div style={{fontSize:22,fontFamily:'IBM Plex Mono',fontWeight:500}}>2.40 <span style={{fontSize:12,color:'#6b6860',fontFamily:'IBM Plex Sans',fontWeight:400}}>EURS</span></div></div>
              <div><div style={{fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',color:'#6b6860',marginBottom:4}}>Bidders so far</div><div style={{fontSize:22,fontFamily:'IBM Plex Mono',fontWeight:500}}>7</div></div>
            </div>
            <div style={{fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',color:'#6b6860',fontWeight:600,marginBottom:8}}>Top bids</div>
            <table>
              <tbody>
                <tr><td><span className="ens">company-b.eth</span></td><td className="amt">2.55</td><td className="amt">400 EUA</td></tr>
                <tr><td><span className="ens">company-d.eth</span></td><td className="amt">2.52</td><td className="amt">350 EUA</td></tr>
                <tr><td><span className="ens">company-a.eth</span></td><td className="amt">2.50</td><td className="amt">250 EUA</td></tr>
                <tr><td><span className="ens">company-e.eth</span></td><td className="amt">2.48</td><td className="amt">600 EUA</td></tr>
              </tbody>
            </table>
            <div style={{marginTop:14,padding:12,background:'#fafaf6',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,color:'#4a4740'}}>
              <b>Clearing price (preliminary):</b> 2.50 EURS · settles 1,000 EUA across top 4 bidders. Mints on settlement.
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="ph"><h3>Auction calendar</h3><span className="meta">May 2026</span></div>
          <div style={{padding:'14px 18px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7, 1fr)',gap:4,fontSize:10,textAlign:'center'}}>
              {['M','T','W','T','F','S','S'].map(d => <div key={d} style={{color:'#6b6860',padding:6}}>{d}</div>)}
              {[...Array(31)].map((_,i)=>{
                const day = i+1;
                const isAuction = [4,5,7,8,11,12,14,15,18,19,21,22,25,26,28,29].includes(day);
                const isFriday = [8,15,22,29].includes(day);
                const isToday = day === 14;
                return (
                  <div key={i} style={{
                    padding:6,
                    background: isToday ? '#1a4a35' : isAuction ? '#f0fdf4' : '#fff',
                    color: isToday ? '#fff' : isAuction ? '#166534' : '#1a1917',
                    border: isAuction && !isToday ? '1px solid #bbf7d0' : '1px solid #ededee',
                    borderRadius:3,
                    fontWeight: isToday ? 600 : 400,
                    fontFamily:'IBM Plex Mono',
                    position:'relative'
                  }}>
                    {day}
                    {isFriday && !isToday && <span style={{position:'absolute',top:1,right:2,fontSize:8,color:'#d4a035'}}>DE</span>}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:14,fontSize:11,color:'#4a4740',display:'flex',gap:14,flexWrap:'wrap'}}>
              <span><span style={{display:'inline-block',width:10,height:10,background:'#f0fdf4',border:'1px solid #bbf7d0',marginRight:4,verticalAlign:'middle'}}/>EU auction</span>
              <span><span style={{display:'inline-block',width:10,height:10,background:'#1a4a35',marginRight:4,verticalAlign:'middle'}}/>Today</span>
              <span style={{color:'#d4a035'}}>DE = Germany</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="ph"><h3>Recent settlements</h3><span className="meta">last 7 days</span></div>
        <table>
          <thead><tr><th>Date</th><th>Auction</th><th>Volume</th><th>Clearing</th><th>Bidders</th><th>Tx</th></tr></thead>
          <tbody>
            <tr><td className="mono">12 May</td><td>EEX-EU</td><td className="amt">1,000 EUA</td><td className="amt">2.49</td><td className="amt">9</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>0xa1f8…2c33 ↗</td></tr>
            <tr><td className="mono">11 May</td><td>EEX-EU</td><td className="amt">1,000 EUA</td><td className="amt">2.48</td><td className="amt">7</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>0xc442…ee19 ↗</td></tr>
            <tr><td className="mono">09 May</td><td>EEX-DE</td><td className="amt">500 EUA</td><td className="amt">2.51</td><td className="amt">5</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>0x7733…ab02 ↗</td></tr>
            <tr><td className="mono">08 May</td><td>EEX-EU</td><td className="amt">1,000 EUA</td><td className="amt">2.50</td><td className="amt">8</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>0x5e91…1144 ↗</td></tr>
            <tr><td className="mono">07 May</td><td>EEX-EU</td><td className="amt">1,000 EUA</td><td className="amt">2.47</td><td className="amt">6</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>0xb209…d701 ↗</td></tr>
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

// =============== 3 · COMPLIANCE REGISTRY (KYC) ===============

function KYC() {
  return (
    <Frame active="kyc">
      <PageHead
        eyebrow="ComplianceRegistry.sol · 0x5f3a…8b12"
        title="Compliance registry"
        sub="Account holders allowed to trade, hold, or surrender EUAs. Verified, frozen, or pending."
        right={<button style={{padding:'10px 16px',background:'#1a4a35',color:'#fff',border:0,borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Register account</button>}
      />
      <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
        <input placeholder="Search ENS or 0x address…" style={{flex:1,padding:'8px 12px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:13,fontFamily:'IBM Plex Sans'}}/>
        <select style={{padding:'8px 12px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:13,background:'#fff'}}>
          <option>All statuses</option><option>Verified</option><option>Frozen</option><option>Pending</option>
        </select>
        <select style={{padding:'8px 12px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:13,background:'#fff'}}>
          <option>All countries</option><option>DE</option><option>FR</option><option>NL</option>
        </select>
        <select style={{padding:'8px 12px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:13,background:'#fff'}}>
          <option>All types</option><option>Emitter</option><option>Buyer</option>
        </select>
      </div>
      <div className="panel">
        <div className="ph"><h3>Accounts · 14</h3><span className="meta">12 verified · 1 frozen · 1 pending</span></div>
        <table>
          <thead><tr><th>ENS / address</th><th>Country</th><th>Type</th><th>Holdings</th><th>Status</th><th>Registered</th><th></th></tr></thead>
          <tbody>
            {[
              ['company-a.eth','DE','Emitter','1,000 EUA · 2,500 EURS','verified','12 Mar 2026'],
              ['company-b.eth','FR','Buyer','— · 5,000 EURS','verified','12 Mar 2026'],
              ['company-c.eth','NL','Emitter','280 EUA · 0 EURS','frozen','15 Mar 2026'],
              ['company-d.eth','SE','Both','420 EUA · 1,200 EURS','verified','22 Mar 2026'],
              ['company-e.eth','IT','Emitter','680 EUA · 2,400 EURS','verified','01 Apr 2026'],
              ['company-f.eth','PL','Emitter','1,500 EUA · 0 EURS','verified','08 Apr 2026'],
              ['company-g.eth','ES','Buyer','— · 8,000 EURS','verified','11 Apr 2026'],
              ['0x9f2c…4a1b','—','—','—','pending','14 May 2026 · 14h ago'],
            ].map((r,i) => (
              <tr key={i}>
                <td><span className="ens">{r[0]}</span></td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td className="mono" style={{fontSize:11,color:'#4a4740'}}>{r[3]}</td>
                <td>{r[4]==='verified' && <span style={{display:'inline-flex',gap:4,alignItems:'center',padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Verified</span>}
                  {r[4]==='frozen' && <span style={{display:'inline-flex',gap:4,alignItems:'center',padding:'2px 8px',background:'#fef2f2',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:3,fontSize:11,fontWeight:500}}>✗ Frozen</span>}
                  {r[4]==='pending' && <span style={{display:'inline-flex',gap:4,alignItems:'center',padding:'2px 8px',background:'#fffbeb',color:'#92400e',border:'1px solid #fde68a',borderRadius:3,fontSize:11,fontWeight:500}}>● Pending</span>}
                </td>
                <td className="mono" style={{fontSize:11,color:'#6b6860'}}>{r[5]}</td>
                <td style={{textAlign:'right'}}>
                  {r[4]==='verified' && <button style={{padding:'4px 10px',fontSize:11,background:'#fff',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:3,cursor:'pointer'}}>Freeze</button>}
                  {r[4]==='frozen' && <button style={{padding:'4px 10px',fontSize:11,background:'#fff',color:'#1a4a35',border:'1px solid #bbf7d0',borderRadius:3,cursor:'pointer'}}>Unfreeze</button>}
                  {r[4]==='pending' && <button style={{padding:'4px 10px',fontSize:11,background:'#1a4a35',color:'#fff',border:0,borderRadius:3,cursor:'pointer'}}>Approve</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

// =============== 4 · LIVE TRADE FEED (compact reference) ===============

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

function LiveFeed() {
  return (
    <Frame active="live">
      <PageHead
        eyebrow={<span style={{display:'inline-flex',gap:8,alignItems:'center'}}><span className="live-dot"/> Streaming · 250ms</span>}
        title="Live trade feed"
        sub="Every Swap event on CarbonDEX.sol, surfaced in order. Click a row for tx detail."
        right={<button style={{padding:'14px 22px',background:'#b91c1c',color:'#fff',border:0,borderRadius:4,fontFamily:'IBM Plex Sans',fontSize:13,fontWeight:600,letterSpacing:'0.12em',cursor:'pointer',boxShadow:'0 8px 22px rgba(185,28,28,0.25)'}}>■ PAUSE TRADING</button>}
      />
      <div className="stats">
        <div className="stat"><div className="l">Spot price</div><div className="v">2.50 <small>EURS/EUA</small></div></div>
        <div className="stat"><div className="l">Volume 24h</div><div className="v">12,420 <small>EUA</small></div></div>
        <div className="stat"><div className="l">Active wallets</div><div className="v">12</div></div>
        <div className="stat green"><div className="l">DEX status</div><div className="v" style={{fontSize:18,paddingTop:6}}>● Active</div></div>
      </div>
      <div className="panel">
        <div className="ph"><h3>Trades · last 9 of 47 today</h3><span className="meta">streaming</span></div>
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
    </Frame>
  );
}

// =============== 5 · SURRENDER & RECONCILIATION ===============

function Surrender() {
  return (
    <Frame active="surrender">
      <PageHead
        eyebrow="Compliance year 2025 · deadline 30 Apr 2026"
        title="Surrender & reconciliation"
        sub="One EUA must be surrendered per tonne emitted. Shortfall = €100/tonne penalty + still owe the EUAs."
        right={<button style={{padding:'10px 16px',background:'#fff',color:'#1a4a35',border:'1px solid #1a4a35',borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>↓ Export reconciliation CSV</button>}
      />
      <div className="stats">
        <div className="stat"><div className="l">Verified emissions 2025</div><div className="v">8,420 <small>tCO₂e</small></div></div>
        <div className="stat green"><div className="l">Surrendered on time</div><div className="v">8,140 <small>EUA</small></div></div>
        <div className="stat" style={{background:'#fef2f2',borderColor:'#fecaca'}}><div className="l" style={{color:'#b91c1c'}}>Shortfall</div><div className="v" style={{color:'#b91c1c'}}>280 <small>EUA</small></div></div>
        <div className="stat" style={{background:'#fffbeb',borderColor:'#fde68a'}}><div className="l" style={{color:'#92400e'}}>Penalty owed</div><div className="v" style={{color:'#92400e'}}>€28,000</div></div>
      </div>
      <div className="panel" style={{marginBottom:14}}>
        <div className="ph"><h3>Compliance status by account</h3><span className="meta">12 accounts · 11 compliant · 1 short</span></div>
        <table>
          <thead><tr><th>Account</th><th style={{textAlign:'right'}}>Emissions</th><th style={{textAlign:'right'}}>Surrendered</th><th style={{textAlign:'right'}}>Position</th><th>Status</th><th></th></tr></thead>
          <tbody>
            <tr><td><span className="ens">company-a.eth</span></td><td className="amt">2,450</td><td className="amt">2,450</td><td className="amt" style={{color:'#166534'}}>0</td><td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Compliant</span></td><td></td></tr>
            <tr><td><span className="ens">company-b.eth</span></td><td className="amt">1,200</td><td className="amt">1,200</td><td className="amt" style={{color:'#166534'}}>0</td><td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Compliant</span></td><td></td></tr>
            <tr style={{background:'#fef2f2'}}><td><span className="ens">company-c.eth</span></td><td className="amt">800</td><td className="amt">520</td><td className="amt" style={{color:'#b91c1c',fontWeight:600}}>−280</td><td><span style={{padding:'2px 8px',background:'#fef2f2',color:'#b91c1c',border:'1px solid #fecaca',borderRadius:3,fontSize:11,fontWeight:500}}>⚠ Short</span></td><td style={{textAlign:'right'}}><button style={{padding:'4px 10px',fontSize:11,background:'#b91c1c',color:'#fff',border:0,borderRadius:3,cursor:'pointer'}}>Open case</button></td></tr>
            <tr><td><span className="ens">company-d.eth</span></td><td className="amt">920</td><td className="amt">920</td><td className="amt" style={{color:'#166534'}}>0</td><td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Compliant</span></td><td></td></tr>
            <tr><td><span className="ens">company-e.eth</span></td><td className="amt">1,400</td><td className="amt">1,420</td><td className="amt" style={{color:'#6b6860'}}>+20 banked</td><td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Compliant</span></td><td></td></tr>
            <tr><td><span className="ens">company-f.eth</span></td><td className="amt">1,650</td><td className="amt">1,630</td><td className="amt" style={{color:'#166534'}}>0</td><td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Compliant</span></td><td></td></tr>
          </tbody>
        </table>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="panel">
          <div className="ph"><h3>Maritime phase-in · 2025</h3><span className="meta">70% obligation</span></div>
          <div style={{padding:18,fontSize:12,color:'#4a4740',lineHeight:1.6}}>
            Shipping companies cover only 70% of 2025 emissions; ramps to 100% in 2026. The un-surrendered 30% is cancelled, not bought. <span style={{color:'#6b6860'}}>(In 2024 the rate was 40%, with 54.2M EUA cancelled across the sector EU-wide.)</span>
            <div style={{marginTop:14,padding:12,background:'#fafaf6',border:'1px solid #d8d4c8',borderRadius:4}}>
              <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span>Verified maritime emissions</span><span className="mono">412 tCO₂e</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}><span>Required surrender (70%)</span><span className="mono">288 EUA</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'2px 0',borderTop:'1px solid #d8d4c8',marginTop:6,paddingTop:6,fontWeight:500}}><span>To cancel</span><span className="mono">124 EUA</span></div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="ph"><h3>Banking · carry-forward</h3><span className="meta">excess EUAs banked into 2026</span></div>
          <table>
            <tbody>
              <tr><td><span className="ens">company-e.eth</span></td><td className="amt">+20 EUA</td></tr>
              <tr><td><span className="ens">company-g.eth</span></td><td className="amt">+340 EUA</td></tr>
              <tr><td><span className="ens">company-a.eth</span></td><td className="amt">+150 EUA</td></tr>
              <tr><td colSpan={2} style={{borderTop:'2px solid #d8d4c8',background:'#fafaf6'}}><b>Banked total</b><span style={{float:'right'}} className="mono"><b>510 EUA</b></span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </Frame>
  );
}

// =============== 6 · AUDIT LOG ===============

function Audit() {
  return (
    <Frame active="audit">
      <PageHead
        eyebrow="Regulator.sol · RegulatoryAction events"
        title="Audit log"
        sub="Every regulator action — minted, registered, frozen, paused — recorded immutably on-chain."
        right={
          <div style={{display:'flex',gap:8}}>
            <button style={{padding:'8px 14px',background:'#fff',color:'#4a4740',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,cursor:'pointer'}}>↓ Export CSV</button>
            <button style={{padding:'8px 14px',background:'#fff',color:'#4a4740',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,cursor:'pointer'}}>⊞ Filter</button>
          </div>
        }
      />
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['All actions','Minted','Allocated','Registered','Frozen','Unfrozen','Paused','Cancelled'].map((t,i)=> (
          <button key={i} style={{padding:'6px 12px',fontSize:12,background:i===0?'#1a4a35':'#fff',color:i===0?'#fff':'#4a4740',border:'1px solid '+(i===0?'#1a4a35':'#d8d4c8'),borderRadius:100,cursor:'pointer'}}>{t}</button>
        ))}
      </div>
      <div className="panel">
        <div className="ph"><h3>Events · 138 total · 6 today</h3><span className="meta">filterable · exportable · publicly verifiable</span></div>
        <table>
          <thead><tr><th>Time UTC</th><th>Action</th><th>Target</th><th>Detail</th><th>Block</th><th>Tx</th></tr></thead>
          <tbody>
            {[
              ['14:32:07','minted','company-a.eth','1,000 EUA · Energy 2024 · DE','18,294,441','0x3f7a…b291'],
              ['13:55:01','registered','company-b.eth','Buyer · FR','18,294,402','0xc442…ee19'],
              ['13:40:18','frozen','company-c.eth','Suspicious trading pattern','18,294,199','0xb2c1…7f88'],
              ['13:18:33','allocated','Q2 batch · 8 installations','3,200 EUA total','18,294,012','0x9171…44ea'],
              ['12:05:00','unpaused','DEX','Resumed after 5-min drill','18,293,444','0x7c81…2d10'],
              ['12:00:00','paused','DEX','5-min emergency drill','18,293,222','0x4a55…b809'],
              ['09:14:22','minted','company-f.eth','1,500 EUA · Industry 2024 · PL','18,290,144','0x21f0…cc31'],
              ['08:55:09','registered','company-g.eth','Buyer · ES','18,290,001','0x0e92…aa44'],
              ['08:30:00','allocated','company-d.eth','420 EUA · annual free allocation','18,289,800','0xff21…1c19'],
              ['—','—','—','—','—','—'],
            ].map((r,i) => {
              const colors = {minted:'#166534',registered:'#1b4f8a',frozen:'#b91c1c',unfrozen:'#166534',paused:'#b91c1c',unpaused:'#166534',allocated:'#166534',cancelled:'#92400e'};
              return (
                <tr key={i}>
                  <td className="mono">{r[0]}</td>
                  <td><span style={{color:colors[r[1]]||'#4a4740',fontWeight:500,textTransform:'capitalize'}}>● {r[1]}</span></td>
                  <td>{r[2].includes('.eth')?<span className="ens">{r[2]}</span>:r[2]}</td>
                  <td style={{color:'#4a4740'}}>{r[3]}</td>
                  <td className="mono" style={{fontSize:11,color:'#6b6860'}}>{r[4]}</td>
                  <td className="mono" style={{fontSize:11,color:'#6b6860'}}>{r[5]} ↗</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

// =============== 7 · EMERGENCY CONTROLS (PAUSE) ===============

function Emergency() {
  return (
    <Frame active="halt">
      <PageHead
        eyebrow="CarbonDEX.sol · emergencyPause()"
        title="Emergency controls"
        sub="Halt trading, freeze accounts, cancel allowances. Use only under formal authority. All actions logged."
      />
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:14}}>
        <div>
          <div className="panel" style={{marginBottom:14,border:'1px solid #fecaca',background:'#fef2f2'}}>
            <div className="ph" style={{borderBottomColor:'#fecaca'}}>
              <h3 style={{color:'#b91c1c'}}>Pause DEX</h3>
              <span className="meta" style={{color:'#991b1b'}}>halts all swaps · reversible by unpause</span>
            </div>
            <div style={{padding:22}}>
              <p style={{fontSize:13,color:'#4a4740',lineHeight:1.6,marginBottom:14}}>Pausing halts every swap on CarbonDEX. In-flight transactions revert. The pause is visible to every wallet on every portal in real time, with no delay.</p>
              <div style={{padding:14,background:'#fff',border:'1px solid #fecaca',borderRadius:4,marginBottom:14,fontSize:12,color:'#4a4740'}}>
                <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}><span style={{color:'#6b6860'}}>Action</span><span className="mono">emergencyPause()</span></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}><span style={{color:'#6b6860'}}>Contract</span><span className="mono">CarbonDEX.sol</span></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}><span style={{color:'#6b6860'}}>Last paused</span><span className="mono">14 May · 12:00 UTC (5-min drill)</span></div>
                <div style={{display:'flex',justifyContent:'space-between',padding:'3px 0'}}><span style={{color:'#6b6860'}}>Total pauses</span><span className="mono">3 (lifetime)</span></div>
              </div>
              <button style={{padding:'14px 22px',background:'#b91c1c',color:'#fff',border:0,borderRadius:4,fontSize:14,fontWeight:600,letterSpacing:'0.12em',cursor:'pointer',boxShadow:'0 8px 22px rgba(185,28,28,0.25)'}}>■ PAUSE TRADING</button>
              <span style={{marginLeft:14,fontSize:12,color:'#6b6860'}}>Two-step confirm · type PAUSE</span>
            </div>
          </div>
          <div className="panel">
            <div className="ph"><h3>Recent halts</h3><span className="meta">lifetime</span></div>
            <table>
              <thead><tr><th>When</th><th>Type</th><th>Duration</th><th>Reason</th><th>Operator</th></tr></thead>
              <tbody>
                <tr><td className="mono">14 May 12:00</td><td>Drill</td><td className="amt">5m 00s</td><td>Quarterly drill</td><td><span className="ens">eu-ets-authority.eth</span></td></tr>
                <tr><td className="mono">02 Apr 09:14</td><td>Incident</td><td className="amt">22m 12s</td><td>Flash-trade pattern, company-c.eth</td><td><span className="ens">eu-ets-authority.eth</span></td></tr>
                <tr><td className="mono">17 Feb 14:00</td><td>Drill</td><td className="amt">5m 00s</td><td>Quarterly drill</td><td><span className="ens">eu-ets-authority.eth</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="panel" style={{marginBottom:14}}>
            <div className="ph"><h3>Freeze account</h3><span className="meta">blocks transfers</span></div>
            <div style={{padding:18,fontSize:12,color:'#4a4740'}}>
              <p style={{lineHeight:1.55,marginBottom:12}}>Prevents the target from sending or receiving EUA / EURS. Reversible.</p>
              <input placeholder="ENS or 0x address" style={{width:'100%',padding:'8px 10px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,marginBottom:8,fontFamily:'IBM Plex Mono'}}/>
              <textarea placeholder="Reason (logged on-chain)" style={{width:'100%',padding:'8px 10px',border:'1px solid #d8d4c8',borderRadius:4,fontSize:12,marginBottom:8,minHeight:60,fontFamily:'IBM Plex Sans',resize:'vertical'}}/>
              <button style={{width:'100%',padding:'10px',background:'#fff',color:'#b91c1c',border:'1px solid #b91c1c',borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>Freeze account →</button>
            </div>
          </div>
          <div className="panel">
            <div className="ph"><h3>Cancel allowances</h3><span className="meta">irreversible</span></div>
            <div style={{padding:18,fontSize:12,color:'#4a4740'}}>
              <p style={{lineHeight:1.55,marginBottom:12}}>Removes EUAs from circulation. Used for MSR adjustments and maritime phase-in.</p>
              <div style={{padding:10,background:'#fffbeb',border:'1px solid #fde68a',borderRadius:4,fontSize:11,color:'#92400e',lineHeight:1.5,marginBottom:10}}>
                ⚠ Cancellations cannot be undone. Most cancellations are scheduled (MSR, phase-in) and run automatically.
              </div>
              <button style={{width:'100%',padding:'10px',background:'#fff',color:'#92400e',border:'1px solid #fde68a',borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>Open cancellation →</button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// =============== 8 · PERMISSIONS / AUTHORITY ===============

function Permissions() {
  return (
    <Frame active="perm">
      <PageHead
        eyebrow="Regulator.sol · access control"
        title="Permissions"
        sub="Who can mint, freeze, pause, cancel. Built for multi-sig governance — a single wallet today, a council tomorrow."
        right={<button style={{padding:'10px 16px',background:'#1a4a35',color:'#fff',border:0,borderRadius:4,fontSize:13,fontWeight:500,cursor:'pointer'}}>+ Add signer</button>}
      />
      <div className="panel" style={{marginBottom:14}}>
        <div className="ph"><h3>Authority signers · 1 of 1</h3><span className="meta">single-key today · multi-sig planned for v2</span></div>
        <table>
          <thead><tr><th>Signer</th><th>Role</th><th>Added</th><th>Last action</th><th></th></tr></thead>
          <tbody>
            <tr><td><span className="ens">eu-ets-authority.eth</span></td><td>Admin · all permissions</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>01 Jan 2026 (genesis)</td><td className="mono" style={{fontSize:11,color:'#6b6860'}}>14:32 UTC · minted</td><td style={{textAlign:'right',color:'#6b6860',fontSize:11}}>(only signer)</td></tr>
          </tbody>
        </table>
      </div>
      <div className="panel" style={{marginBottom:14}}>
        <div className="ph"><h3>Permission matrix</h3><span className="meta">per-role capabilities</span></div>
        <table>
          <thead><tr><th>Capability</th><th style={{textAlign:'center'}}>Admin</th><th style={{textAlign:'center'}}>Issuer</th><th style={{textAlign:'center'}}>Compliance officer</th><th style={{textAlign:'center'}}>Auditor (read)</th></tr></thead>
          <tbody>
            {[
              ['Mint EUAs',true,true,false,false],
              ['Upload free allocation',true,true,false,false],
              ['Approve KYC',true,false,true,false],
              ['Freeze account',true,false,true,false],
              ['Pause DEX',true,false,false,false],
              ['Cancel allowances',true,false,false,false],
              ['Read audit log',true,true,true,true],
              ['Export CSV',true,true,true,true],
            ].map((r,i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                {[1,2,3,4].map(c => <td key={c} style={{textAlign:'center',color:r[c]?'#166534':'#d8d4c8',fontWeight:500}}>{r[c]?'✓':'—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="ph"><h3>Roadmap · multi-sig governance</h3><span className="meta">v2 · post-MVP</span></div>
        <div style={{padding:18,fontSize:13,color:'#4a4740',lineHeight:1.6}}>
          In production, "the regulator" is many actors. The contract supports an N-of-M multi-sig with role-keyed signers per Member State (DEHSt, Swedish Energy Agency, Dutch Emissions Authority, etc.) plus the Commission. For the demo, all roles collapse into <span className="ens">eu-ets-authority.eth</span>.
        </div>
      </div>
    </Frame>
  );
}

// =============== 9 · SETTINGS ===============

function Settings() {
  return (
    <Frame active="set">
      <PageHead
        eyebrow="Authority workspace"
        title="Settings"
        sub="Network, contracts, fees. Mostly read-only — defaults are set by deploy."
      />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div className="panel">
          <div className="ph"><h3>Network</h3></div>
          <div style={{padding:18,fontSize:13,color:'#4a4740'}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>Chain</span><span className="mono">Base Sepolia · 84532</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>RPC</span><span className="mono" style={{fontSize:11}}>https://sepolia.base.org</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>Block explorer</span><span className="mono" style={{fontSize:11}}>basescan.org/sepolia ↗</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}><span style={{color:'#6b6860'}}>Current block</span><span className="mono">18,294,441</span></div>
          </div>
        </div>
        <div className="panel">
          <div className="ph"><h3>Fees & limits</h3></div>
          <div style={{padding:18,fontSize:13,color:'#4a4740'}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>DEX swap fee</span><span className="mono">0.30%</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>Slippage default</span><span className="mono">1.0%</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #ededee'}}><span style={{color:'#6b6860'}}>Penalty (€/tCO₂)</span><span className="mono">€100.00</span></div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0'}}><span style={{color:'#6b6860'}}>Cap (2026)</span><span className="mono">6,000 EUA · demo</span></div>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="ph"><h3>Contracts · Sourcify verified</h3><span className="meta">all on Base Sepolia</span></div>
        <table>
          <thead><tr><th>Contract</th><th>Address</th><th>Deployed</th><th>Verified</th><th></th></tr></thead>
          <tbody>
            {[
              ['CarbonCredit.sol','0x1a2b…3c4d','01 Jan 2026'],
              ['CarbonDEX.sol','0x8e21…f00c','01 Jan 2026'],
              ['ComplianceRegistry.sol','0x5f3a…8b12','01 Jan 2026'],
              ['Retirement.sol','0xb812…6611','01 Jan 2026'],
              ['Regulator.sol','0xc5e2…ff09','01 Jan 2026'],
            ].map((r,i) => (
              <tr key={i}>
                <td><b>{r[0]}</b></td>
                <td className="mono" style={{fontSize:12}}>{r[1]}</td>
                <td className="mono" style={{fontSize:11,color:'#6b6860'}}>{r[2]}</td>
                <td><span style={{padding:'2px 8px',background:'#f0fdf4',color:'#166534',border:'1px solid #bbf7d0',borderRadius:3,fontSize:11,fontWeight:500}}>✓ Sourcify</span></td>
                <td style={{textAlign:'right'}}><a style={{fontSize:11,color:'#1a4a35',textDecoration:'none'}}>View on Sourcify ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

// =============== CANVAS ASSEMBLY ===============

function App() {
  return (
    <DesignCanvas>
      <DCSection id="orient" title="Orientation" subtitle="What we collapsed, and what we kept honest">
        <DCArtboard id="cheat" label="Reality cheat sheet" width={1280} height={1100}><CheatSheet/></DCArtboard>
      </DCSection>
      <DCSection id="ops" title="Operations" subtitle="The day-to-day regulator workspace">
        <DCArtboard id="dash" label="01 · Dashboard" width={1280} height={900}><Dashboard/></DCArtboard>
        <DCArtboard id="issue" label="02 · Issuance" width={1280} height={900}><Issuance/></DCArtboard>
        <DCArtboard id="kyc" label="03 · Compliance registry" width={1280} height={900}><KYC/></DCArtboard>
        <DCArtboard id="live" label="04 · Live trade feed" width={1280} height={900}><LiveFeed/></DCArtboard>
        <DCArtboard id="surrender" label="05 · Surrender & reconciliation" width={1280} height={900}><Surrender/></DCArtboard>
        <DCArtboard id="audit" label="06 · Audit log" width={1280} height={900}><Audit/></DCArtboard>
      </DCSection>
      <DCSection id="control" title="Authority controls" subtitle="The escalation path — pause, freeze, govern">
        <DCArtboard id="halt" label="07 · Emergency controls" width={1280} height={900}><Emergency/></DCArtboard>
        <DCArtboard id="perm" label="08 · Permissions" width={1280} height={900}><Permissions/></DCArtboard>
        <DCArtboard id="set" label="09 · Settings" width={1280} height={900}><Settings/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
