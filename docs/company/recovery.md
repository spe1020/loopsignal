# Recovery, retention and operational boundaries

## Data locations, transport and secrets

No hosted Supabase project or region was configured in this task. Proposed initial pilot region: explicitly selected AWS `us-east-1`, subject to the customer's residency requirements. Verify the actual project region and backup/export locations before real data. Supabase documents a single primary project region; a broad geographic grouping is not a residency guarantee. [Regions](https://supabase.com/docs/guides/platform/regions).

Hosted application-to-Auth/Storage traffic requires HTTPS; SQL requires certificate-verified TLS. Secure HTTP-only same-site cookies and Auth refresh rotation protect sessions; MFA enrollment is available, with enrolled factors required on subsequent sessions. Provider MFA enforcement, logout/refresh/revocation behavior and production HTTPS must still be tested. The application checks current membership on every authorized operation regardless of token role claims.

Supabase's published DPA describes AES-256 disk encryption and encrypted network links. This is provider encryption at rest, not application end-to-end encryption and not certification of LoopSignal. Local synthetic PostgreSQL/filesystem test data is not claimed to be encrypted by this application. [Supabase DPA](https://supabase.com/downloads/docs/Supabase%2BDPA%2B231211.pdf).

Database login, service storage key, Stripe test secret and webhook secret remain server-only. No service secret is sent to the browser or stored in source control. The application login may assume only loop_app. Storage's privileged key is used only after explicit company/role/reference checks; the browser has no storage write grants. Restrict deployed environment/project access, rotate keys after exposure, separate development from production, and never copy synthetic passwords into real accounts. Raw SQL/provider errors and evidence text are omitted from telemetry.

## File lifecycle

Upload is limited to 10 MiB, PDF/PNG/JPEG/plain text/CSV. Magic headers are checked for binary types, and content is served as a download with `application/octet-stream`, nosniff and a sandbox policy. There is no inline active-content preview, antivirus claim, or document sanitization claim. Add operational malware scanning before accepting uncontrolled real-world files if pilot security review requires it.

A staged attachment has a new immutable UUID/path/version. It cannot serve as usable evidence. Finalization reads back bytes and computes SHA-256 on the server before the authoritative metadata/revision commit. A crash after object upload can retry finalization: existing bytes must have the same checksum; they are never overwritten. Retry retains the selected File in the current editor. On reload, unfinished uploads remain visibly staged; select the file again or remove the staged reference and stage a new one. Replacement always creates a new object.

Downloads pass through current membership checks; the app does **not** issue signed URLs. Revocation stops new app requests and storage-policy reads. It cannot claw back previously downloaded bytes or stop an already-authorized in-flight response. Explicit source removal invalidates affected reviews before the transaction commits, marks the object deleted and queues physical deletion. The source-file checker detects missing/corrupt bytes, marks them missing and withdraws affected approval. Reverting data or replacing bytes cannot revive a withdrawn decision.

## Retention policy for this synthetic milestone

| Data | Retention / action |
| --- | --- |
| Active company records and ready files | Retained while the workspace exists; subscription cancellation alone never deletes them. |
| Failed payment, cancellation or expired evaluation | No writes; 30-day read/export grace, then record access suspension. Current membership still applies. |
| Explicit record deletion | Hidden from normal/API/storage reads immediately. Tombstone and object deletion jobs are committed. |
| Deleted record body and import provenance | Operator purge after 30 days; no automatic hosted purge has been deployed. |
| Deleted private objects | Idempotent outbox deletion, normally on next authorized job run. A revoked initiator leaves a failed job for operator review; the 30-day purge also removes bytes. |
| Staged uploads | 24-hour recovery window. Maintenance removes abandoned bytes and marks unresolved sources missing. |
| Search/derived indexes | No external search/analytics/realtime index. Relational ID/edge entries contain no evidence text and remain as history/tombstone references. |
| Audit, receipts, deletion ledger | Retained for the synthetic workspace's lifetime. IDs/revisions/actors, no evidence text; necessary to honor deletion after restore. Define a customer-specific audit retention contract before paid rollout. |
| Backup artifacts | Proposed daily backups, 30-day expiry; no hosted backup schedule/retention policy has been deployed. |

`npm run company:maintenance` previews abandoned/purge counts with separate COMPANY_MAINTENANCE_DATABASE_URL operator credentials. `-- --apply` is restricted to loopback databases and the local Supabase object provider in this milestone. Hosted purge needs reviewed operator execution and a verified scheduler before a paid pilot. The public app does not claim automated retention is already running. A deletion request after access suspension must be handled by the operator using the retained organization/deletion ledger; owners may revoke membership even during grace.

## Backup procedure

Supabase database backups contain storage metadata, **not attachment bytes**. Custom-role passwords must be re-established after restore. Retention/features depend on provider plan; verify the selected project's actual controls. [Database backups](https://supabase.com/docs/guides/platform/backups).

1. Use a dedicated operator backup identity in the approved region. Store encrypted backup artifacts outside the live project's failure domain; limit access to designated operators, use MFA, and log downloads/restores. Keep its secrets outside the web runtime.
2. Put the application into maintenance for the backup window. `scripts/company/recovery.ts` takes SHARE locks on record/file/deletion tables, captures a `pg_dump` and ready source bytes, and writes a manifest with checksums. It stops rather than silently skipping a missing source. Immutable storage paths and locks bind the selected bytes to database metadata. Large deployments need a later scalable snapshot method; this synchronous operator utility fits a small pilot.
3. Run `COMPANY_BACKUP_DATABASE_URL=... npm run company:backup -- /secure/path`. Source credentials go through the environment, not shell command output. Directory/file permissions are 0700/0600, but encryption/key custody is an operator requirement, not provided by this utility. Export the current deletion ledger separately after the snapshot and retain it through the backup expiry period.
4. Confirm the manifest, checksum every object, and restore into a fresh isolated database and private bucket before declaring the backup recoverable. Never restore over production as a test.

## Restore procedure and measured limits

`restore()` refuses a non-local or non-empty target. It applies `pg_restore`, replays the latest deletion ledger **before** object exposure, restores eligible bytes and verifies checksums/relationships. The integration test checks current review identity and cross-company RLS denial after restoration. A hosted operator must additionally provision/restrict the isolated project, restore Auth identities and sessions appropriately, recreate the restricted login, restore private Storage objects/metadata, verify PostgREST/Storage policies, reapply all newer tombstones, revoke old sessions/URLs, and reconcile subscriptions from Stripe before enabling writes. Suppress invitation/webhook side effects during restore, then reauthorize each delayed job.

Measured local restore evidence is in [restore.json](evidence/restore.json): a tiny synthetic dataset with one source file, PostgreSQL 16.14 and filesystem objects. It is not a hosted RTO/SLA or a scale test. The backup recovery point is the locked snapshot; subsequent writes are absent. Proposed daily capture would imply up to 24 hours of lost writes, but no schedule or hosted RPO has been demonstrated. Hosted records **and** Storage API bytes restore, provider backup access, actual backup retention, region, secret rotation and deletion-after-hosted-restore remain paid-pilot blockers.
