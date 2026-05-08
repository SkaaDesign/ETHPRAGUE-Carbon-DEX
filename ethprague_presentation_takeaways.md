# ETHPrague 2026 — Winning Project Takeaways
### What Carbon DEX Must Do to Win

*Synthesized from 15 ETHRes/ETHPrague winner one-pagers. Apply these patterns to our pitch, demo, and docs.*

---

## 1. Lead with a TL;DR that has a clear claim

Every strong one-pager opened with a **bold, specific, falsifiable finding** — not a vague promise.

| What winners did | What we must do |
|---|---|
| *"Only mandatory encryption + uniform permutation defuses all four canonical MEV classes simultaneously"* | *"Carbon DEX is the first DEX where the regulator is a first-class on-chain participant — not a hostile force"* |
| *"No single ZKP winner — pick by bottleneck"* | Make our one-liner equally concrete. Not "we improve carbon markets." |

**Action:** Write a 2-sentence TL;DR that a judge can quote in their notes. Put it at the top of every artefact — pitch deck slide 1, README, Devfolio description.

---

## 2. Name the empty quadrant explicitly

The most persuasive papers opened by defining the space and showing it was unoccupied. They didn't just describe their solution — they showed *why nothing else fills the gap*.

**Action:** Reproduce the 2×2 competitive matrix in the pitch (voluntary vs. compliance × permissionless vs. permissioned). Point to our empty cell. Say it out loud: *"Nobody is here. We are."*

---

## 3. Structure = Problem → Gap → Solution → Proof

Every poster followed the same spine:
1. **Problem** — stated with numbers or a concrete failure mode
2. **Why existing solutions fail** — specific, not generic
3. **Our contribution** — one crisp claim
4. **Evidence** — even a toy demo or diagram counts at hackathon scale

**Action:** Map our pitch to this four-part structure. Don't open with architecture. Open with: *"Compliance carbon is a €900B market. None of it trades on-chain. Here's why, and here's what we built."*

---

## 4. Make the regulator role legible in one diagram

Papers that worked had a single architecture diagram that was self-explanatory — labels on every actor, arrows showing data/value flow, no orphan boxes.

**Action:** Build one canonical "three-role diagram" (Company A → DEX → Company B, Regulator overhead with mint/pause/audit arrows). Use it on the pitch slide, in the README, and on screen during the live demo. Every judge should be able to draw it from memory after the presentation.

---

## 5. Quantify the stakes — even approximately

Strong posters gave numbers: *"32 ETH validator stake," "5x cost gap," "375x larger market."* Vague claims ("big market," "more efficient") registered as noise.

**Action:** Front-load these numbers in the pitch:
- EU ETS market size: ~€900B annual volume
- Compliance vs. voluntary: compliance is ~375× larger
- Number of EU-regulated companies subject to ETS: ~10,000+
- Our demo: 1,000 credits minted, 1 trade, 1 retirement, 1 live freeze

Even demo-scale numbers anchor the story.

---

## 6. Make the live demo a proof, not a tour

The best projects used their demo to *prove* their core claim, not just show features. The MEV paper ran live-chain calibration. The ZK voting paper showed an actual on-chain verification.

**Action:** The demo must climax at the **live freeze** — regulator pausing a suspicious trade on stage. That single moment proves the architecture. Everything before it is setup. Script it: minting → trade → freeze → retirement. Four beats. Practice transitions.

---

## 7. Address the "why would anyone use this" objection head-on

Multiple papers stated the adoption objection explicitly and then answered it — *"Current light-client designs weaken security; ZK proofs offer a path"* — rather than pretending the objection didn't exist.

**Action:** Pre-empt the *"isn't on-chain carbon dead?"* question. Put a single slide in the deck that says: *"You're thinking of the wrong market."* Then show the voluntary vs. compliance split. Disarm it before a judge raises it.

---

## 8. Make verification/auditability a feature, not a footnote

The Sourcify bounty is $4,000. But more importantly: every credible paper emphasized that their results were independently reproducible. Open code, verified contracts, public data.

**Action:**
- Verify all contracts on Sourcify — make this a visible step in the demo
- Link to deployed contract addresses in the Devfolio submission
- Add a "Public Audit Log" view to the frontend — judges should be able to see every mint, trade, and retirement without connecting a wallet

---

## 9. Each role needs one "hero action" in the UI

Papers that demonstrated user flows showed a single, decisive action per actor — not a feature list. The ZK Census paper had: *Create survey → Submit vote → Verify result.* Clean.

**Action:** Define the hero action for each of our three roles:
- **Regulator:** Freeze a suspicious trade (the live demo moment)
- **Company A:** Retire a credit (permanent, irreversible, on-chain)
- **Company B:** Buy allowances to meet compliance (one swap, one receipt)

The frontend only needs to make these three actions work flawlessly. Everything else is nice-to-have.

---

## 10. Acknowledge future work honestly — it builds credibility

Every serious paper had a "Limitations / Future Work" section. Projects that pretended to be complete looked naive. Projects that said *"we scope to X; Y is future work"* looked rigorous.

**Action:** Add one slide or section: *"What we punted."* Example: real EU registry oracle, MiCA compliance audit, production-grade KYC. Framing scope honestly shows you understand the full problem space.

---

## 11. Institutional aesthetic signals seriousness

These were research symposium posters — clean, sparse, structured. No gradients, no marketing language. The design communicated: *this is rigorous work.*

**Action:** Use the Scandinavian-industrial UI direction from the brief. No crypto-kitsch. Judges from TradFi or policy backgrounds will respond to institutional design. The UX prize ($500) goes to the cleanest flow, not the flashiest interface.

---

## 12. Multi-prize coherence beats chasing individual bounties

The strongest projects weren't built *for* prizes — the prizes fit naturally because the project was coherent. The ZK Census paper fit privacy, identity, and governance tracks simultaneously without feeling forced.

**Action:** Our natural prize stack is: **Future Society + Network Economy + Sourcify + Best UX Flow.** Build the project right; the prizes follow. Don't add ENS or Apify unless they deepen the story — a bolt-on feature for a bounty reads as exactly that.

---

## Quick Checklist Before Submission

- [ ] TL;DR is one sentence, concrete, quotable
- [ ] Competitive 2×2 matrix is in the deck
- [ ] Three-role architecture diagram exists and is self-explanatory  
- [ ] Market size numbers are in the opening slide
- [ ] Demo script is: mint → trade → freeze → retire (4 beats, practiced)
- [ ] "Isn't carbon dead?" objection is answered before judges ask
- [ ] All contracts verified on Sourcify; addresses linked in submission
- [ ] Public audit log view works without a wallet
- [ ] "Future work" section exists and is honest
- [ ] UI is clean and institutional — no crypto-kitsch

---

*Source: ETHRes 2026 winner one-pagers (15 projects). Compiled for Carbon DEX team kickoff, 2026-05-08.*
