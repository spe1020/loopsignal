# Company milestone validation — 7 September 2026

Work began from fetched `origin/main` at `2b27076f32bd775c55695c41bfb6a60ff0b83256` (PR #26) in an isolated `/private/tmp/loopsignal-company` worktree, branch `codex/company-workspace`. The user's original `codex/product-preview` checkout remained clean. Installed Next.js 16.3.0 docs and the merged domain/storage implementation were read before editing. No production migration/deployment, real invitation or live billing operation was performed.

## Milestone checks at `25ec683`

| Command / environment | Actual result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed. |
| `NEXT_PUBLIC_SITE_URL=http://localhost:3123 npm run build` | Passed; 39 generated pages, company and Stripe routes included. |
| `npm test` without database configuration | 90 passed, 20 database-dependent cases skipped. The 88 merged tests still pass; two signature/configuration cases run without SQL. |
| `PGPORT=55432 npm run company:db:test` | 22 passed in three files against freshly migrated PostgreSQL 16.14, including the 20 database-dependent cases and the two signature/configuration cases. Final database: `loopsignal_test_1788798914_18353`. This is 110 distinct Vitest cases across both commands, not 112. |
| Company Playwright journey, production build, 1440 / 768 / 375 px | Six passed: unavailable state plus the two-session authored workflow on each viewport. |
| Complete Playwright suite in configured development mode | 79 passed, 8 skipped in 1.8 minutes across 1440 / 768 / 375 px. Skips: three opt-in provider cases, three existing opt-in screenshot cases, and two mobile-only stopwatch cases on larger viewports. |
| `git diff --check` | Passed. |

The integration runner creates a new synthetic database on every run, applies **the real application migrations and RLS**, uses `SET LOCAL ROLE loop_app` for application commands, and exercises direct `authenticated` SQL separately. The provider-owned `auth.users`/Storage tables are minimal native test stand-ins. Neither mocked policies nor UI controls establish these SQL results; conversely, these results do not prove GoTrue/PostgREST/Storage HTTP behavior.

The native cases cover two organizations; owner, explicit reviewer, collaborator, participant, viewer and billing roles; guessed/mixed IDs; current and revoked memberships; direct protected writes; command replacement/forged approvals; concurrent revisions; idempotency and changed-payload rejection; per-action review readiness (including unrelated missing bytes); edit/revert/reopen history; exact-review lessons; imports, ID mapping and duplicate provenance; private stages/finalization/checksums; ready-file SQL reads allowed for an authorized member and denied for a foreign JWT; search/export/queued-work denial; invitation recipient/expiry/revocation and concurrent seat reservations. PostgREST's JSON `request.jwt.claims` format has an authorized/foreign SQL regression alongside the server's transaction-local subject.

Two SMTP scenarios deliver an actual synthetic invitation with Nodemailer to a loopback `smtp-server` sink and check idempotent consumption, token removal from completed jobs, and revoked delivery denial. No real recipient was contacted. The browser harness substitutes session identity and token retrieval; SMTP delivery is a separate real local test.

Billing tests use the real Stripe SDK signature verifier with synthetic provider responses and actual PostgreSQL transactions. They cover live-key/event rejection, invalid signatures, current customer/price/subscription ownership, concurrent checkout reuse, portal idempotency, duplicate/out-of-order events, reconciliation, failure, non-extending grace, cancellation, reactivation and capacity races. They are not evidence of a Stripe test-account checkout or portal interaction.

## Browser and design evidence

Reproduce the native browser run with the emitted database URL exported as COMPANY_TEST_ADMIN_URL and COMPANY_DATABASE_URL, a local Next server, and:

```sh
PORT=3124 npx playwright test --project=desktop-1440 --project=tablet-768 --project=mobile-375
```

The company test uses two independent BrowserContexts and real database commands through a test-only intercepted transport. New company → explicit reviewer grant → invitation → first problem → source evidence and recoverable file upload → colleague's assigned action → unit/period/source-linked measurement → explicit review → closure → approved lesson all persist to PostgreSQL. It follows the supporting review, reloads the record, injects failed capture/save/upload, exports retained bytes, checks first-capture draft retention across views, blocks Duplicate, forces a competing write and delayed conflict reload, then deliberately saves the retained draft. Billing UI states include unentitled, pending, active, past-due and cancelled. Reduced motion is enabled, keyboard focus is visible, and the tested viewport has no document-width overflow. No company localStorage copy is created.

Real screenshots generated by that journey:

| State | Desktop | Tablet | Phone |
| --- | --- | --- | --- |
| Closed improvement / approved lesson | [1440 px](screenshots/approved-lesson-desktop-1440.png) | [768 px](screenshots/approved-lesson-tablet-768.png) | [375 px](screenshots/approved-lesson-mobile-375.png) |
| Past-due / export grace | [1440 px](screenshots/billing-grace-desktop-1440.png) | [768 px](screenshots/billing-grace-tablet-768.png) | [375 px](screenshots/billing-grace-mobile-375.png) |

Visual inspection confirmed the industrial palette/type, clear synthetic/private labeling, responsive stacking, readable decision/source content and horizontally scrollable section navigation. This is not a formal accessibility audit.

The first broad **production-local** browser run finished with 61 passed, 18 failed and 8 skipped. Traces identify every failed console assertion as local 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js`; workflow assertions completed. These hosted Vercel endpoints are not served by `next start` on loopback. This result is retained as a limitation, not counted as a passing production-wide test. The company cases passed in that run because company analytics are suppressed. The full suite was then run with its configured `next dev` environment, without changing workflow assertions or adding analytics response mocks.

Development findings corrected before the final run included driver JSON double-serialization, a row lock whose UPDATE policy wrongly excluded collaborators, current PostgREST JWT claim decoding, a Save/reload race, incomplete upload navigation, first-capture draft loss on internal view changes, and per-action checks reading unrelated source bytes. Older interim totals are historical evidence only.

## Actual isolated recovery

The test runs `pg_dump` and `pg_restore` into a different database and restores real bytes into a separate filesystem object store. It verifies the file SHA-256, foreign-key relationships, exact current review, and post-restore cross-company RLS denial. A second isolated restore overlays a newer deletion ledger and verifies that the deleted record stays tombstoned and its file is not restored.

The milestone exercise took **830 ms** for the tiny fixture and restored **one file**. This duration includes backup and both restore/deletion checks; it is not a hosted RTO or scale measurement. See [machine-written evidence](evidence/restore.json) and the [runbook](recovery.md). No daily backup schedule, hosted RPO, encrypted artifact store or Supabase Storage-byte restore is claimed as demonstrated.

## Exact external gaps and readiness

The pinned Supabase CLI 2.116.0 was installed. Current generated config corrected the stack to PostgreSQL 17 and `[local_smtp]`. `npx supabase start` then stopped with `LegacyDockerLifecycleInspectError: failed to inspect container health: docker: command not found (podman also not found)`. No approved hosted development credentials were supplied. The opt-in `e2e/company-supabase.spec.ts` contains actual session/API/private-object checks without route interception and remains unrun. MFA enrollment/challenge, refresh/logout, hosted TLS, PostgREST/Storage HTTP denials and an isolated Supabase records-plus-bytes restore remain required.

No Stripe test secret, price or webhook credentials were available. Actual test checkout, portal, CLI delivery/retry and provider lifecycle checks remain unrun. Region, backup access/expiry, secret rotation, retention scheduling, monitoring and independent security/design review are also unresolved. See the [complete paid-pilot blockers](pilot-blockers.md).

**Merge readiness:** reviewable draft, not merge-ready until the unresolved integration/security checks and review findings are addressed. **Paid-pilot readiness:** blocked; synthetic data and Stripe test mode only. Passing local commands do not authorize real customer data or live charges.

## PR #27 review corrections — 7 September 2026

- [Analytics URL comment](https://github.com/spe1020/loopsignal/pull/27#discussion_r3951541115): both Vercel SDK callbacks now use the same guarded parser. Public relative URLs resolve against the browser origin and lose query/fragment data. Malformed or non-HTTP(S) URLs are dropped without throwing. An event is also dropped when either its URL or the current page is private, including delayed company events after navigation to a public page. Thirteen regression cases cover these boundaries.
- [Billing SQL comment](https://github.com/spe1020/loopsignal/pull/27#discussion_r3951541063): PostgreSQL 16.14 accepted the original table definition in a rolled-back `CREATE TABLE` check; omitted referenced columns use the referenced primary key. The migration now places each column on its own line and names `organizations(id)` and `memberships(org_id,user_id)` explicitly. This clarifies the existing schema without changing its constraints.

Follow-up validation: `npm test` **103 passed / 20 database-dependent skipped**; `npm run company:db:test` **22 passed**, applying both migrations to fresh native database `loopsignal_test_1788800554_21192`. There are **123 distinct Vitest cases** across these runs (two signature/configuration cases overlap). `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. The rerun also repeated the records/bytes/deletion-ledger restore successfully; its tiny fixture took **367 ms**, with [separate machine-written evidence](evidence/pr27-review-restore.json). Browser suites were not repeated for these parser/schema-clarity changes; their milestone evidence remains above. Provider acceptance and paid-pilot blockers remain unchanged.
