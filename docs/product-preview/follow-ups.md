# Deferred legacy capabilities — do not promote until corrected

These are source-inspection findings against this branch, not claims that the September 5 audit was rerun in full. The affected tools retain their legacy URLs for compatibility but are absent from the new primary navigation, footer product links, and manufacturing walkthrough. They are not part of the subscription readiness claim.

## LS-F01 — exact-passage knowledge support

**Files:** `lib/know/retrieve.ts` (`excerptsFor`), `lib/know/interpret.ts` (`preparedAnswers`, `evidenceFor`).

Current code picks a section by query-term score and falls back to the first section. Prepared answers produce material claims independently, and `evidenceFor` connects claims only at document ID level. Thus a linked document is not proof that the displayed excerpt supports the claim.

**Reproduction/acceptance fixture:** for each prepared question (start with torque and thread GO/NO-GO), compare every number, condition, and instruction in the answer to the exact emitted excerpt. Remove the supporting section while keeping a high-scoring irrelevant section; also supply current conflicting passages. Missing or contradictory support must produce an explicit unresolved state rather than an answered state. Add passage IDs/version/source ranges and claim-to-passage references. Superseded text cannot substitute for current requirements. Test the display and export, not just retrieval ranking. No LLM integration is needed.

**Promotion gate:** all prepared answers and fallback answers have material-claim support tests, missing/contradictory-source browser checks, and source passages available beside the answer. Until then, do not add LoopKnow to the main product journey.

## LS-F02 — allocated-volume split sourcing and no-eligible state

**File:** `lib/source/engine.ts` (`calculateCost`, `buildDualSource`, `compareQuotes`).

`compareQuotes` computes each supplier at total demand. `buildDualSource` blends those full-demand unit prices without repricing the allocated quantity, and scales freight from the full-demand cost. Eligibility constraints are not re-evaluated for each allocation. `recommended: ranked[0]` is unconditional.

**Reproduction/acceptance fixture:** two suppliers each quote $10 below 10,000 units and $8 at 10,000+. At demand 12,000 and a 50/50 split, both receive 6,000; each must cost $10/unit before other charges, not the $8/unit full-demand price. Add allocated MOQ, annual capacity, lead time, qualification, quote validity, and freight fixtures. Annual freight and one-time tooling need their actual allocated contract treatment, not automatic proportional scaling. Make every candidate ineligible: the result must explicitly say no eligible recommendation, distinguish comparison from approval, and expose unmet conditions.

**Promotion gate:** allocation-specific pricing/constraint tests; correct first-year totals and source assumptions; no-eligible browser state; recommendations never labeled fully acceptable when required constraints fail. Keep it outside the promoted workflow until those pass.

## Individual browser storage boundary

The shared adapter now reports failed/non-durable writes honestly and the provider offers retry/export. Local multi-tab concurrency, cross-browser discovery, automatic reconciliation between an old fallback backend and IndexedDB, browser eviction, and backed-up attachment bytes are not guaranteed. Do not describe this as trusted shared company storage. Address conflict detection and explicit migration/recovery in the [hosted milestone](next-milestone.md), while retaining old source documents.
