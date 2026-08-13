# LoopWorks

Better systems. Better work.

A B2B website for LoopWorks — process improvement, practical automation, and operational systems for manufacturers.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- `/` — Home
- `/solutions` — Solutions and services
- `/how-it-works` — See → Simplify → Build → Learn
- `/about` — Company
- `/insights` — Articles
- `/loopscan` — LoopScan intake

## LoopScan leads

Copy `.env.example` to `.env.local` and set:

- `LEAD_WEBHOOK_URL` — destination for submitted LoopScan leads
- `LEAD_WEBHOOK_SECRET` — optional bearer token for the webhook
- `CALENDAR_URL` — optional scheduling link shown after submission

## Stack

Next.js, TypeScript, Tailwind CSS.
