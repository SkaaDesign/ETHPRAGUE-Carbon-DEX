# Carbon DEX — Design Brief for Claude
> Hand this file to Claude (design or code mode) to generate any screen.
> Every decision needed to produce a pixel-accurate wireframe or component is in here.
> No guessing required.

---

## 0. How to use this brief

**To design a screen:** Read §1 (aesthetic), §2 (tokens), §3 (global components), then jump to the portal section for that screen (§4 Company / §5 Regulator / §6 Public).

**To build a component:** Read §2 (tokens) + the component spec in the relevant portal section.

**To wire a flow:** Follow the flow diagrams in each portal section. Every state transition is listed.

---

## 1. Aesthetic direction — NON-NEGOTIABLE

**Direction:** Institutional / Scandinavian-industrial.

**The one rule:** If it looks like a crypto app, redesign it. If it looks like Bloomberg Terminal meets a Nordic government portal, you're close.

| Attribute | Direction | Anti-pattern |
|-----------|-----------|--------------|
| Color | Slate, dark forest green, warm off-white, single red accent | Purple gradients, neon, rainbow tokens |
| Typography | Geometric sans, mono for data | Rounded consumer fonts |
| Density | Data-dense tables, no wasted whitespace | Hero sections, marketing copy |
| Decoration | None. Structure is the decoration | Icons as decoration, illustrations |
| Motion | Functional only (tx pending, live feed updates) | Page transitions, hover animations |
| Tone | Government document meets trading terminal | "Web3 vibes", friendly onboarding |

**Color palette (implement as CSS variables):**
```css
:root {
  /* Primary surfaces */
  --c-bg:        #F7F6F2;   /* warm off-white — page background */
  --c-surface:   #FFFFFF;   /* card / panel surface */
  --c-border:    #DDD9D0;   /* default border */
  --c-border-subtle: #EDEAE3; /* subtle dividers */

  /* Typography */
  --c-text-primary:   #1A1917;  /* headings, labels */
  --c-text-secondary: #6B6860;  /* subtitles, meta */
  --c-text-mono:      #3D3C39;  /* numbers, addresses */

  /* Role accent colors — one per portal */
  --c-company:   #1B4F8A;  /* deep institutional blue */
  --c-regulator: #1A4A35;  /* dark forest green */
  --c-public:    #4A4740;  /* warm slate */

  /* Semantic */
  --c-danger:    #B91C1C;  /* freeze, pause, frozen badge */
  --c-warning:   #92400E;  /* price impact, KYC pending */
  --c-success:   #166534;  /* verified, tx confirmed */
  --c-paused-bg: #FEF2F2;  /* system-wide pause state */
  --c-paused-border: #FECACA;

  /* Data / highlight */
  --c-amber:     #D97706;  /* bounty markers, ENS names */
}
```

**Typography:**
- Headings: `font-family: 'IBM Plex Sans', sans-serif; font-weight: 500`
- Body + labels: `font-family: 'IBM Plex Sans', sans-serif; font-weight: 400`
- Numbers, addresses, tx hashes: `font-family: 'IBM Plex Mono', monospace`
- Load from Google Fonts: `IBM+Plex+Sans:wght@400;500&IBM+Plex+Mono:wght@400`

**Grid:**
- Base unit: 8px
- Panel padding: 24px
- Card padding: 16px
- Border radius: 4px (inputs, chips), 8px (cards), 0px (tables)
- Border width: 1px solid var(--c-border)

---

## 2. Global tokens & reusable components

### 2.1 Layout shell (all three portals share this)
```
┌─────────────────────────────────────────────────────┐
│ TOPBAR (48px)                                       │
│ [Role badge] [Portal name]    [ENS name] [Network]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  CONTENT AREA (full width, portal-specific)          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Topbar spec:**
- Height: 48px
- Background: var(--c-surface), border-bottom: 1px solid var(--c-border)
- Left: Role badge (see §2.2) + portal name (14px, weight 500)
- Right: ENS name in var(--c-amber) + "·" separator + Network chip + wallet address (truncated, mono 12px)
- If DEX is PAUSED: topbar background becomes var(--c-paused-bg), border becomes var(--c-paused-border), add "⬤ DEX PAUSED" in var(--c-danger) between left and right content

### 2.2 Role badges
```
Company:   [■] Company    background: #EFF6FF, color: #1B4F8A, border: #BFDBFE
Regulator: [■] Regulator  background: #F0FDF4, color: #1A4A35, border: #BBF7D0
Public:    [■] Observer   background: #F9FAFB, color: #4A4740, border: #E5E7EB
```
- Size: 24px × auto, padding: 4px 8px, border-radius: 4px, font-size: 11px, weight: 500
- Square dot (■) = 6px × 6px, border-radius: 2px, same color as text

### 2.3 ENS name display
- Font: IBM Plex Mono, 13px, color: var(--c-amber)
- Always show ENS if resolved; show truncated 0x (6...4) as fallback
- Tooltip on hover: full 0x address
- Pattern: `eu-ets-authority.eth` or `0x1a2b...3c4d`

### 2.4 Sourcify verified badge
```
[✓ Verified on Sourcify]
```
- Background: #F0FDF4, color: #166534, border: 1px solid #BBF7D0
- Font: 11px, weight 500
- Always links to `https://sourcify.dev/#/lookup/{address}`
- Show next to every contract address in the UI
- On hover: show full contract address

### 2.5 Transaction hash display
```
Tx: 0x3f7a...b291  [↗]
```
- Mono 12px, color: var(--c-text-secondary)
- Arrow links to block explorer
- Show below every confirmed action

### 2.6 Status chips (for KYC, DEX state)
```
Verified  — bg: #F0FDF4, color: #166534, border: #BBF7D0
Frozen    — bg: #FEF2F2, color: #B91C1C, border: #FECACA
Pending   — bg: #FFFBEB, color: #92400E, border: #FDE68A
Paused    — bg: #FEF2F2, color: #B91C1C, border: #FECACA (full-width banner)
```
- Height: 24px, padding: 4px 8px, border-radius: 4px, font: 11px weight 500

### 2.7 PAUSED system banner
When `emergencyPause()` is active, show across ALL THREE portals:
```
┌─────────────────────────────────────────────────────────────────┐
│  ⬤  DEX IS PAUSED — All trading halted by EU ETS Authority      │
│     eu-ets-authority.eth · Block #18,294,441 · 14:32 UTC        │
└─────────────────────────────────────────────────────────────────┘
```
- Full width, below topbar
- Background: #FEF2F2, border-bottom: 1px solid #FECACA
- Text: 13px, color: #B91C1C, weight 500
- Mono details: 12px, color: #991B1B

### 2.8 Pending tx spinner
- Inline: 16px spinner (CSS animation, 1.2s linear) + "Confirming…" in 13px secondary text
- Never block the whole screen. Show inline below the action button.
- On confirm: replace with green ✓ + tx hash (§2.5)

### 2.9 Plain-English tx description
Below every action confirmation, show a one-line human description:
```
eu-ets-authority.eth minted 1,000 EUA (Energy, 2024) to company-a.eth
company-b.eth swapped 2,500 EURS for 1,000 EUA at 2.50 EURS/EUA
company-b.eth retired 500 EUA (Energy, 2024) — offset for 2024 compliance
eu-ets-authority.eth froze company-b.eth
```
- Font: 13px regular, color: var(--c-text-secondary)
- ENS names in var(--c-amber)
- Numbers in IBM Plex Mono

---

## 3. Shared states (wire into every screen)

| State | Trigger | UI change |
|-------|---------|-----------|
| Not connected | No wallet | Show "Connect Wallet" CTA, all data tables show skeleton |
| Connected, not KYC'd | Not in ComplianceRegistry | Yellow "Pending" badge, swap/retire disabled + tooltip "KYC required" |
| Verified | isVerified = true | Green badge, full access |
| Frozen | freeze(address) called | Red "Frozen" badge, swap/retire disabled |
| DEX paused | emergencyPause() called | §2.7 banner in all portals, swap buttons disabled |
| Tx pending | Wallet signed | §2.8 inline spinner |
| Tx confirmed | Block confirmed | Green ✓ + tx hash |
| Wrong network | Chain mismatch | Orange banner "Wrong network — switch to Base Sepolia" |
| Error | Revert / RPC fail | Inline red error text below action, specific revert reason |

---

## 4. COMPANY PORTAL — `/company`

**Accent color:** var(--c-company) = #1B4F8A
**User:** Verified EU ETS participant (Company A = seller, Company B = buyer)
**Primary goal:** Trade EURS ↔ EUA, retire credits, view portfolio

### 4.1 Flow diagram

```
[Land on /company]
        │
        ▼
[Wallet connected?] ──No──→ [SCREEN: Connect Wallet]
        │                           │ connect()
       Yes                          ▼
        │                   [Wallet connected]
        ▼                           │
[isVerified?] ──No──→ [SCREEN: KYC Gate] — show status, contact info
        │                           (read only — regulator must approve)
       Yes
        │
        ▼
[isFrozen?] ──Yes──→ [SCREEN: Account Frozen] — show frozen badge, reason
        │
       No
        │
        ▼
[SCREEN: Dashboard] ← main hub
   ┌────┴────────────────┐
   │                     │
   ▼                     ▼
[Trade]             [Portfolio]
   │                     │
   ▼                     ▼
[Tx confirm]        [Retire credits]
   │                     │
   ▼                     ▼
[Receipt]           [Retirement cert]
```

### 4.2 SCREEN: Connect Wallet

**Layout:** Centered card, 480px wide
**Components:**
- Carbon DEX logo / wordmark (top)
- Headline: "Carbon DEX" (20px, weight 500)
- Subhead: "EU ETS compliance trading — verified participants only" (14px, secondary)
- Divider
- Connect wallet button (full-width, 48px height, background: var(--c-company))
  - Label: "Connect Wallet"
  - After connect: shows ENS name or truncated address
- Below button: "Only addresses registered in the EU ETS Compliance Registry may trade." (12px, secondary)
- Bottom: Sourcify badge linking to ComplianceRegistry contract

**UX law:** Hick's Law — one action only. No options, no explanations, no feature list.

### 4.3 SCREEN: KYC Gate (connected but not verified)

**Layout:** Centered card, 480px wide
```
┌─────────────────────────────────────────────────────┐
│  [Pending badge]  Verification pending              │
│                                                     │
│  company-wallet.eth                                 │
│  0x1a2b...3c4d                                      │
│                                                     │
│  Your address has not been registered in the        │
│  EU ETS Compliance Registry. Contact the            │
│  EU ETS Authority to complete verification.         │
│                                                     │
│  Registry contract: [Sourcify badge]                │
│  0x5f3a...8b12                                      │
│                                                     │
│  [View public market →]                             │
└─────────────────────────────────────────────────────┘
```
- No actions available except "View public market" (ghost button)
- Shows wallet address + ENS if resolved

### 4.4 SCREEN: Dashboard (main hub)

**Layout:** Two-column. Left: stats + quick actions (320px). Right: portfolio summary + recent trades.

```
┌─ TOPBAR ────────────────────────────────────────────────────────┐
│ [Company] Carbon DEX          company-a.eth · Base Sepolia ·... │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌── Stats row (4 metric cards) ────────────────────────────┐   │
│  │  EUA Balance   EURS Balance   Total Retired   KYC Status │   │
│  │  1,000 EUA     2,500.00 EURS  0 EUA           Verified ✓ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌── Primary action ────┐  ┌── Portfolio summary ──────────┐    │
│  │                      │  │                               │    │
│  │   [Trade →]          │  │  Credit batches               │    │
│  │   [Retire →]         │  │  ┌────────────────────────┐  │    │
│  │   [Portfolio →]      │  │  │ #001 Energy 2024 1,000 │  │    │
│  │                      │  │  │ #002 Industry 2023 500 │  │    │
│  └──────────────────────┘  │  └────────────────────────┘  │    │
│                             │  [View all →]                │    │
│                             └───────────────────────────────┘   │
│                                                                  │
│  ┌── Recent trades ──────────────────────────────────────────┐  │
│  │  Time        From              To          Amount  Price   │  │
│  │  14:32 UTC   company-a.eth     company-b…  500 EUA 2.50   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Metric card spec:**
- 25% width each, padding 16px, border: 1px solid var(--c-border)
- Label: 11px uppercase, letter-spacing: 0.06em, secondary color
- Value: 24px, mono font, primary color
- KYC Status card: shows chip component (§2.6)

### 4.5 SCREEN: Trade (swap)

**Layout:** Centered card, 440px wide. Mirror Uniswap V2 interaction pattern exactly (Jakob's Law).

```
┌─────────────────────────────────────────────────────┐
│  Trade                                              │
│                                                     │
│  ┌── You pay ─────────────────────────────────────┐ │
│  │  [EURS ▼]                          2,500.00    │ │
│  │  Balance: 5,000.00 EURS               [Max]    │ │
│  └────────────────────────────────────────────────┘ │
│                          [⇅]                        │
│  ┌── You receive ─────────────────────────────────┐ │
│  │  [EUA ▼]                           ~1,000      │ │
│  │  1 EUA = 2.50 EURS                             │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  Price impact: 0.12%                               │
│  Min received: 990 EUA (1% slippage)               │
│  [Advanced ▾]  →  Slippage tolerance               │
│                                                     │
│  ┌── Swap ────────────────────────────────────────┐ │
│  │              Swap EURS for EUA                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  CarbonDEX.sol  [✓ Verified on Sourcify]           │
└─────────────────────────────────────────────────────┘
```

**Swap button states:**
| State | Label | Style |
|-------|-------|-------|
| No amount | "Enter an amount" | Disabled, gray |
| Insufficient balance | "Insufficient EURS balance" | Disabled, gray |
| Ready | "Swap EURS for EUA" | Active, var(--c-company) bg |
| Pending | [spinner] "Confirming…" | Disabled, spinner |
| Confirmed | "Swap confirmed ✓" | Green, 2s then reset |

**Price impact warning:**
- 0–1%: no warning
- 1–3%: amber text "Medium price impact"
- >3%: red text "High price impact" + yellow warning box

**After swap confirmed — Receipt:**
```
┌─────────────────────────────────────────────────────┐
│  ✓ Swap confirmed                                   │
│                                                     │
│  company-b.eth swapped 2,500 EURS for               │
│  1,000 EUA (Energy, 2024) at 2.50 EURS/EUA          │
│                                                     │
│  Tx: 0x3f7a...b291  [↗]                            │
│  Block: 18,294,441                                  │
│                                                     │
│  CarbonDEX.sol [✓ Verified on Sourcify]            │
│                                                     │
│  [Retire these credits →]    [Trade again]          │
└─────────────────────────────────────────────────────┘
```

**UX laws applied:**
- Jakob's Law: identical input/output structure to Uniswap
- Fitts' Law: Swap button full-width, 48px height
- Error prevention: price impact warning, slippage tolerance
- Visibility: real-time price estimate updates as user types
- Doherty Threshold: estimate updates <200ms (debounced)

### 4.6 SCREEN: Portfolio

**Layout:** Full width. Table-dominant.

```
┌─ Portfolio ──────────────────────────────────────────────────────┐
│                                                                   │
│  Holdings                                           [Trade →]    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Token ID  Vintage  Sector    Origin  Balance  Actions   │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  #001       2024    Energy    DE      1,000    [Retire]  │   │
│  │  #002       2023    Industry  FR      500      [Retire]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  EURS Balance                                                    │
│  2,500.00 EURS                                                   │
│                                                                   │
│  Trade history                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Time        Action  Amount    Counterparty   Tx          │   │
│  │  14:32 UTC   Swap    +1000 EUA company-a.eth  0x3f…[↗]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Retirements                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  (empty — no retirements yet)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

**Table spec:**
- Header: 11px uppercase, letter-spacing 0.06em, secondary color, border-bottom 1px
- Rows: 40px height, 13px body text, alternating bg: white / #FAFAF8
- Token ID: mono font
- Balance: mono font, right-aligned
- [Retire] button: 28px height, 11px, border only (ghost), var(--c-company) color

### 4.7 SCREEN: Retire credits

**Layout:** Centered card, 480px. This is an irreversible action — design friction intentionally.

```
┌─────────────────────────────────────────────────────┐
│  Retire carbon credits                              │
│  This action is permanent and cannot be undone.     │
│                                                     │
│  Select batch                                       │
│  [#001 — Energy 2024 — 1,000 EUA available  ▼]     │
│                                                     │
│  Amount to retire                                   │
│  [        500        ]  EUA                        │
│  Available: 1,000 EUA                              │
│                                                     │
│  Beneficiary (optional)                             │
│  [  company-b.eth or 0x address  ]                  │
│                                                     │
│  Reason / evidence URI (optional)                   │
│  [  ipfs://... or https://...   ]                   │
│  Links your sustainability report to this offset    │
│                                                     │
│  ┌── Warning ─────────────────────────────────────┐ │
│  │  ⚠  Retiring 500 EUA will permanently burn     │ │
│  │     these credits. This cannot be reversed.    │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  [Cancel]              [Retire 500 EUA →]           │
│                                                     │
│  Retirement.sol [✓ Verified on Sourcify]           │
└─────────────────────────────────────────────────────┘
```

**Confirmation modal (2-step):**
After clicking "Retire", show modal before wallet prompt:
```
┌─────────────────────────────────────────┐
│  Confirm retirement                     │
│                                         │
│  You are about to permanently burn:     │
│  500 EUA — Energy sector, vintage 2024  │
│                                         │
│  Beneficiary:  company-b.eth            │
│  Reason URI:   ipfs://Qm...             │
│                                         │
│  This will emit a permanent             │
│  on-chain retirement event.             │
│                                         │
│  [Cancel]    [Confirm & sign wallet]    │
└─────────────────────────────────────────┘
```

**Post-retirement: Retirement Certificate**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  CERTIFICATE OF CARBON CREDIT RETIREMENT           │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Credits retired:  500 EUA                         │
│  Sector:           Energy                          │
│  Vintage:          2024                            │
│  Origin:           Germany (DE)                    │
│  Methodology:      EU ETS Phase IV                  │
│                                                     │
│  Retired by:       company-b.eth                   │
│  Beneficiary:      company-b.eth                   │
│  Timestamp:        2024-06-14 14:32:07 UTC         │
│                                                     │
│  On-chain proof:                                   │
│  Tx 0x3f7a...b291  [↗]                            │
│  Block 18,294,441                                  │
│                                                     │
│  Retirement.sol [✓ Verified on Sourcify]           │
│                                                     │
│  [Download as PDF]    [Share on-chain link]         │
└─────────────────────────────────────────────────────┘
```
- Style: document-like. Thin border. Mono font for values. Certificate heading in small caps.
- This is the Peak-End "end" moment — make it feel official.

---

## 5. REGULATOR PORTAL — `/regulator`

**Accent color:** var(--c-regulator) = #1A4A35
**User:** EU ETS Authority wallet (eu-ets-authority.eth)
**Primary goal:** Mint credits, manage KYC, monitor trades, freeze/pause as needed
**Layout pattern:** Left sidebar nav + main content area (dashboard-style)

### 5.1 Flow diagram

```
[Land on /regulator]
        │
        ▼
[Authority wallet connected?] ──No──→ [SCREEN: Connect Wallet (regulator variant)]
        │                                       │ connect()
       Yes                                      ▼
        │                              [Verify = Regulator.sol owner]
        │                                       │
        │                              ──Not owner──→ [Access denied screen]
        ▼
[SCREEN: Regulator Dashboard]
        │
   ┌────┼─────────────────────────────────┐
   │    │                                 │
   ▼    ▼                                 ▼
[Mint] [KYC Mgmt]                   [Live feed]
   │    │                                 │
   │    ├── Register company              │── [PAUSE button]
   │    ├── Freeze company                │       │
   │    └── Unfreeze company              │       ▼
   │                                 [PAUSED state — all portals]
   ▼                                      │
[Tx confirm]                         [Unfreeze/Unpause]
        │
        ▼
[Audit Log] ← always accessible, logs all above actions
```

### 5.2 SCREEN: Regulator Dashboard layout

```
┌─ TOPBAR ─────────────────────────────────────────────────────────┐
│ [Regulator] Carbon DEX     eu-ets-authority.eth · Base Sepolia   │
├──────────────┬───────────────────────────────────────────────────┤
│              │                                                    │
│  SIDEBAR     │  MAIN CONTENT                                     │
│  (200px)     │                                                    │
│              │                                                    │
│  ─ Overview  │                                                    │
│  ─ Mint      │                                                    │
│  ─ KYC       │                                                    │
│  ─ Live feed │                                                    │
│  ─ Audit log │                                                    │
│              │                                                    │
│              │                                                    │
└──────────────┴───────────────────────────────────────────────────┘
```

**Sidebar spec:**
- Width: 200px, background: white, border-right: 1px solid var(--c-border)
- Nav items: 40px height, 14px, padding: 0 16px
- Active: background: #F0FDF4, left border: 3px solid var(--c-regulator), text: var(--c-regulator)
- Hover: background: #F9FAF8

**Overview panel (default main content):**
```
┌── Stats row ─────────────────────────────────────────────────────┐
│  Total supply   Companies KYC'd   Trades today   DEX status      │
│  4,500 EUA      12                 47             ● Active        │
└──────────────────────────────────────────────────────────────────┘

┌── Recent actions ────────────────────────────────────────────────┐
│  Time        Action     Target              Amount/Detail        │
│  14:32       Minted     company-a.eth        1,000 EUA           │
│  13:15       Registered company-b.eth        KYC approved        │
└──────────────────────────────────────────────────────────────────┘
```

### 5.3 SCREEN: Mint credits

```
┌── Mint carbon credits ───────────────────────────────────────────┐
│                                                                   │
│  Recipient address or ENS name                                   │
│  [  company-a.eth  ]  → resolves to 0x1a2b...3c4d               │
│                                                                   │
│  Credit batch details                                            │
│  ┌─────────────────────┬──────────────────────────────────────┐ │
│  │  Token ID (batch)   │  [  001  ]                          │ │
│  │  Amount             │  [  1000  ]  EUA                    │ │
│  │  Vintage year       │  [  2024  ▼]                        │ │
│  │  Sector             │  [  Energy ▼]                       │ │
│  │  Origin country     │  [  Germany (DE) ▼]                 │ │
│  │  Methodology ID     │  [  EU-ETS-P4-001  ]               │ │
│  └─────────────────────┴──────────────────────────────────────┘ │
│                                                                   │
│  Preview                                                          │
│  eu-ets-authority.eth will mint 1,000 EUA (Energy, 2024, DE)    │
│  to company-a.eth                                                │
│                                                                   │
│  CarbonCredit.sol [✓ Verified on Sourcify]                       │
│                                                                   │
│  [Cancel]                          [Mint 1,000 EUA →]           │
└───────────────────────────────────────────────────────────────────┘
```

**Sector dropdown options:** Energy / Industry / Transport / Buildings / Aviation
**Vintage options:** 2020 / 2021 / 2022 / 2023 / 2024

**After mint confirmed:**
```
✓ Minted 1,000 EUA (Energy, 2024) to company-a.eth
Tx: 0x3f7a...b291 [↗]  · CarbonCredit.sol [✓ Verified on Sourcify]
```

### 5.4 SCREEN: KYC management

```
┌── Compliance Registry ───────────────────────────────────────────┐
│                                                                   │
│  [+ Register company]         [Filter: All ▼]   [Search...]     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ENS / Address      Country  Type        Status  Actions │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  company-a.eth  DE  Emitter  [Verified ✓]  [Freeze]      │   │
│  │  company-b.eth  FR  Buyer    [Verified ✓]  [Freeze]      │   │
│  │  company-c.eth  NL  Emitter  [Frozen ✗]    [Unfreeze]    │   │
│  │  0x9f2c...4a1b  –   –        [Pending]      [Approve]    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ComplianceRegistry.sol [✓ Verified on Sourcify]                │
└───────────────────────────────────────────────────────────────────┘
```

**Register company drawer/modal:**
```
┌── Register company ─────────────────────────┐
│                                             │
│  Address or ENS                             │
│  [  0x address or company.eth  ]            │
│                                             │
│  Company country                            │
│  [  Germany (DE) ▼]                        │
│                                             │
│  Allowance type                             │
│  [  Emitter ▼]  or Buyer / Both            │
│                                             │
│  [Cancel]    [Register →]                   │
└─────────────────────────────────────────────┘
```

**Freeze confirmation (2-step — error prevention):**
```
┌── Freeze company? ──────────────────────────┐
│                                             │
│  You are about to freeze:                  │
│  company-b.eth (0x1a2b...3c4d)             │
│  France — Buyer                            │
│                                             │
│  This will prevent all trading and         │
│  credit transfers from this address.       │
│  You can unfreeze at any time.             │
│                                             │
│  [Cancel]    [Freeze company-b.eth]         │
└─────────────────────────────────────────────┘
```

### 5.5 SCREEN: Live trade feed + PAUSE button

**This is the demo centrepiece. Design it like a trading terminal.**

```
┌── Live trade feed ───────────────────────────────────────────────┐
│                                                                   │
│  ● Live   47 trades today              ┌── EMERGENCY ─────────┐ │
│                                        │                       │ │
│  ┌──────────────────────────────────┐  │    ■ PAUSE DEX       │ │
│  │ Time    From          To    EUA  │  │                       │ │
│  │ 14:32   company-a.eth b.eth 500  │  │  Halts all trading   │ │
│  │ 14:18   company-b.eth a.eth 200  │  └───────────────────────┘ │
│  │ 13:55   company-a.eth b.eth 1000 │                            │
│  │  ...                             │                            │
│  └──────────────────────────────────┘                            │
│                                                                   │
│  Each row: ENS names in amber · Tx hash [↗] · Sourcify badge    │
└───────────────────────────────────────────────────────────────────┘
```

**PAUSE button spec:**
- Size: at least 160px × 64px — large by design (Fitts' Law)
- Background: #B91C1C (danger red), color: white
- Font: 14px weight 500, uppercase, letter-spacing 0.08em
- Border: none
- Label: "■ PAUSE DEX"
- Position: always visible, top-right of live feed view
- Hover: #991B1B

**PAUSE confirmation (2-step — this is the climax of the demo):**
```
┌── Pause DEX? ───────────────────────────────┐
│                                             │
│  This will immediately halt all trading.    │
│  All swap transactions will revert.         │
│  This is visible to all participants.       │
│                                             │
│  Type PAUSE to confirm:                    │
│  [              ]                           │
│                                             │
│  [Cancel]    [Pause trading]               │
└─────────────────────────────────────────────┘
```
- "Pause trading" button only enables when user has typed "PAUSE"
- After confirm: PAUSED banner appears in all three portals instantly

**Live feed row spec:**
- Height: 36px
- Columns: Time (mono 12px) | From (amber, 13px) | To (amber, 13px) | Amount (mono 13px) | Tx [↗]
- New row animates in from top with 200ms fade (functional animation only)
- ● Live indicator: green dot, 8px, CSS pulse animation

### 5.6 SCREEN: Audit log

```
┌── Audit log ─────────────────────────────────────────────────────┐
│                                                                   │
│  [Filter: All ▼]  [Action type ▼]    [Export CSV]   [Search...] │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Time (UTC)     Action      Target           Detail      │   │
│  │  ─────────────────────────────────────────────────────── │   │
│  │  14:32:07  [Minted]     company-a.eth   1,000 EUA E.2024 │   │
│  │  14:18:22  [Swap]       company-b.eth   500 EUA @ 2.50   │   │
│  │  13:55:01  [Registered] company-c.eth   Buyer, NL        │   │
│  │  13:40:18  [Frozen]     company-c.eth   Flagged          │   │
│  │  12:00:00  [Paused]     DEX             Emergency halt   │   │
│  │  12:05:00  [Unpaused]   DEX             Resumed          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Regulator.sol [✓ Verified on Sourcify]                         │
└───────────────────────────────────────────────────────────────────┘
```

**Action chip colors:**
- Minted: green (success)
- Swap: blue (company color)
- Registered: teal
- Frozen: red (danger)
- Paused / Unpaused: red / green

**Row click → detail drawer:**
```
RegulatoryAction event
Action:    Frozen
Target:    company-c.eth (0x9f2c...4a1b)
Reason:    Suspicious trading pattern
Timestamp: 2024-06-14 13:40:18 UTC
Block:     18,294,199
Tx:        0xb2c1...7f88 [↗]
Emitter:   eu-ets-authority.eth
```

---

## 6. PUBLIC PORTAL — `/public`

**Accent color:** var(--c-public) = #4A4740
**User:** Anyone — no wallet required
**Primary goal:** Market transparency — observe all trades, retirements, regulator actions
**Layout:** Single column, full width. No sidebar.

### 6.1 Flow diagram

```
[Land on /public]
        │
        ▼
[SCREEN: Market overview]  ← no auth required, fully static
        │
   ┌────┼──────────────────────┐
   │    │                      │
   ▼    ▼                      ▼
[Market  [Trade    [Retirements  [Regulator
 depth]   history]  log]          action log]
        │
        ▼
[Any row] → click → detail modal (tx hash, ENS, Sourcify)
```

### 6.2 SCREEN: Market overview (main)

```
┌─ TOPBAR ─────────────────────────────────────────────────────────┐
│ [Observer] Carbon DEX — Public Market              Base Sepolia  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌── Market stats ──────────────────────────────────────────┐   │
│  │  EUA/EURS price   24h volume   Total supply   Retired     │   │
│  │  2.50 EURS        125,000      4,500 EUA       500 EUA    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌── Market depth (AMM pool) ───────────────────────────────┐   │
│  │                                                          │   │
│  │  EURS reserve: 125,000        EUA reserve: 50,000        │   │
│  │                                                          │   │
│  │  [Simple depth bar — EURS ████████░░░░░ EUA]             │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌── Recent trades ──────────────────────────────────────────┐  │
│  │  All trades — public on-chain record                      │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │  Time     From           To             EUA    EURS/EUA   │  │
│  │  14:32    company-a.eth  company-b.eth  500    2.50       │  │
│  │  ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Nav tabs (below topbar, above content):**
```
[Market]  [Trades]  [Retirements]  [Regulator log]
```
- Tab underline: 2px solid var(--c-public) on active
- Font: 13px, weight 500 active / 400 inactive

### 6.3 SCREEN: Trades tab

Same table as regulator live feed but:
- No PAUSE button
- No actions
- Read-only
- Show ENS names in amber
- Tx hash always visible [↗]
- Sourcify badge in table footer

### 6.4 SCREEN: Retirements tab

```
┌── Carbon credit retirements ────────────────────────────────────┐
│  Public record of all on-chain credit retirements               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Time       By              Amount  Sector  Vintage  Tx │   │
│  │  14:32 UTC  company-b.eth   500     Energy  2024     [↗]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Retirement.sol [✓ Verified on Sourcify]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Row click → Retirement detail:**
```
┌── Retirement #4 ────────────────────────────────────┐
│                                                     │
│  500 EUA retired permanently                       │
│  ─────────────────────────────────────             │
│  By:          company-b.eth                        │
│  Sector:      Energy                               │
│  Vintage:     2024                                 │
│  Origin:      Germany (DE)                         │
│  Beneficiary: company-b.eth                        │
│  Reason URI:  ipfs://Qm... [↗]                    │
│  Timestamp:   2024-06-14 14:32:07 UTC              │
│  Tx:          0x3f7a...b291 [↗]                   │
│                                                     │
│  [Close]                                           │
└─────────────────────────────────────────────────────┘
```

### 6.5 SCREEN: Regulator log tab

Same as §5.6 Audit Log but:
- No filter, no export CSV
- Read-only
- All RegulatoryAction events visible
- "This log is publicly verifiable on-chain" banner at top

---

## 7. Architecture diagram (for public view header + pitch slide)

**Canonical diagram — must be producible as SVG from this spec:**

Three columns:
- Left: Company A (seller) — blue
- Center: CarbonDEX + Regulator overhead — green
- Right: Company B (buyer) — blue
- Bottom: Retirement burn flowing out

Arrows:
- Regulator → DEX: mint, pause, audit
- Company A ↔ DEX ↔ Company B: swap (EURS / EUA)
- Company B → Retirement: retire (burn)
- Retirement → ∅: permanent burn, emits event

Style: same institutional aesthetic. No gradients. Clean boxes and arrows.

---

## 8. Component implementation notes for Claude Code

### Tech stack reminder
- Framework: Next.js App Router
- Chain library: viem
- Wallet: RainbowKit (or Privy if UX prize is pursued)
- Fonts: IBM Plex Sans + IBM Plex Mono (Google Fonts)
- No CSS framework — write plain CSS or CSS modules
- No icon library — use Tabler Icons CDN for icons

### File structure for components
```
web/
├── app/
│   ├── company/page.tsx      → §4 Company portal
│   ├── regulator/page.tsx    → §5 Regulator portal
│   └── public/page.tsx       → §6 Public portal
├── components/
│   ├── Topbar.tsx            → §2.1
│   ├── RoleBadge.tsx         → §2.2
│   ├── ENSName.tsx           → §2.3
│   ├── SourceifyBadge.tsx    → §2.4
│   ├── TxHash.tsx            → §2.5
│   ├── StatusChip.tsx        → §2.6
│   ├── PausedBanner.tsx      → §2.7
│   ├── TxPending.tsx         → §2.8
│   ├── PlainEnglishTx.tsx    → §2.9
│   ├── SwapWidget.tsx        → §4.5
│   ├── RetirementCert.tsx    → §4.7
│   ├── MintForm.tsx          → §5.3
│   ├── KYCTable.tsx          → §5.4
│   ├── LiveFeed.tsx          → §5.5
│   ├── PauseButton.tsx       → §5.5 (PAUSE)
│   └── AuditLog.tsx          → §5.6
└── styles/
    └── globals.css           → CSS variables from §1
```

### Contract read/write map
| Component | Contract | Function |
|-----------|----------|----------|
| SwapWidget | CarbonDEX.sol | swap(), getAmountOut() |
| RetireForm | Retirement.sol | retire() |
| MintForm | CarbonCredit.sol | mint() |
| KYCTable | ComplianceRegistry.sol | register(), freeze(), unfreeze(), isVerified() |
| PauseButton | CarbonDEX.sol | emergencyPause() |
| LiveFeed | CarbonDEX.sol | events: Swap, Paused, Unpaused |
| AuditLog | Regulator.sol | events: RegulatoryAction |
| SourceifyBadge | (all) | Static link to Sourcify lookup |
| ENSName | (all) | viem: getEnsName() |

---

## 9. Priority order for build

**Day 2 — must have:**
1. CSS variables + Topbar + PausedBanner (global shell)
2. SwapWidget (Company portal — demo step 2)
3. MintForm (Regulator portal — demo step 1)
4. LiveFeed + PauseButton (Regulator portal — demo steps 3–4)
5. RetirementCert (Company portal — demo step 5)
6. SourceifyBadge everywhere
7. ENSName resolver everywhere

**Day 3 — if time:**
8. KYCTable (Regulator)
9. Portfolio (Company)
10. AuditLog (Regulator)
11. Public portal (all tabs)
12. Architecture diagram SVG

---
*DESIGN_BRIEF.md — Carbon DEX, ETHPrague 2026. Single source of truth for all design and frontend build decisions.*
