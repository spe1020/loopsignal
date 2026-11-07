# LoopSignal learning base

**Status:** Phase 0 direction. Decided by Seth on 2026-11-07 (decision D-001 in [decisions.md](decisions.md)). It replaces the Supabase milestone in [`../product-preview/next-milestone.md`](../product-preview/next-milestone.md).
**Companion docs:** [event-spec.md](event-spec.md) (how records become events), [roadmap.md](roadmap.md) (Phases 1–5 and open questions), [decisions.md](decisions.md) (decision log).

## The direction

LoopSignal is building a **learning base**: a company's problem-solving memory, owned by the company.

- Every LoopSolve investigation and LoopFlow map is stored as **signed events** on a **company relay**. The relay is private and members must authenticate. Each company gets its own relay, running either on the company's hardware or on a dedicated instance we host.
- A lesson enters the learning base only **after its fix is verified**. Before anyone starts a new investigation, LoopSignal shows what the company already learned about that equipment, process or failure mode. It also flags a "closed" problem that comes back.
- LoopSignal installs it (LoopBuild) and teaches the habits that keep it alive (LoopOps is a placeholder name; Q4 is open in [decisions.md](decisions.md)). Customers own it; they don't rent it.

**We don't lead with Nostr.** Nothing customer-facing names the protocol. In this repo it's an implementation detail.

**Customer line: DRAFT until Foreman signs off.**

> "Your plant's problem-solving memory, on your server, every record signed and tamper-evident." (from the brief)

The line is accurate only for a **customer-hosted** relay. With a LoopSignal-hosted instance the data isn't on the customer's server, so "on your server" is false and must not be used. Which option the first pilot uses is open (Chief's P-3 in [decisions.md](decisions.md)). Until Seth rules, this doc shows both options and picks neither. "Tamper-evident" means each record can't be changed undetected. It does **not** mean nothing can be removed (see event-spec §11). No copy may claim that.

Today there is **no Nostr code in the repo**. LoopSolve and LoopFlow are browser-local: zod schemas in `lib/solve/schema.ts` and `lib/flow/schema.ts`, storage in `lib/loop/storage.ts`. All the guardrails in the brief apply to every phase. That includes: never publish to a public relay, no keys in the repo or logs, local-first stays intact, and the relay is the system of record.

## What this replaces

- [`../product-preview/next-milestone.md`](../product-preview/next-milestone.md) (private company workspaces and test-mode Team subscriptions) is **superseded**. It stays in the repo with a banner pointing here.
- Draft PR #27 (`codex/company-workspace`) built most of that milestone. Its `docs/company/architecture.md` (line 33) says "Keep database/application authority" and "Sensitive evidence stays in private storage, not relay payloads." **This direction reverses that decision** (D-001). One idea from #27 carries forward: a signature only shows who holds the key, and membership and role decide permission. In this design, that membership and role state is itself recorded as relay events. Whether to close #27 is Seth's call (P-1).

### next-milestone's checklist, sorted

next-milestone has seven checklist items.

| next-milestone item | Status here | Why |
|---|---|---|
| Organizations and membership | needs real work | Signed events give us actor identity. Membership, revocation and roles still have to be built. The event spec defines membership events, the relay has to enforce them (Phase 3), and the full role matrix comes in Phase 5. |
| Trusted shared storage | covered natively | The company relay is the system of record. Each company has its own relay, so cross-company references can't happen. Records are signed, so the server can't change them undetected. |
| Concurrency and audit | needs real work | The audit trail comes free: changes are append-only and signed. Stale-write detection and the conflict view still have to be built (Phase 2), and so does relay-side rejection (Phase 3). |
| Private files and recovery | needs real work | Restore is a replay of events, but someone has to do it and time it (Phase 3). Attachments need a Blossom endpoint with access checks (Phase 3). Retention and deletion need a policy (event-spec §11). |
| Explicit local import | needs real work | Phase 2: the user picks investigations, reviews a manifest and confirms. Nothing uploads silently, and local originals are never deleted. |
| One Team plan in test mode | deferred | The $299/month plan assumed SaaS. Dr Sats will propose a model for an installed, customer-owned system. This doc doesn't redesign billing. |
| Release evidence | needs real work | Its checks move into the Phase 2 and Phase 3 acceptance gates: two companies with no cross-access, a revoked member rejected, a stale write shown as a conflict, and a measured restore. |

### What signed events give us natively

These are the brief's five, each with what's still on us:

- **Audit:** every change is a signed, append-only event. Each signature proves its record wasn't altered. It doesn't prove the set of records is complete (event-spec §11).
- **Actor identity:** each event carries the signer's key. Linking that key to a person is key management (below).
- **Isolation:** one relay per company.
- **Restore:** replaying the events rebuilds everything. That holds only if backups include the events, the relay's receipts and the attachment bytes (Phase 3 drill).
- **Portability:** the customer keeps every event. Whether a quality manager can *read* them without LoopSignal is open (roadmap, Foreman's questions).

### What still needs real work

| Area | Owning phase |
|---|---|
| Role permissions: who may write, approve and grant, enforced at the relay | Phase 3 (enforcement), Phase 5 (role matrix) |
| Search and indexing: a derived index you can rebuild from events, then search across the company | Phase 3 (index), Phase 4 (search, "Seen this before?") |
| Concurrency: stale-write detection, a visible conflict, no silent overwrite | Phase 2 (client), Phase 3 (relay rejects stale writes) |
| Key management: no nsec in operators' hands, a company signer behind normal login, offboarding | Phases 1–3 use test keys only. Phase 5 has the plan. |
| Attachments: bytes on the company Blossom endpoint, access checks, bytes included in restore | Phase 3 |
| Retention and deletion: what removal and erasure mean, and how long backups keep data | Phase 3 (relay rules). Policy is open (event-spec O-4). |
| Local import: manifest, confirmation, idempotent retries | Phase 2 |
| Approval authority: an approval counts only if the signer held the reviewer role when the relay accepted it | Phase 3 (event-spec §9) |

## Hosting: what the customer is signing up for

Foreman stopped on this question in his buyer read. Where nothing has been decided, the cell says so.

| | Customer-hosted | LoopSignal-hosted (dedicated instance) |
|---|---|---|
| Where the data lives | the customer's own hardware or network | an instance we run for that one customer. The provider and region are unknown (open question). |
| Who can technically read it | whoever administers that server for the customer. LoopSignal can't, unless the customer grants access. | LoopSignal's operators can. Contract protects it, and we say so plainly (brief, Phase 5). |
| Who could drop records without it showing | whoever administers the server | LoopSignal |
| Who installs it | unknown, open question | LoopSignal |
| Who patches it | unknown, open question | LoopSignal |
| Who restores it | unknown, open question | LoopSignal (restore drill measured in Phase 3) |
| Customer IT hours | unknown, open question | unknown, open question |
| Who you call at 2am | unknown, open question | unknown, open question |
