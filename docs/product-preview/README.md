# LoopSignal product preview — Prompt 1

LoopSignal now leads with manufacturing problem-solving software: **“Turn daily problems into improvements that last.”** `/workspace` is a working fictional quality investigation, reached by **Try a live example**. `/pilot` registers interest through the existing contact delivery path. It creates no account, booking, or subscription.

This is an individual browser preview, **not a hosted service for company data**. No LLM calls, autonomous actions, billing, production deployment, or silent upload were added.

## Explore and validate

```sh
npm run dev -- --port 3117
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -- e2e/product-preview.spec.ts e2e/loopsolve.spec.ts e2e/loopflow.spec.ts --project=mobile-375 --project=tablet-768 --project=desktop-1440 --workers=2
```

Open `/workspace`, inspect the three source records, accept the supported fixture cause, connect action A-001, choose a fictional owner, inspect completion evidence, and confirm the action. In Results, include the follow-up record and select Effective to approve the fictional verification. Then approve the lesson. Monitoring, partial effectiveness, missing evidence, open required actions, and uncovered accepted causes cannot earn verified closure.

The fictional follow-up spans **6–19 August 2026 (ten working days)** and three lots. The interface explicitly compresses demonstration time; it does not claim ten days elapsed during a visit. Each lot must meet the 1% rejection target. Counts and rates derive from source-linked observation records; there is no invented savings calculation.

See [validation and screenshots](validation.md), [architecture decisions](decisions.md), [the hosted milestone checklist](next-milestone.md), and [deferred legacy capabilities](follow-ups.md).

## Preserved work

- The branch starts from main `89989c6` (same file tree as the original local branch). Existing work was clean and no original user documents were accessed or changed.
- Existing `/solve`, `/flow`, consulting, article, and legacy demo routes remain. Nothing needed a redirect. Unpromoted demos remain available through their original routes, outside the new active navigation.
- Existing tool databases, localStorage prefixes, imports, export formats, and sequence counters are retained.
- Replay replaces only the fictional preview record, in `loopsignal-fictional-preview` / `demo`, with localStorage fallback prefix `loopsignal:fictional-preview:`. It never calls the individual tools’ reset/delete functions.
- Browser JSON exports contain the current snapshot, including unsaved edits. Demo JSON is a readable recovery/review artifact, not a company-workspace import. Individual tool imports continue to create copies with new document IDs.

## Storage truth

IndexedDB is preferred, with the existing localStorage fallback. Temporary memory is explicitly non-durable. A successful write returns `{ kind, durable }`; a failed persistent write throws without silently downgrading. The shared provider serializes saves, acknowledges the exact saved snapshot, retains dirty state on failure, and offers retry and recovery export. Normal same-origin link navigation flushes pending edits and stays on the page if saving fails. Unload flushing remains best effort; a dirty document also requests the browser’s leave-page warning.

Browser eviction, clearing site data, device loss, and multi-tab edits remain limitations. This milestone provides neither a backup service nor safe multi-user concurrency. Export important work. Local document content is not sent to the pilot form or telemetry. Pilot delivery was tested only with intercepted synthetic requests.
