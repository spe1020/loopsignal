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
