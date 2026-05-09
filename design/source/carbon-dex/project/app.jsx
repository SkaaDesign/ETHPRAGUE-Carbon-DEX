// Main App: shared state, routing, role switching, live tx flow

const {
  COMPANY_SEED, CURRENT_USER, REGULATOR_USER,
  INITIAL_PORTFOLIO, INITIAL_POOL, INITIAL_BALANCES,
  INITIAL_TRADES, INITIAL_AUDIT, INITIAL_RETIREMENTS,
  makeHash, shortHash,
} = window.SEED;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "role": "company",
  "kyc": "verified"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const role = tweaks.role; // 'company' | 'regulator' | 'public'
  const kyc = tweaks.kyc;   // 'verified' | 'pending' | 'frozen'

  // Shared world state
  const [companies, setCompanies] = React.useState(COMPANY_SEED);
  const [pool, setPool] = React.useState(INITIAL_POOL);
  const [balances, setBalances] = React.useState(INITIAL_BALANCES);
  const [portfolio, setPortfolio] = React.useState(INITIAL_PORTFOLIO);
  const [trades, setTrades] = React.useState(INITIAL_TRADES);
  const [audit, setAudit] = React.useState(INITIAL_AUDIT);
  const [retirements, setRetirements] = React.useState(INITIAL_RETIREMENTS);
  const [paused, setPaused] = React.useState(false);
  const [pausedAt, setPausedAt] = React.useState(null);
  const [pausedBlock, setPausedBlock] = React.useState(null);
  const [currentBlock, setCurrentBlock] = React.useState(18294441);
  const [lastSwap, setLastSwap] = React.useState(null);
  const [lastTradeIsNew, setLastTradeIsNew] = React.useState(false);

  // Per-portal page state
  const [companyPage, setCompanyPage] = React.useState("dashboard");
  const [regulatorPage, setRegulatorPage] = React.useState("overview");
  const [publicTab, setPublicTab] = React.useState("market");
  const [retireSelect, setRetireSelect] = React.useState(null);
  const [certId, setCertId] = React.useState(null);

  // ----- Live block ticker -----
  React.useEffect(() => {
    const id = setInterval(() => setCurrentBlock(b => b + 1), 4000);
    return () => clearInterval(id);
  }, []);

  // ----- Synthetic live trade injector (when not paused) -----
  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      // 1 in 3 ticks emit a new trade
      if (Math.random() > 0.45) {
        injectSyntheticTrade();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [paused, pool]);

  function injectSyntheticTrade() {
    const buying = Math.random() > 0.5;
    const fromIdx = Math.floor(Math.random() * COMPANY_SEED.length);
    let toIdx = Math.floor(Math.random() * COMPANY_SEED.length);
    if (toIdx === fromIdx) toIdx = (toIdx + 1) % COMPANY_SEED.length;
    const eua = Math.round(50 + Math.random() * 600);
    const reserveIn = buying ? pool.eurs : pool.eua;
    const reserveOut = buying ? pool.eua : pool.eurs;
    const eursPerEua = pool.eurs / pool.eua;
    const eurs = Math.round(eua * eursPerEua * 100) / 100;
    let newPool;
    if (buying) {
      newPool = { eurs: pool.eurs + eurs, eua: pool.eua - eua };
    } else {
      newPool = { eurs: pool.eurs - eurs, eua: pool.eua + eua };
    }
    setPool(newPool);
    const newPrice = Math.round((newPool.eurs / newPool.eua) * 1000) / 1000;
    const tx = makeHash(Date.now() % 100000);
    const trade = {
      id: Date.now(),
      block: currentBlock + 1,
      time: new Date(),
      from: COMPANY_SEED[fromIdx].ens,
      to: COMPANY_SEED[toIdx].ens,
      eua,
      eurs,
      price: newPrice,
      tx,
      direction: buying ? "buy" : "sell",
    };
    setTrades(t => [trade, ...t].slice(0, 100));
    setLastTradeIsNew(true);
    setTimeout(() => setLastTradeIsNew(false), 700);
  }

  // ----- User actions -----
  function userSwap({ direction, amtIn, amtOut, price }) {
    const tx = makeHash(Date.now() % 90000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);

    // adjust pool
    if (direction === "eursToEua") {
      setPool(p => ({ eurs: p.eurs + amtIn, eua: p.eua - amtOut }));
      setBalances(b => ({ eurs: b.eurs - amtIn, eua: b.eua + Math.round(amtOut) }));
      // add to portfolio (latest batch acquired)
      setPortfolio(p => {
        const exists = p.find(b => b.tokenId === "001");
        if (exists) {
          return p.map(b => b.tokenId === "001" ? { ...b, balance: b.balance + Math.round(amtOut) } : b);
        }
        return [...p, { tokenId: "001", vintage: 2024, sector: "Energy", origin: "DE", balance: Math.round(amtOut) }];
      });
    } else {
      setPool(p => ({ eurs: p.eurs - amtOut, eua: p.eua + amtIn }));
      setBalances(b => ({ eurs: b.eurs + amtOut, eua: b.eua - amtIn }));
      setPortfolio(p => {
        // decrement first batch
        const next = [...p];
        let remaining = amtIn;
        for (let i = 0; i < next.length && remaining > 0; i++) {
          const take = Math.min(next[i].balance, remaining);
          next[i] = { ...next[i], balance: next[i].balance - take };
          remaining -= take;
        }
        return next.filter(b => b.balance > 0);
      });
    }

    // Add trade to feed
    const trade = {
      id: Date.now(),
      block,
      time: new Date(),
      from: direction === "euaToEurs" ? CURRENT_USER.ens : COMPANY_SEED[0].ens,
      to: direction === "eursToEua" ? CURRENT_USER.ens : COMPANY_SEED[0].ens,
      eua: direction === "eursToEua" ? Math.round(amtOut) : amtIn,
      eurs: direction === "eursToEua" ? amtIn : Math.round(amtOut * 100) / 100,
      price: Math.round(price * 1000) / 1000,
      tx,
      direction: direction === "eursToEua" ? "buy" : "sell",
    };
    setTrades(t => [trade, ...t].slice(0, 100));
    setLastTradeIsNew(true);
    setTimeout(() => setLastTradeIsNew(false), 700);

    setLastSwap({ direction, amtIn, amtOut, price, tx, block, time: new Date() });
    return tx;
  }

  function userRetire({ tokenId, amount, beneficiary, reason }) {
    const batch = portfolio.find(b => b.tokenId === tokenId);
    if (!batch) return;
    const tx = makeHash(Date.now() % 70000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setPortfolio(p => p.map(b => b.tokenId === tokenId
      ? { ...b, balance: b.balance - amount }
      : b
    ).filter(b => b.balance > 0));
    setBalances(b => ({ ...b, eua: b.eua - amount }));

    const id = retirements.length + 1;
    const r = {
      id,
      time: new Date(),
      block,
      tx,
      by: CURRENT_USER.ens,
      amount,
      sector: batch.sector,
      vintage: batch.vintage,
      origin: batch.origin,
      tokenId,
      beneficiary,
      reason,
    };
    setRetirements(rs => [r, ...rs]);

    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Retired", target: CURRENT_USER.ens,
      detail: `${fmtNum(amount)} EUA · ${batch.sector} · ${batch.vintage}`,
      by: CURRENT_USER.ens,
    }, ...a]);
    return id;
  }

  function regulatorMint({ recipient, tokenId, amount, vintage, sector, origin, methodology }) {
    const tx = makeHash(Date.now() % 60000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    // If recipient is current user, increment portfolio
    if (recipient === CURRENT_USER.ens) {
      setPortfolio(p => {
        const exists = p.find(b => b.tokenId === tokenId);
        if (exists) {
          return p.map(b => b.tokenId === tokenId ? { ...b, balance: b.balance + amount } : b);
        }
        return [...p, { tokenId, vintage, sector, origin, balance: amount }];
      });
      setBalances(b => ({ ...b, eua: b.eua + amount }));
    }
    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Minted", target: recipient,
      detail: `${fmtNum(amount)} EUA · ${sector} · ${vintage}`,
      by: REGULATOR_USER.ens,
    }, ...a]);
    return tx;
  }

  function regulatorPause() {
    const tx = makeHash(Date.now() % 50000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setPaused(true);
    const t = new Date();
    setPausedAt(t);
    setPausedBlock(block);
    setAudit(a => [{
      time: t, block, tx,
      action: "Paused", target: "DEX",
      detail: "Emergency halt — all trading suspended",
      by: REGULATOR_USER.ens,
    }, ...a]);
  }

  function regulatorUnpause() {
    const tx = makeHash(Date.now() % 50000 + 1);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setPaused(false);
    setPausedAt(null);
    setPausedBlock(null);
    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Unpaused", target: "DEX",
      detail: "Trading resumed by EU ETS Authority",
      by: REGULATOR_USER.ens,
    }, ...a]);
  }

  function regulatorFreeze(ens) {
    const tx = makeHash(Date.now() % 40000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setCompanies(cs => cs.map(c => c.ens === ens ? { ...c, status: "frozen" } : c));
    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Frozen", target: ens,
      detail: "Trading suspended by regulator",
      by: REGULATOR_USER.ens,
    }, ...a]);
    // If freezing current user, cascade KYC
    if (ens === CURRENT_USER.ens) setTweak({ kyc: "frozen" });
  }

  function regulatorUnfreeze(ens) {
    const tx = makeHash(Date.now() % 40000 + 7);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setCompanies(cs => cs.map(c => c.ens === ens ? { ...c, status: "verified" } : c));
    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Unfrozen", target: ens,
      detail: "Trading rights restored",
      by: REGULATOR_USER.ens,
    }, ...a]);
    if (ens === CURRENT_USER.ens) setTweak({ kyc: "verified" });
  }

  function regulatorRegister({ ens, addr, country, type }) {
    const tx = makeHash(Date.now() % 30000);
    const block = currentBlock + 1;
    setCurrentBlock(b => b + 1);
    setCompanies(cs => [...cs, { ens: ens || addr.slice(0, 10) + "…", addr, country, type, status: "verified" }]);
    setAudit(a => [{
      time: new Date(), block, tx,
      action: "Registered", target: ens || addr.slice(0, 10) + "…",
      detail: `${type}, ${country}`,
      by: REGULATOR_USER.ens,
    }, ...a]);
  }

  // ----- Synthesize state for child portals -----
  const sharedState = {
    companies, pool, balances, portfolio, trades, audit, retirements,
    paused, pausedAt, pausedBlock, currentBlock, kyc,
    lastTradeIsNew,
  };

  const goCompany = (page, arg) => {
    if (page === "retire" && arg) setRetireSelect(arg);
    if (page === "retire-cert" && arg !== undefined) setCertId(arg);
    setCompanyPage(page);
  };
  goCompany.current = companyPage;

  // ----- Render based on role -----
  function renderPortal() {
    if (role === "company") {
      // Override displayed page based on KYC status
      if (kyc === "pending") return <CompanyKycGate onViewPublic={() => setTweak({ role: "public" })} />;
      if (kyc === "frozen") return <CompanyFrozen />;
      switch (companyPage) {
        case "dashboard":   return <CompanyDashboard state={sharedState} go={goCompany} />;
        case "trade":       return <CompanyTrade state={sharedState} swap={userSwap} go={goCompany} lastSwap={lastSwap} />;
        case "trade-receipt": return <CompanyTradeReceipt lastSwap={lastSwap} go={goCompany} />;
        case "portfolio":   return <CompanyPortfolio state={sharedState} go={goCompany} />;
        case "retire":      return <CompanyRetire state={sharedState} retire={userRetire} go={goCompany} preselect={retireSelect} />;
        case "retire-cert": return <CompanyRetireCert state={sharedState} certId={certId} go={goCompany} />;
        default:            return <CompanyDashboard state={sharedState} go={goCompany} />;
      }
    }
    if (role === "regulator") {
      const inner = (() => {
        switch (regulatorPage) {
          case "overview":  return <RegulatorOverview state={sharedState} setPage={setRegulatorPage} />;
          case "mint":      return <RegulatorMint state={sharedState} mint={regulatorMint} setPage={setRegulatorPage} />;
          case "kyc":       return <RegulatorKyc state={sharedState} freeze={regulatorFreeze} unfreeze={regulatorUnfreeze} register={regulatorRegister} />;
          case "feed":      return <RegulatorFeed state={sharedState} pause={regulatorPause} unpause={regulatorUnpause} />;
          case "audit":     return <RegulatorAudit state={sharedState} />;
          default:          return <RegulatorOverview state={sharedState} setPage={setRegulatorPage} />;
        }
      })();
      return <RegulatorShell state={sharedState} page={regulatorPage} setPage={setRegulatorPage}>{inner}</RegulatorShell>;
    }
    // public
    return <PublicShell state={sharedState} tab={publicTab} setTab={setPublicTab} />;
  }

  // KYC-pending companies should not see dashboard, but topbar still renders
  const isCinematic = role === "public";
  return (
    <div className={`app ${isCinematic ? "cinematic" : ""} ${paused ? "paused-mode" : ""}`}>
      <Topbar role={role} paused={paused} currentBlock={currentBlock} />
      {paused && <PausedBanner pausedAt={pausedAt} pausedBlock={pausedBlock} />}
      {role === "company" && kyc === "verified" && companyPage !== "dashboard" && companyPage !== "trade-receipt" && companyPage !== "retire-cert" && (
        null
      )}
      {/* Connect screen is a special intro: only show if user clicks back */}
      {role === "company" && kyc === "verified" ? renderPortal()
        : role === "company" ? renderPortal()
        : renderPortal()}

      <Tweaks tweaks={tweaks} setTweak={setTweak} setCompanyPage={setCompanyPage} setRegulatorPage={setRegulatorPage} setPublicTab={setPublicTab} />
    </div>
  );
}

// ----- Tweaks panel -----
function Tweaks({ tweaks, setTweak, setCompanyPage, setRegulatorPage, setPublicTab }) {
  return (
    <TweaksPanel>
      <TweakSection label="Role">
        <TweakRadio
          label="Portal"
          value={tweaks.role}
          onChange={(v) => {
            setTweak({ role: v });
            if (v === "company") setCompanyPage("dashboard");
            if (v === "regulator") setRegulatorPage("overview");
            if (v === "public") setPublicTab("market");
          }}
          options={[
            { value: "company",   label: "Company" },
            { value: "regulator", label: "Regulator" },
            { value: "public",    label: "Observer" },
          ]}
        />
      </TweakSection>
      {tweaks.role === "company" && (
        <TweakSection label="Current user KYC">
          <TweakRadio
            label="Status"
            value={tweaks.kyc}
            onChange={(v) => setTweak({ kyc: v })}
            options={[
              { value: "verified", label: "Verified" },
              { value: "pending",  label: "Pending" },
              { value: "frozen",   label: "Frozen" },
            ]}
          />
          <p style={{ fontSize: 11, color: "var(--c-text-secondary)", margin: "4px 0 0", lineHeight: 1.45 }}>
            Verified = full access · Pending = KYC gate · Frozen = account frozen
          </p>
        </TweakSection>
      )}
      <TweakSection label="Quick demo">
        <p style={{ fontSize: 11, color: "var(--c-text-secondary)", margin: "0 0 6px", lineHeight: 1.45 }}>
          Switch role to <strong>Regulator</strong> to mint, freeze companies, or hit the big <strong>PAUSE</strong> button — then flip back to Company or Observer to see the cascade.
        </p>
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
