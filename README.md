# LoopSignal

Improve the process. Connect the systems.

A website for LoopSignal — a manufacturing consulting and systems integration company focused on process improvement, automation, and practical AI.

Live site: [https://www.loopsignal.co](https://www.loopsignal.co)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` — Home
- `/solutions` — Operational problems LoopSignal can help solve
- `/how-it-works` — See → Simplify → Connect → Automate → Measure → Improve
- `/about` — Company
- `/insights` — Articles
- `/loopscan` — LoopScan intake
- `/demo` — Working examples (LoopSupply, LoopKnow, LoopSource, LoopBrief)
- `/supply` — LoopSupply demo (`/signal` redirects here)

## LoopScan leads

The `/loopscan` form submits to Formspree and keeps the on-site confirmation state. Copy `.env.example` to `.env.local` and set:

- `CALENDAR_URL` — optional scheduling link shown after submission
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata, sitemap, and structured data (required in production; local fallback is `https://www.loopsignal.co`)

## Stack

Next.js, TypeScript, Tailwind CSS.
