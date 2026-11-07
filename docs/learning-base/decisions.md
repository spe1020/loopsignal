# Learning base decision log

Owned by Chief. Seeded from Chief's draft of 2026-11-07, which lands with Phase 0 as allowed by gate G1. Source brief: `loopsignal-learning-base-kickoff.md` (Seth, 2026-11-07).
The earlier log, [`../product-preview/decisions.md`](../product-preview/decisions.md), covers the product-preview architecture. It isn't migrated here.

---

## D-001 — Build a customer-owned learning base on Nostr, not a Supabase multi-tenant SaaS

- **Date:** 2026-11-07 · **Owner:** Seth · **Status:** decided
- **Context:** `docs/product-preview/next-milestone.md` specified Supabase Auth/Postgres RLS/Stripe
  test-mode Team plan ($299/mo). Draft PR #27 (`codex/company-workspace`, last updated 2026-09-07)
  implements most of it.
- **Alternatives:** (a) ship PR #27's hosted SaaS; (b) signed events on a per-company relay.
- **Reasoning (per brief):** signed events give the audit trail; approvals are reviewer signatures;
  isolation is physical (one relay per company); restore is replay; customer keeps data on exit.
  Matches the install-and-own sales motion (LoopBuild installs, LoopOps sustains).
- **Reverses:** PR #27 `docs/company/architecture.md:33` ("Keep database/application authority…
  Sensitive evidence stays in private storage, not relay payloads"). The Phase 0 README must say so
  explicitly, not only supersede `next-milestone.md`.
- **Carries forward from PR #27:** "A signature establishes key control; current membership/policy
  determines permission." Approval = signature by a key holding reviewer role at that time, per
  role state that is itself recorded as relay events (otherwise rule 5 — relay is system of record —
  fails).
- **Expected outcome:** Phase 0 spec merged; Phases 1–4 deliver a working learning base on a local relay.
- **Follow-up review:** at Phase 0 merge, and again at Phase 3 gate (infra/ops burden).

## Pending — need Seth

| # | Question | Chief recommendation | Status |
|---|----------|----------------------|--------|
| P-1 | PR #27 disposition | Close unmerged after Phase 0 merges (Prep concurs, event `72bf5895`); keep branch; harvest `permissions.md` and restore evidence as Phase 3/5 inputs | open |
| P-2 | Relay in monorepo or own repo (brief lists it both as Seth's question and "Prep decides" in Phase 3) | Own repo; Seth names the decider | open |
| P-3 | First pilot: customer-hosted, us-hosted, or both | Us-hosted dedicated instance first; same binary for customer-hosted | open |
| P-4 | Public `/workspace` demo on a demo relay? | Stay browser-only through Phase 4 | open |
| P-5 | Drop "LoopOps"? | Keep as methodology name | open |
