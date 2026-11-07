# Learning base roadmap

**Status:** Phase 0. Copied from Seth's kickoff brief (2026-11-07) and adds no scope. Every PR runs the same loop: Prep → Sous → domain review → human merge (Seth) → SHIP. No product code lands before Phase 0 merges.
**See also:** [README.md](README.md), [event-spec.md](event-spec.md), [decisions.md](decisions.md).

## Phase 0: Direction and event spec (docs only)

**Owner:** Prep defines the gates. Sous writes. Chief checks consistency. Foreman reviews customer-facing language.

**Acceptance gate:**
- A reviewer can take any field in `lib/solve/schema.ts` and find where it lives in an event.
- The fictional LS-001 investigation can be fully expressed as the example events.
- Customer-facing wording passes Foreman's review.

## Phase 1: Event codec and local signing (library only)

**Owner:** Sous.

- Add `lib/nostr/`, choosing a well-maintained library such as `nostr-tools` or NDK. Document the choice.
- Write pure functions in both directions: domain records → unsigned events, and events → domain records. Validate with the existing zod schemas.
- Generate keys and sign events locally in tests only. No relay connection yet.

**Acceptance gate:**
- Round-trip tests pass: the LS-001 sample and the LoopFlow sample both survive record → events → record with no loss.
- Tests cover version tags, link integrity, and rejection of malformed events.
- The existing app behaves identically.

## Phase 2: Opt-in sync to a configured relay

**Owner:** Sous. Prep owns the UX gate.

- Add a "Connect a relay" setting and a NIP-42 auth handshake.
- Add a sync queue with clear statuses (pending, synced, conflict, failed) and idempotent retries.
- Explicit import: the user picks local investigations, reviews a manifest, and confirms before anything is uploaded.
- Test against a relay running locally (for example khatru or strfry in Docker).

**Acceptance gate:**
- Two browsers with two test keys edit the same investigation through a local relay. Both see durable shared state, and a stale write shows a visible conflict instead of silently losing data.
- With the relay offline, the app keeps working locally and syncs once the relay is back.
- If no relay is configured, the UI says "unavailable." It never pretends the work was saved remotely.

## Phase 3: Company relay MVP (`relay/` workspace or separate repo, see Q1)

**Owner:** Sous. Chief flags infrastructure risk.

- Build on a khatru-based Go relay, similar to HAVEN:
  - NIP-42 auth required for every read and write.
  - Member allowlist.
  - Write rules by role, enforced in relay hooks (for example, only reviewers can publish verification and approval events).
- Blossom endpoint for attachments, with access checks.
- **No outbox and no broadcasting.**
- Derived index (SQLite or Postgres) built from events. It must be rebuildable from scratch, and the rebuild must be tested.
- Backup and replay script, with a recorded restore test covering events and attachment bytes.

**Acceptance gate:**
- Two companies on two relays have no cross-access.
- A revoked member is rejected.
- A non-reviewer's approval event is rejected.
- The index rebuild matches the original.
- The restore drill is documented with measured time.

## Phase 4: The learning base view

**Owner:** Prep defines it. Sous builds. Foreman reviews.

- Approved lessons are searchable across the company by equipment, process, product, failure mode, and cause category.
- "Seen this before?" panel: when a new problem statement is written, show related verified lessons and past investigations.
- Recurrence flag when a closed problem's signature shows up again.
- Each lesson links back to its evidence, causes, actions, and verification.

**Acceptance gate:**
- Seed the relay with 3+ fictional investigations. A new, related problem surfaces the right prior lesson, with links that resolve.

## Phase 5: Identity for real plants (plan first, then build)

**Owner:** Prep and Chief produce the plan. Seth approves before Sous builds.

- Operators on the floor never handle an nsec. The plan is a company-run NIP-46 remote signer behind normal email or SSO login.
- Write a role matrix: owner, manager, collaborator, action participant, viewer, reviewer.
- Offboarding: removing someone from the allowlist revokes access, while their past signatures stay valid in the audit trail.
- Confidentiality statement for the security page. Customer-hosted relays give the strongest guarantee. A LoopSignal-hosted relay is protected by contract; we can technically read it, and we say so plainly.

## Parallel tracks (non-blocking)

- **Foreman:** once Phase 0 lands, review the copy on the home page, `/security` and `/pilot` for the "learning base you own" framing.
- **Dr Sats:** propose a pricing model for an installed, customer-owned system. Recommendation only.
- **Growth:** write one paragraph of positioning that sets "learning base" apart from knowledge bases.
- **Chief:** keep the decision log in [decisions.md](decisions.md).

## Open questions

Chief collects the answers in [decisions.md](decisions.md).

**From the brief:**

| # | Question | Who decides |
|---|---|---|
| Q1 | Should the company relay live in this repo (monorepo) or in its own repo? | Seth. The brief also says "Prep decides" in Phase 3. Seth names the decider (P-2). |
| Q2 | For the first pilot, will the relay be customer-hosted, hosted by us, or both? | Seth (P-3) |
| Q3 | Should the public fictional `/workspace` demo eventually run against a demo relay, or stay browser-only? | Seth (P-4) |
| Q4 | Should we drop the word "LoopOps" now that the product sustains itself, or keep it as the methodology name? | Seth (P-5). The docs use "LoopOps" as a placeholder until then. |

**From Foreman's buyer read (logged here, not answered):**

| # | Question | Who decides |
|---|---|---|
| F1 | Can a quality manager read the data without LoopSignal? That would take a portable, human-readable export. | Seth (Prep drafts) |
| F2 | How do we avoid double entry next to the CAPA module in an ERP or QMS? | Seth (Prep drafts) |
| F3 | How many investigations does it take before "Seen this before?" returns anything? | Prep (Phase 4) |

## Future option: FIPS

FIPS is out of scope for now (guardrail 6). We keep it here as a future option for offline and multi-site plants. No phase depends on it, and nothing gets built that assumes it.
