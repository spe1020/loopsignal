# Checkpoint A implementation and evidence

Implemented: distinct `/company` experience; short problem capture; progressive investigation; assigned work; source-linked measurement/results/lessons; company/site/team; explicit reviewer grants; cookie authentication and TOTP setup; membership/invitation expiry and revocation; private file staging, immutable paths, verified checksums, export; allowlisted commands, optimistic revisions, idempotency, audit, outbox; explicit local import with manifest/mapping/provenance and unresolved sources.

`npm run typecheck`, `npm run lint`, and the 88 existing domain/storage tests passed at this checkpoint. Twelve new integration scenarios passed against real PostgreSQL 16.14 RLS and command handlers in a freshly migrated isolated database. `scripts/company/test-local.sh` records the exact reproducible command. These include actual policy-denied SQL, competing edits, member revocation, assigned participation, mixed-company relationships, full-seat invitation races, explicit reviews and lessons, bytes and import retries.

The restore exercise uses PostgreSQL `pg_dump` / `pg_restore` into a separate database plus separate filesystem source/restored bytes. It verifies SHA-256, FK relationships, exact supporting review state and cross-company denial after restore. See `evidence/restore.json` for measured duration. This is local recovery evidence; it does not prove recovery from a hosted Supabase project.

The two-browser test uses the real company UI and PostgreSQL command handlers; its authentication and invitation-token delivery transport is a Playwright-only fixture. It cannot certify secure Supabase sessions, MFA, GoTrue invitations, or Storage API policies. Supabase CLI/Docker is unavailable on this machine, and no approved development project credentials were provided. These exact checks remain blockers for a paid pilot; implementation continues to billing as requested.

Checkpoint code is reviewable, not a claim of production readiness. Browser evidence and remaining findings are consolidated in validation.md after Checkpoint B.
