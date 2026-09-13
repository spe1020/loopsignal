# LoopSignal

Turn daily problems into improvements that last.

LoopSignal manufacturing problem-solving software: a fictional browser preview, individual LoopSolve investigations and LoopFlow process maps, and a separate private company workspace for synthetic evaluation. Company storage uses PostgreSQL, Supabase Auth/private files, and Stripe test-mode Team subscriptions. Consulting is optional onboarding support. Provider acceptance and paid-pilot readiness remain unverified.

See [company setup, permissions, validation, recovery and pilot blockers](docs/company/README.md) before connecting a provider.

See the [Prompt 1 implementation, validation, and hosted roadmap](docs/product-preview/README.md).

Live site: [https://www.loopsignal.co](https://www.loopsignal.co)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` — Software-first home
- `/workspace` — Fictional manufacturing workflow (separate browser store)
- `/company` — Separate company sign-in, shared records and Stripe test billing; requires configured local infrastructure
- `/pilot` — Pilot interest and synthetic company evaluation entry
- `/trust` — Demonstrated controls and remaining pilot requirements
- `/solutions` — Work we take on
- `/how-it-works` — See → Simplify → Connect → Automate → Measure → Improve
- `/about` — Company
- `/insights` — Articles
- `/services` — LoopScan, LoopBuild, LoopOps
- `/loopscan` — LoopScan and the contact form
- `/demo` — Working examples (LoopSupply, LoopKnow, LoopSource, LoopBrief)
- `/supply` — LoopSupply demo (`/signal` redirects here)
- `/security` — How LoopScan handles data
- `/privacy` — What this site collects

## LoopScan leads

The `/loopscan` form (name, company, role, email or phone, and an optional "What's slowing you down?") submits to Formspree and shows an on-site confirmation. Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata, sitemap, and structured data (required in production; local fallback is `https://www.loopsignal.co`)

## Stack

Next.js, TypeScript, Tailwind CSS.
