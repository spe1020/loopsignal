# LoopSignal private company milestone

Branch `codex/company-workspace` starts at PR #26 merge `2b27076`. `/workspace` is still the isolated fictional example. `/company` is the separate synthetic company evaluation. No company data is stored in browser databases. No production migration, deployment, real invitation, or live billing was performed.

Read [permissions](permissions.md), [architecture](architecture.md), [recovery and retention](recovery.md), [validation](validation.md), and [pilot blockers](pilot-blockers.md) before connecting a hosted project.

## Installed stack

Next.js 16.3.0 / React 19.2.8; Supabase JS 2.115.0, SSR 0.12.6, CLI 2.116.0; Stripe 22.6.1 (SDK API `2026-08-26.dahlia`); `postgres` driver. Exact versions are locked in package-lock.json. The installed Next.js route-handler, cookie, and authentication guides were read. Current Supabase CLI generated config was also inspected: PostgreSQL **17** and `[local_smtp]` are current; the old PG16/inbucket config was corrected.

## Reproducible local Supabase stack

1. Install Docker Desktop or Podman and start its daemon. Run `npm ci`, then `npm run company:local`. This uses only local containers. It applies the two versioned migrations on a new stack. For an existing **disposable local stack only**, `npx supabase db reset --local` reapplies migrations; it destroys that local stack's data.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3117` (the application's only canonical origin). Obtain local publishable/service keys with `npx supabase status`; place them only in the corresponding server environment fields. Never commit its output or paste secrets into documentation.
3. Connect an operator SQL client to local PostgreSQL on 54322. Create a dedicated login with a randomly generated password, `NOINHERIT NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE`; grant it only `loop_app`. For example, create `loopsignal_server` using your password manager, then run `GRANT loop_app TO loopsignal_server`. Set COMPANY_DATABASE_URL to that restricted login. The application explicitly enters `SET LOCAL ROLE loop_app` in each transaction. Do not use postgres, a table owner or service-role database login in the deployed application.
4. Export the local Supabase URL and service key into your shell, then `npm run company:seed`. This creates only `owner@factory.test`, `colleague@factory.test`, `participant@factory.test`, `viewer@factory.test`, `other-owner@factory.test`, with password `Synthetic-local-only-2026!`, and confirms them for synthetic testing. The seed refuses non-local providers. Alternatively sign up in `/company` and confirm through the local sink at `http://localhost:54324`.
5. `npm run dev -- --port 3117`. Sign in, create a company, explicitly grant reviewer authority in Team, capture a new problem, invite the colleague, and deliver queued invitations to the local sink. Use two separate browser profiles. No real email delivery transport is enabled in this milestone. Invitations expire after seven days; revocation and current inviter authority are checked at acceptance.
6. Set up TOTP from Security. Verify the code; a later password sign-in requires the enrolled factor. Auth uses server-only HTTP-only cookies, Auth getUser verification, refresh rotation, same-site cookies, and request-origin checks. API handlers refresh cookies; the company shell contains no sensitive SSR payload and never relies on a layout-only auth guard.

An absent database/Auth/object configuration yields an unavailable/error state. It never changes the company store into local memory. Local HTTP is permitted only for loopback infrastructure. Hosted SQL requires verified TLS (`sslmode=verify-full`); hosted Auth and Storage require HTTPS. HTTPS cookies are Secure.

## Native policy and recovery checks

A running local PostgreSQL is sufficient for `PGPORT=55432 npm run company:db:test`. The script creates a new synthetic database, installs test-only provider-owned `auth` and `storage` schema stand-ins, applies the actual application migrations, and runs the actual handlers/RLS. These are real SQL-policy checks but **do not test GoTrue, PostgREST, or Supabase Storage API**. Source/restored file bytes use separate filesystem stores only in the test harness. Temporary databases are retained for inspection; the script never targets hosted PostgreSQL.

For native browser verification, use the emitted test database URL as both COMPANY_TEST_ADMIN_URL and COMPANY_DATABASE_URL in the Playwright process, set PORT to your running local Next server, and run `npx playwright test e2e/company-workspace.spec.ts --project=desktop-1440 --project=tablet-768 --project=mobile-375`. The isolated browser transport substitutes sign-in and invitation-token delivery and calls actual database commands. No such override exists in the production application.

An opt-in, **unrun** provider suite is also supplied: with the local stack, synthetic seed, SMTP sink and Next server configured as above, export the local SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY and a local operator COMPANY_TEST_ADMIN_URL, then run `COMPANY_PROVIDER_E2E=1 PORT=3117 npx playwright test e2e/company-supabase.spec.ts --project=desktop-1440`. It uses actual cookie sign-ins, app routes, Storage/PostgREST requests and private bytes without browser route interception. Its invitation token is inspected through test-only operator SQL, with delivery sent to the real local sink. It requires a local provider and skips by default; it does not cover every MFA/refresh/restore/Stripe blocker listed in pilot-blockers.md.

## Stripe test mode

Create one synthetic **test** product/price, USD 299.00 recurring monthly, quantity 1. Put its ID in STRIPE_TEAM_PRICE_ID and a test secret in STRIPE_SECRET_KEY. The server validates the price each time it provisions/reconciles. Live keys, live events and live prices are rejected. Use Stripe CLI forwarding to `/api/stripe/webhook`, and copy its test webhook secret into STRIPE_WEBHOOK_SECRET. Configure the test portal to manage/cancel this subscription; do not expose price changes or alternate products.

Required event subscriptions: `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.completed`, `checkout.session.expired`. Raw bytes and the Stripe signature are verified with a five-minute tolerance. Returned checkout URLs never establish payment. Current provider state is reconciled under the company lock, so replay and event ordering cannot reset grace or reinstate a stale state. Use Billing → Refresh subscription status to recover a missed webhook. Monitor/retry 503 deliveries; no webhook is acknowledged as processed before its transaction commits.

The synthetic evaluation lasts 14 days with one site/team and 10 full seats, including reserved invitations. Billing does not grant reviewer permissions. Past-due/cancelled states become read-only, with 30 days of authorized export; subsequent repeated failures do not extend grace. Recovery to active retains the work and existing membership limits. An unfinished operation older than 23 hours requires operator reconciliation before retry to avoid relying on Stripe's expiring idempotency cache. A Stripe CLI/customer-portal test run remains a pilot blocker until recorded.

## Official references checked

[Supabase server auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [private storage policies](https://supabase.com/docs/guides/storage/security/access-control), [local CLI config](https://supabase.com/docs/guides/local-development/cli/config), [TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [Stripe webhooks](https://docs.stripe.com/webhooks), [subscription events](https://docs.stripe.com/billing/subscriptions/webhooks), [idempotency](https://docs.stripe.com/api/idempotent_requests), [customer portal](https://docs.stripe.com/customer-management).
