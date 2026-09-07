# Paid-pilot blockers

The application is deliberately labeled **synthetic evaluation / Stripe test mode**. It must not hold real customer data or collect live payments on the strength of local tests alone.

- [ ] Start the pinned Supabase CLI stack with Docker/Podman. CLI 2.116.0 accepted the corrected config, then returned `LegacyDockerLifecycleInspectError: docker: command not found (podman also not found)`. Local migration/policy tests used PostgreSQL 16.14 with provider-schema stand-ins; Supabase config now targets PostgreSQL 17.
- [ ] Exercise real GoTrue cookie sessions, confirmation links, refresh/logout, two independent sign-ins, MFA enrollment/challenge, revoked sessions/memberships, and local SMTP invitations end to end through the deployed API route.
- [ ] Exercise PostgREST and Supabase Storage API denials with two organizations/roles, including direct guessed IDs, deleted/revoked access, upload finalization retries and immutable bytes. Native SQL policy checks passed, but cannot replace these checks.
- [ ] Select/verify a hosted development region and restricted database login; test verified TLS and secret isolation in the intended host. No project was provisioned or production migration run.
- [ ] Run records **and object bytes** restore on an isolated Supabase project. Verify Auth relationships, RLS/API/private-object permissions, checksums, review state, latest deletion-ledger replay and membership revocation. Establish measured hosted RPO/RTO, backup access/expiry and restore procedure.
- [ ] Deploy/review maintenance scheduling, retention purge and operational retry monitoring. The provided operator tools are local-apply only; public copy must not promise an active hosted purge or backup schedule.
- [ ] Run actual Stripe **test** checkout, portal, signed webhook retries/order, payment failure, cancellation, renewal/reactivation, and reconciliation. No Stripe credentials/customer operations were available in this task. Tests use the real signature library plus synthetic provider responses and real database state.
- [ ] Complete independent security/design review of this draft, including self-review policy, all-member internal visibility, file handling, export limits and operational retention. Provider certifications do not certify LoopSignal.

Later scope: paid production onboarding, live billing, enterprise plans/annual pricing, independent-reviewer policy options, external scoped guests, hosted process maps, scalable large exports/backups, enterprise SSO, Nostr transport/keys/relays, LLM execution and autonomous external actions.
