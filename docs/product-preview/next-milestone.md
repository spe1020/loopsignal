# Private company milestone — implementation landed in a draft

Base: PR #26 merge `2b27076f32bd775c55695c41bfb6a60ff0b83256`. The isolated `codex/company-workspace` branch implements both checkpoints for review. See [setup](../company/README.md), [validation](../company/validation.md), [permissions](../company/permissions.md), and [pilot blockers](../company/pilot-blockers.md).

- [x] Explicit company/site/team, current memberships, role matrix, separate reviewer authority and full/lightweight seats.
- [x] Authenticated company UI separate from the public example; short capture, progressive edit, assigned work, results and exact-review lessons, shared reload, conflicts, export, recovery and guarded Duplicate.
- [x] Allowlisted server commands, expected revisions, idempotency, transactional aggregate/relationship writes, protected audit, outbox and reauthorization of delayed work.
- [x] Actual PostgreSQL tenant/role/reference policy tests with synthetic organizations and multiple roles, including forged writes and stale memberships.
- [x] Private immutable file staging/finalization, server-verified checksums, source-loss/removal invalidation, safe downloads, explicit source reattachment and recovery export.
- [x] Explicit local import, destination manifest, member mapping, ID/reference remapping, original content/schema/checksum provenance, untrusted local decisions and idempotent retry.
- [x] Isolated local PostgreSQL records plus filesystem bytes restore; checksum, relationship, review, tenant-denial and newer deletion-ledger checks.
- [x] Test-only Team billing implementation and local signature/lifecycle/ownership/race tests; coherent read-only/export grace states.
- [x] Two-browser native harness through authored problem → action → measurement → review → closure → approved lesson, plus save/conflict and responsive checks. Actual synthetic SMTP sink delivery is tested separately.
- [ ] Real Supabase Auth/PostgREST/Storage API acceptance on PostgreSQL 17. Docker/Podman is missing; no hosted development credentials were supplied.
- [ ] Real Stripe test-account checkout/portal/webhook lifecycle and reconciliation evidence.
- [ ] Hosted region/TLS/secrets, backup access, retention scheduling, isolated records-and-Storage restore, independent security review and operational readiness.

**Merge readiness:** draft review only until the unresolved integration/security checks are addressed. **Paid-pilot readiness:** blocked. The current software remains a clearly labeled synthetic evaluation; no live subscription availability is advertised. No merge, production deployment/migration, real invitations or live charges were authorized or performed.

Later work: independent-review policy options, external guests, hosted process maps, scalable exports/backups, Plant/Enterprise, annual plans, SSO, agents and private Nostr transport. The v1 command/outbox contract exists; it grants no autonomous external-action authority.
