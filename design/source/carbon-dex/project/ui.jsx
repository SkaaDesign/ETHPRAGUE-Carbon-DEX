// Shared UI components: Topbar, badges, chips, banner, tx hash, sourcify, ENS, etc.
// Loaded after data.jsx — uses window.SEED helpers.

const { shortAddr, shortHash, COUNTRY_NAMES } = window.SEED;

// --- Logo --------------------------------------------------
function Logo() {
  return (
    <span className="logo" title="ccex — Carbon Credit Exchange">
      <span className="logo-mark"></span>
      <span className="logo-text">ccex</span>
    </span>
  );
}

// --- Role badge --------------------------------------------
function RoleBadge({ role }) {
  const labels = { company: "Company", regulator: "Regulator", public: "Observer" };
  return (
    <span className={`role-badge ${role}`}>
      <span className="dot"></span>
      {labels[role]}
    </span>
  );
}

// --- ENS name ----------------------------------------------
function ENSName({ ens, addr, className = "" }) {
  const display = ens || (addr ? shortAddr(addr) : "—");
  return (
    <span className={`ens ${className}`} title={addr || ens}>
      {display}
    </span>
  );
}

// --- Sourcify badge ----------------------------------------
function Sourcify({ contract = "", addr = "0x5f3a1c9e7b2d4f8c6a3b9d1e5f7c2a8d4b6e9f12" }) {
  const url = `https://sourcify.dev/#/lookup/${addr}`;
  return (
    <a className="sourcify" href={url} target="_blank" rel="noreferrer" title={`${contract || "Contract"} · ${addr}`}>
      Verified on Sourcify
    </a>
  );
}

// --- Tx hash -----------------------------------------------
function TxHash({ hash, label = "Tx" }) {
  return (
    <a className="txhash" href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noreferrer" title={hash}>
      {label}: {shortHash(hash)} <span className="arrow">↗</span>
    </a>
  );
}

// --- Status chip -------------------------------------------
function Chip({ kind, children }) {
  return <span className={`chip ${kind}`}>{children}</span>;
}

// --- Country -----------------------------------------------
function Country({ code }) {
  if (!code || code === "–") return <span className="muted">—</span>;
  return (
    <span className="country" title={COUNTRY_NAMES[code] || code}>
      <span className="cc">{code}</span>
    </span>
  );
}

// --- Network chip ------------------------------------------
function NetworkChip() {
  return <span className="net-chip">Base Sepolia</span>;
}

// --- Topbar ------------------------------------------------
function Topbar({ role, paused, currentBlock, onLogoClick }) {
  const portalNames = {
    company: "Carbon Credit Exchange",
    regulator: "Carbon Credit Exchange",
    public: "Public Market",
  };
  const userEns = role === "regulator" ? "eu-ets-authority.eth" : (role === "company" ? "company-b.eth" : null);
  const userAddr = role === "regulator"
    ? "0x5f3a1c9e7b2d4f8c6a3b9d1e5f7c2a8d4b6e9f12"
    : (role === "company" ? "0x4d8e7c3a2b1f5e9d6c8a7b4e3f2d1c5b8a9e6d72" : null);

  return (
    <header className={`topbar ${paused ? "paused" : ""}`}>
      <div className="left">
        <RoleBadge role={role} />
        <span style={{ width: 1, height: 18, background: "var(--c-border)" }}></span>
        <span onClick={onLogoClick} style={{ cursor: onLogoClick ? "pointer" : "default" }}>
          <Logo />
        </span>
        <span className="portal-name muted" style={{ fontWeight: 400, fontSize: 13 }}>
          {portalNames[role]}
        </span>
      </div>
      <div className="center">
        {paused && (
          <span className="pause-tag">DEX PAUSED</span>
        )}
      </div>
      <div className="right">
        {userEns && (
          <>
            <ENSName ens={userEns} addr={userAddr} />
            <span className="muted" style={{ fontSize: 12 }}>·</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{shortAddr(userAddr)}</span>
            <span className="muted" style={{ fontSize: 12 }}>·</span>
          </>
        )}
        <NetworkChip />
        <span className="mono muted" style={{ fontSize: 11 }}>#{currentBlock.toLocaleString()}</span>
      </div>
    </header>
  );
}

// --- Paused banner -----------------------------------------
function PausedBanner({ pausedAt, pausedBlock }) {
  const t = pausedAt ? pausedAt.toISOString().slice(11, 19) : "—:—:—";
  return (
    <div className="paused-banner">
      <span className="dot"></span>
      <span>DEX IS PAUSED — All trading halted by EU ETS Authority</span>
      <span className="meta">eu-ets-authority.eth · Block #{(pausedBlock || 0).toLocaleString()} · {t} UTC</span>
    </div>
  );
}

// --- Modal -------------------------------------------------
function Modal({ children, onClose }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// --- Plain English tx --------------------------------------
function PlainEnglishTx({ children }) {
  return <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{children}</div>;
}

// --- Spinner inline confirmation ---------------------------
function ConfirmingInline() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--c-text-secondary)", fontSize: 13 }}>
      <span className="spin" style={{ color: "var(--c-text-secondary)" }}></span>
      Confirming…
    </span>
  );
}

// --- Format helpers ----------------------------------------
function fmtNum(n, dec = 0) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function fmtTime(d) {
  if (!d) return "—";
  return d.toISOString().slice(11, 19);
}
function fmtDate(d) {
  if (!d) return "—";
  return d.toISOString().slice(0, 19).replace("T", " ") + " UTC";
}

// --- Token pill --------------------------------------------
function TokenPill({ symbol }) {
  const cls = symbol === "EUA" ? "token-eua" : "token-eurs";
  return (
    <span className={`token-pill ${cls}`}>
      <span className="glyph">{symbol === "EUA" ? "E" : "€"}</span>
      {symbol}
    </span>
  );
}

// expose
Object.assign(window, {
  Logo, RoleBadge, ENSName, Sourcify, TxHash, Chip, Country, NetworkChip,
  Topbar, PausedBanner, Modal, PlainEnglishTx, ConfirmingInline, TokenPill,
  fmtNum, fmtTime, fmtDate,
});
