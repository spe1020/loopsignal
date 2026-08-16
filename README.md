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
- `/solutions` — Work we take on
- `/how-it-works` — See → Simplify → Connect → Automate → Measure → Improve
- `/about` — Company
- `/insights` — Articles
- `/loopscan` — LoopScan offer and intake
- `/demo` — Working examples (LoopSupply, LoopKnow, LoopSource, LoopBrief)
- `/supply` — LoopSupply demo (`/signal` redirects here)
- `/security` — How LoopScan handles data
- `/privacy` — What this site collects

## LoopScan leads

The `/loopscan` form submits to Formspree and keeps the on-site confirmation state. Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_CAL_LOOPSCAN_URL` — public Cal.com event URL for the 30-minute LoopScan fit check (`https://cal.com/loopsignal/30min`). Used by the embedded scheduler. No private Cal.com API key is required. The same URL is the code default if the env var is unset.
- `CALENDAR_URL` — optional fallback if `NEXT_PUBLIC_CAL_LOOPSCAN_URL` is unset
- `NEXT_PUBLIC_SITE_URL` — canonical site URL for metadata, sitemap, and structured data (required in production; local fallback is `https://www.loopsignal.co`)

## Stack

Next.js, TypeScript, Tailwind CSS.
