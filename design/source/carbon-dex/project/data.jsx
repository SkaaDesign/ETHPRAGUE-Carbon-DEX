// Seed data: 12 KYC'd companies, 47 trades, portfolio, audit log.
// All mutable state lives in React context — this is initial values only.

const SECTORS = ["Energy", "Industry", "Transport", "Buildings", "Aviation"];
const VINTAGES = [2020, 2021, 2022, 2023, 2024];

const COMPANY_SEED = [
  { ens: "company-a.eth",        addr: "0x1a2b9f47c1de4e8e6b3f2e8c9b1d4a5c3e7f8a91", country: "DE", type: "Emitter", status: "verified" },
  { ens: "company-b.eth",        addr: "0x4d8e7c3a2b1f5e9d6c8a7b4e3f2d1c5b8a9e6d72", country: "FR", type: "Buyer",   status: "verified" },
  { ens: "company-c.eth",        addr: "0x9f2c8d4e1a6b3c7f5d2e8a9b4c6f1d3e5a8c7b2d", country: "NL", type: "Emitter", status: "frozen" },
  { ens: "siemens-energy.eth",   addr: "0x7e3a2c8d9f4b1e5c6a3d8b2f7c9e4a1d5b3f8c92", country: "DE", type: "Emitter", status: "verified" },
  { ens: "totalenergies-fr.eth", addr: "0x2c5d9e1f3a7b8c4d6e2f9a1b3c5d7e8f2a4b6c81", country: "FR", type: "Emitter", status: "verified" },
  { ens: "ryanair.eth",          addr: "0x8b4f1c3d7a2e5b9c8d6f4a1b2c3e7d5f9a8b6c31", country: "IE", type: "Emitter", status: "verified" },
  { ens: "arcelor-mittal.eth",   addr: "0x3d7e9f2a5c1b4d8e6f3a2c9b1d4e7f5a8c2b6d92", country: "LU", type: "Emitter", status: "verified" },
  { ens: "iberdrola-es.eth",     addr: "0x6a2e8c4d9f1b3e7d5a8c2f4b6e1d3a9c7b5f8e42", country: "ES", type: "Emitter", status: "verified" },
  { ens: "enel-it.eth",          addr: "0x4b9d2f7c8e3a1d5f6b2c9e4d7a3b8f1e5c6d9a78", country: "IT", type: "Buyer",   status: "verified" },
  { ens: "shell-nl.eth",         addr: "0x1e7c4f8d3a2b9e5c6d8f1a4b3c7d2e9f5a8b1c63", country: "NL", type: "Emitter", status: "verified" },
  { ens: "fortum-fi.eth",        addr: "0x5c3a8d2f9e1b4c7d6e8f3a2c1b9d4e7f5a8c2b54", country: "FI", type: "Buyer",   status: "verified" },
  { ens: "orsted-dk.eth",        addr: "0x9d4f2e7c8a3b1d5f6c9e4a2b3d7f1c5e8a6b9d27", country: "DK", type: "Emitter", status: "verified" },
];

// The "current user" is company-b.eth (the buyer) — matches brief examples.
const CURRENT_USER = COMPANY_SEED[1];

const REGULATOR_USER = {
  ens: "eu-ets-authority.eth",
  addr: "0x5f3a1c9e7b2d4f8c6a3b9d1e5f7c2a8d4b6e9f12",
};

// Portfolio for current user: matches brief example (#001 Energy 2024 1000, #002 Industry 2023 500)
const INITIAL_PORTFOLIO = [
  { tokenId: "001", vintage: 2024, sector: "Energy",   origin: "DE", balance: 1000 },
  { tokenId: "002", vintage: 2023, sector: "Industry", origin: "FR", balance: 500 },
];

// Pool: 125,000 EURS / 50,000 EUA → 2.50 EURS/EUA spot
const INITIAL_POOL = { eurs: 125000, eua: 50000 };

const INITIAL_BALANCES = { eua: 1000, eurs: 2500 };

// Random-ish but deterministic hash maker
function makeHash(seed) {
  const chars = "0123456789abcdef";
  let s = "0x";
  let n = seed * 9301 + 49297;
  for (let i = 0; i < 64; i++) {
    n = (n * 9301 + 49297) % 233280;
    s += chars[n % 16];
  }
  return s;
}

function shortAddr(a) {
  if (!a) return "";
  return a.slice(0, 6) + "..." + a.slice(-4);
}

function shortHash(h) {
  if (!h) return "";
  return h.slice(0, 6) + "..." + h.slice(-4);
}

// Generate 47 trades over the last ~10 hours, with a believable distribution
function generateInitialTrades() {
  const trades = [];
  const baseBlock = 18294441;
  const now = new Date();
  // start 10 hours ago
  const start = now.getTime() - 10 * 3600 * 1000;
  const rng = (seed) => {
    let n = seed;
    return () => {
      n = (n * 16807) % 2147483647;
      return n / 2147483647;
    };
  };
  const r = rng(42);
  // simulate a basic AMM walk for prices
  let pool = { eurs: 110000, eua: 55000 };
  for (let i = 0; i < 47; i++) {
    const t = start + (i / 46) * 10 * 3600 * 1000;
    const d = new Date(t);
    const buying = r() > 0.45; // buy EUA with EURS
    const fromIdx = Math.floor(r() * COMPANY_SEED.length);
    let toIdx = Math.floor(r() * COMPANY_SEED.length);
    if (toIdx === fromIdx) toIdx = (toIdx + 1) % COMPANY_SEED.length;
    const amountEua = Math.round(50 + r() * 950);
    const priceBefore = pool.eurs / pool.eua;
    const eursIn = amountEua * priceBefore * (1 + r() * 0.005);
    if (buying) {
      pool.eurs += eursIn;
      pool.eua -= amountEua;
    } else {
      pool.eurs -= eursIn;
      pool.eua += amountEua;
    }
    const priceAfter = pool.eurs / pool.eua;
    const block = baseBlock - (47 - i) * 4;
    trades.push({
      id: i,
      block,
      time: d,
      from: COMPANY_SEED[fromIdx].ens,
      to: COMPANY_SEED[toIdx].ens,
      eua: amountEua,
      eurs: Math.round(eursIn * 100) / 100,
      price: Math.round(priceAfter * 1000) / 1000,
      tx: makeHash(i + 1),
      direction: buying ? "buy" : "sell",
    });
  }
  // Latest first
  return trades.reverse();
}

const INITIAL_TRADES = generateInitialTrades();

// Audit log: minted, registered, swap entries, frozen, etc.
function generateInitialAudit() {
  const entries = [];
  const now = new Date();
  const baseBlock = 18293800;
  const push = (mins, action, target, detail, who = REGULATOR_USER.ens) => {
    entries.push({
      time: new Date(now.getTime() - mins * 60 * 1000),
      block: baseBlock + entries.length * 6,
      action, target, detail, by: who,
      tx: makeHash(1000 + entries.length),
    });
  };
  push(720, "Registered", "company-a.eth",         "Emitter, DE");
  push(710, "Registered", "company-b.eth",         "Buyer, FR");
  push(700, "Registered", "siemens-energy.eth",    "Emitter, DE");
  push(680, "Registered", "totalenergies-fr.eth",  "Emitter, FR");
  push(660, "Registered", "ryanair.eth",           "Emitter, IE");
  push(640, "Registered", "arcelor-mittal.eth",    "Emitter, LU");
  push(620, "Registered", "iberdrola-es.eth",      "Emitter, ES");
  push(600, "Registered", "enel-it.eth",           "Buyer, IT");
  push(580, "Registered", "shell-nl.eth",          "Emitter, NL");
  push(560, "Registered", "fortum-fi.eth",         "Buyer, FI");
  push(540, "Registered", "orsted-dk.eth",         "Emitter, DK");
  push(520, "Registered", "company-c.eth",         "Emitter, NL");
  push(480, "Minted",     "company-a.eth",         "1,000 EUA · Energy · 2024");
  push(420, "Minted",     "siemens-energy.eth",    "750 EUA · Energy · 2024");
  push(360, "Minted",     "arcelor-mittal.eth",    "1,200 EUA · Industry · 2024");
  push(300, "Minted",     "totalenergies-fr.eth",  "850 EUA · Energy · 2023");
  push(240, "Minted",     "iberdrola-es.eth",      "700 EUA · Energy · 2024");
  push(180, "Frozen",     "company-c.eth",         "Suspicious trading pattern");
  return entries.reverse();
}

const INITIAL_AUDIT = generateInitialAudit();

const INITIAL_RETIREMENTS = []; // empty until user retires

// Country full names for tooltips
const COUNTRY_NAMES = {
  DE: "Germany", FR: "France", NL: "Netherlands", IT: "Italy",
  ES: "Spain", IE: "Ireland", LU: "Luxembourg", FI: "Finland",
  DK: "Denmark",
};

window.SEED = {
  COMPANY_SEED,
  CURRENT_USER,
  REGULATOR_USER,
  INITIAL_PORTFOLIO,
  INITIAL_POOL,
  INITIAL_BALANCES,
  INITIAL_TRADES,
  INITIAL_AUDIT,
  INITIAL_RETIREMENTS,
  COUNTRY_NAMES,
  SECTORS,
  VINTAGES,
  shortAddr,
  shortHash,
  makeHash,
};
