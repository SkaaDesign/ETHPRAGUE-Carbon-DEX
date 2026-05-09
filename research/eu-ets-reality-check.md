# EU ETS Reality Check — Carbon DEX

Background research for ETHPrague 2026. Sourced primarily from EUR-Lex and EU Commission climate.ec.europa.eu; secondary sources cited where primary law was inaccessible. Where contested or thin, I say so.

## 1. Powers of EU national administrators (national registries)

Yes — but the powers are **administrative, not mid-flight transactional**. Under [Commission Delegated Regulation (EU) 2019/1122](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019R1122) (Registry Regulation), a national administrator may **suspend access to an account for up to 4 weeks** if it suspects fraud, money laundering, terrorist financing, corruption, or other serious crime, or under national law pursuing a legitimate objective (Art. 30). If the situation is not resolved, the competent authority or law-enforcement authority may instruct the NA to **close the account or set it to "blocked status"** until the situation is resolved. Operator/aircraft-operator accounts can also be set to "excluded" when permits are withdrawn (Art. 28). Account holders may **appeal within 30 days** (Reg. 389/2013 carry-over provisions).

What national administrators **cannot do cleanly**: reverse a *settled* transfer. Once a transfer is finalised in the Union Registry, there is no built-in claw-back. The 2010-11 phishing thefts demonstrated this — the Commission suspended **spot trading EU-wide for ~10 days** in January 2011 ([Climate Action news archive](https://www.climateaction.org/news/cyber_hackers_expose_cracks_in_eu_emissions_trading_scheme)) rather than reverse transfers, because the registry has no rollback primitive. The **26-hour cooling-off delay for non-trusted accounts** (Reg. 2019/1122 Annex; see [DEHSt](https://www.dehst.de/EN/Topics/EU-ETS-1/EU-ETS-1-Information/Union-Registry/union-registry_node.html)) was added precisely so suspect transfers can be intercepted *pre-settlement*. Penalty enforcement is separate: [Directive 2003/87/EC Art. 16](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32003L0087) imposes €100/tCO2 excess-emission penalty plus operator name publication.

**Implication for Carbon DEX:** A regulator that can `freeze(account)` and refuse to mint new allowances is faithful. A regulator that reverses a confirmed AMM swap is **not** faithful — Union Registry doesn't do that either. Frame freeze as forward-looking, not retroactive.

## 2. 2010 EU ETS VAT carousel fraud

Estimated **€5 billion EU-wide tax loss** (Europol, 2009-2010; some sources cite higher [€500B] aggregate VAT carousel figures, but ETS-specific is ~€5B; see [Europol newsroom](https://www.europol.europa.eu/media-press/newsroom/news/further-investigations-vat-fraud-linked-to-carbon-emissions-trading-system)). Mechanic: classic **Missing-Trader Intra-Community (MTIC)** fraud — Trader A in Member State X buys EUAs cross-border VAT-free, sells domestically charging VAT to Trader B, then disappears without remitting VAT to the tax authority. Trader B reclaims input VAT. EUAs were the perfect vehicle: digital, instant settlement, no physical movement, deep liquidity. Detection came via tax-authority anomaly investigations (Germany, France, UK, NL) and Europol coordination. Several Member States temporarily suspended VAT on allowance trades (FR/UK/NL in 2009).

**Legal fix:** [Council Directive 2010/23/EU](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32010L0023) (16 March 2010) inserted Art. 199a into the VAT Directive 2006/112/EC, allowing Member States to apply **domestic reverse-charge mechanism** to allowance transfers — VAT liability shifts to the buyer, eliminating the missing-trader vector. Originally optional/temporary; subsequently extended. Registry-level upgrades came separately: tighter KYC for Person Holding Accounts and the trusted-account-list / 26-hour delay regime in Reg. 389/2013 (now 2019/1122).

**Implication:** The fraud was a **fiscal** wrapper around the trading layer, not an attack on registry consensus. Carbon DEX's mock-EUR settlement layer naturally sidesteps this (no VAT on testnet), but real-world Carbon DEX would need reverse-charge integration or off-chain VAT handling.

## 3. 2022 Russian-linked allowance "freeze"

**This is where the brief should be careful — the freeze narrative is thinner than commonly claimed.** I could not find evidence of a discrete EU action that froze Russian operator accounts in the Union Registry the way Russian central bank reserves were frozen. What did happen:

- EU sectoral sanctions packages (starting [Council Reg. 2022/328 onwards](https://www.consilium.europa.eu/en/policies/sanctions-against-russia/)) imposed asset-freezes on listed persons/entities; if a sanctioned entity held a Union Registry account, that account would be subject to the general asset-freeze obligation (no transfers in/out) by operation of the sanctions regulation, executed by national administrators under their domestic implementing acts. This is **automatic, not discretionary** — the sanctions regulation is directly applicable.
- EUA prices dropped from ~€97 (early Feb 2022) to <€70 in early March on broader market panic, not specifically registry freezes ([Centre for European Reform 2022](https://www.cer.eu/publications/archive/policy-brief/2022/eu-emissions-trading-system-after-energy-price-spike)).
- Russian aircraft operators were already minor in EU ETS (most administered via non-EU bilateral arrangements; aviation EU ETS scope was intra-EEA only since "stop-the-clock"), so the operational impact via the registry was limited.

**I could not find specific named Russian operator entities whose Union Registry accounts were publicly reported as frozen.** Carbon Pulse, Reuters, and Commission press archives did not surface in search. **Confidence: low-medium.** This may exist behind paywalls or in DEHSt/national-administrator notices not surfaced by general search. **Recommend the brief soften the §5 step-4 language** from "the regulator froze Russian accounts" to "EU sanctions automatically freeze any Union Registry holdings of sanctioned entities" — same point, defensible.

## 4. Existing institutional sketches of tokenised compliance carbon

Almost all institutional designs target the **voluntary** market, not EU ETS compliance. Key designs:

- **JPMorgan Kinexys (Project Carbon → relaunched 2025)**: tokenises credits **at the registry layer** via partnerships with S&P Global Commodity Insights, EcoRegistry, and International Carbon Registry. Permissioned ledger (Kinexys Digital Assets). Registry retains issuance authority; tokens are wrappers ([JPMorgan whitepaper](https://www.jpmorgan.com/kinexys/documents/carbon-markets-reimagined-digital-assets.pdf)).
- **Climate Impact X (CIX, Singapore)**: centralised exchange + CIX Clear settlement layer, custodies credits across 11 registries. Not blockchain-native; T+0 settlement via internal ledger ([climateimpactx.com](https://climateimpactx.com/)).
- **AirCarbon Exchange (ACX, Abu Dhabi/ADGM)**: **first fully regulated** carbon exchange (FSRA-licensed, Nov 2022), uses DLT for clearing/settlement under traditional CLOB matching. Regulator (FSRA) is supervisor, not on-chain participant ([Ledger Insights](https://www.ledgerinsights.com/aircarbon-exchange-plans-regulated-carbon-exchange-within-abu-dhabi-global-market/)).
- **Carbonplace** (BNP, NatWest, UBS, SCB, etc.): bank-consortium credit settlement network, T+2, KYC via member banks. Not public chain ([carbonplace.com](https://carbonplace.com)).
- **EEX (compliance-side)**: regulated market under MiFID II for EUA spot+futures; auctions 100% of primary EUA supply. No tokenisation.

**Regulator's role across all of these: observer or licensor — never on-chain counterparty.** Carbon DEX's "Regulator as on-chain participant with mint/freeze/audit roles" is a **deliberate divergence** with no direct industry precedent. That's the originality angle for judges, but also the legal-purist attack surface.

## 5. MiFID II operational requirements for a carbon-trading venue

Since 3 January 2018, EU emission allowances are MiFID II financial instruments (Annex I Section C(11)) and derivatives thereof are C(4) ([emissions-euets.com](https://www.emissions-euets.com/mifid2-mifir)). A compliant venue would need:

- **Authorisation** as a Regulated Market, MTF, or **OTF** (Organised Trading Facility — explicitly available for emission allowances; OTF operator must be licensed as an investment firm).
- **Transaction reporting under [RTS 22](https://ec.europa.eu/finance/securities/docs/isd/mifid/rts/160728-rts-22-annex_en.pdf)** to home Member State competent authority by T+1, populating LEI of venue operator.
- **Pre-/post-trade transparency** (RTS 1/2).
- **Market abuse surveillance** (MAR/CSMAD apply directly to emission allowances).
- **AML/CFT** under AMLD5 (now AMLR 2024/1624 from 2027): customer due diligence, beneficial ownership, suspicious-transaction reporting.
- **Capital requirements** under IFR/IFD for investment firms.
- **Position-limit and position-reporting** regime for commodity-like instruments.

**Carbon DEX gap (if not a prototype):** would require OTF authorisation (Czech CNB or other home regulator), LEI, RTS-22 pipeline, KYC onboarding (incompatible with permissionless AMM as-is), capital adequacy, and a market-surveillance overlay. Foundry contracts on Sepolia satisfy none of these — that's fine for a demo, but call it out in Q&A.

## 6. Union Registry architecture vs. our `ComplianceRegistry` + `Regulator`

**Account types** (Reg. 2019/1122): Union allocation account, auction delivery account, EU credit exchange account, **operator holding account** (per installation), **aircraft operator holding account**, **maritime operator holding account** (added for shipping inclusion 2024), **trading account** (formerly "person holding account" — for traders), **government account** ([energimyndigheten.se](https://www.energimyndigheten.se/en/sustainability/emissions-trading/Participating-in-EU-ETS/the-union-registry/account-types/)). KYC: identity, criminal-record, beneficial ownership, fit-and-proper for representatives; competent authority approves; national administrator opens.

**Transfer flow:** account-to-account; **trusted account list** (TAL) bypasses delay; non-TAL transfers subject to **26-hour delay** + execution windows (10:00-16:00 CET). Surrender = transfer from operator account to Union deletion account; surrender deadline is 30 September (post-2024 reform). Allowances are tracked by **unique unit identifier** (no public serial-number transparency for traders). EUA = stationary, EUAA = aviation; both fungible from Phase 4 onwards for compliance.

**Our split:** `ComplianceRegistry` (whitelist + frozen flag) ≈ NA's account-status registry layer (operator/trader account + excluded/blocked status). `Regulator` (mint/freeze/audit) ≈ Commission + national administrator combined: minting maps to free-allocation issuance + auction delivery; freeze maps to Art. 30 suspension; audit maps to compliance reporting. **Structurally faithful at the role level**; flattened (no Member-State layer, no competent-authority/NA split, no 26-hour delay, no surrender-vs-transfer distinction). For a 36-hour build that's acceptable — declare the simplifications. The biggest **omission worth narrating in the pitch**: real EU ETS uses *surrender* terminology for what we call *retirement* (in `Retirement.sol`). The semantics align — both burn allowances against verified emissions — but for a MiFID-literate judge, lining the language up matters.

---

**Methodology:** EUR-Lex primary law (2003/87/EC, 2019/1122, 2010/23/EU); Commission climate.ec.europa.eu pages; ESMA RTS 22 final report; Europol newsroom; trade press (Ledger Insights, Carbon Pulse via search, Reuters via search); ICAP factsheets; emissions-euets.com glossary. **Confidence high** on §1, §2, §5, §6; **medium** on §4 (institutional designs evolve fast); **low-medium** on §3 (could not find named-entity public reporting on Russian Union Registry account freezes).

## Sources

- [Commission Delegated Regulation (EU) 2019/1122 — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019R1122)
- [Directive 2003/87/EC — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32003L0087)
- [Council Directive 2010/23/EU — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32010L0023)
- [Europol — VAT fraud carbon ETS](https://www.europol.europa.eu/media-press/newsroom/news/further-investigations-vat-fraud-linked-to-carbon-emissions-trading-system)
- [Climate Action — 2011 ETS hack](https://www.climateaction.org/news/cyber_hackers_expose_cracks_in_eu_emissions_trading_scheme)
- [EU Council — Russia sanctions Q&A](https://www.consilium.europa.eu/en/policies/sanctions-against-russia-explained/)
- [JPMorgan Kinexys — Carbon Markets Reimagined](https://www.jpmorgan.com/kinexys/documents/carbon-markets-reimagined-digital-assets.pdf)
- [Climate Impact X](https://climateimpactx.com/)
- [Ledger Insights — AirCarbon Exchange ADGM](https://www.ledgerinsights.com/aircarbon-exchange-plans-regulated-carbon-exchange-within-abu-dhabi-global-market/)
- [Carbonplace](https://carbonplace.com/)
- [emissions-euets.com — MiFID II application](https://www.emissions-euets.com/mifid2-mifir)
- [ESMA RTS 22 Annex](https://ec.europa.eu/finance/securities/docs/isd/mifid/rts/160728-rts-22-annex_en.pdf)
- [Union Registry — Climate Action EC](https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets/union-registry_en)
- [DEHSt — Union Registry](https://www.dehst.de/EN/Topics/EU-ETS-1/EU-ETS-1-Information/Union-Registry/union-registry_node.html)
- [Energimyndigheten — Account types](https://www.energimyndigheten.se/en/sustainability/emissions-trading/Participating-in-EU-ETS/the-union-registry/account-types/)
- [EEX MiFID II/MiFIR](https://www.eex.com/en/markets/mifid-ii-mifir)
- [Centre for European Reform — 2022 ETS](https://www.cer.eu/publications/archive/policy-brief/2022/eu-emissions-trading-system-after-energy-price-spike)
