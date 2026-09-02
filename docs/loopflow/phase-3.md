# LoopFlow — Phase 3 gate report (Analyze + Future + LoopSolve link)

Date: 2026-09-01 · Branch: `loopflow`

## Gate

| Requirement | Result |
| --- | --- |
| Sample walkable end to end | Done. `e2e/loopflow.spec.ts` "sample map renders every stage" visits scope, map (current and future), analyze, future, summary with zero console errors at 375, 1024, 1440. |
| Investigation opens pre-filled and links both ways | Done, covered by the "investigation opens pre-filled and links both ways" test: Start investigation from the Analyze pain point → LoopSolve opens with `whatHappened`, `where` (lane · step), `process`, `department` filled and a "From LoopFlow MAP-… · step 13" chip → the chip links back to `/flow/[id]/map?step=…` which opens that step's panel → the pain point on Analyze shows the live LoopSolve status (Draft). |
| Diff view correct | Fork/diff unit tests (`lib/flow/__tests__/diff.test.ts`) plus the e2e: discard the sample future, fork a fresh one, delete two steps in the future map, see "2 removed", add a rationale to each, and reach "every change is explained". Side-by-side on desktop, tabbed under 1024. |
| Print reviewed as PDF | `docs/loopflow/screenshots/phase-3/summary-print.pdf` (Letter, Chromium) and `summary-print-media.png`. Site chrome hidden, running header on every page, current and future maps split by step range with a continuation header, delta table, and every change rationale. |

## Test output

```
Vitest      44 passed (44)
Playwright  e2e/loopflow.spec.ts   10 passed (31.0s)
Playwright  e2e/loopsolve.spec.ts   9 passed (39.1s)
```

`npm run typecheck` and eslint (components, lib, app, e2e) are clean.

## Screenshots

`docs/loopflow/screenshots/phase-3/`: `analyze-*.png`, `future-*.png`, `summary-*.png`, `summary-print.pdf`, `summary-print-media.png`, plus map, scope, and home at all three widths.

## Known gaps

- Walk Mode is still a placeholder (Phase 4).
- Rationale can link a LoopSolve action only from investigations this map already links; there is no picker for arbitrary investigations.
- The e2e runs against a reused dev server; the first run after a code change can hit Next's "page couldn't load" overlay while it recompiles. Warm the routes first (the config's own web server avoids this).
