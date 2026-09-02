# LoopFlow

Process mapping for people who have to fix the process. Lives at `/flow` inside the LoopSignal site, as a sibling of LoopSolve.

**See the process. Find the friction. Fix it once.**

LoopFlow is not a diagramming tool. Every step carries operational data, the map computes where the time and the handoffs are, and any step can open a LoopSolve investigation. There is no free-form canvas: steps are an ordered sequence with decision branches, laid out automatically.

## Where the code lives

| Folder | What |
| --- | --- |
| `app/flow/**` | Routes: `/flow` (home), `/flow/[id]` (redirects to `scope`), `/flow/[id]/[stage]` for `scope`, `map`, `analyze`, `future`, `summary`. Query params: `?version=future` (edit the future state on Map), `?step=<id>` (open a step), `?walk=1` (Walk Mode), `?print=1` (print the summary). |
| `lib/flow/**` | Domain: `schema.ts` (Zod contract, `schemaVersion: 1`), `reducer.ts`, `metrics.ts`, `layout.ts` (swimlane), `diff.ts` (fork/diff), `rules.ts` (soft coaching), `status.ts`, `completion.ts`, `stages.ts`, `storage.ts`, `io.ts` (JSON and bundle import/export), `csv.ts`, `report.ts` (Markdown), `svg.ts` (export and paged print), `time.ts`, `visual.ts`, `sample.ts`, `solveLink.ts` (LoopSolve handoff), `integrations.ts` (future hooks), `analytics.ts`. |
| `components/flow/**` | UI: `FlowWorkspace` (shell + version/walk context), `FlowHeader`, `MapProvider`, `FlowHome`, stages under `stages/`, map pieces under `map/` (`SwimlaneMap`, `StepList`, `Stopwatch`, `TimeInput`), panels under `panels/`, `WalkMode`, `LinkedInvestigations` (live LoopSolve status). |
| `lib/loop/**`, `components/loop/**` | Shared with LoopSolve: design system, persistence, header, stage nav, workspace shell, context panel, toasts, document provider, Recent list. Workspace CSS is `app/loop.css`. |

## Data model in one paragraph

A `ProcessMap` has lanes, a scope (starts with / ends with), a display unit, and `versions.current` plus an optional `versions.future`. A version holds ordered `steps`, `edges` (the primary chain is rebuilt from step order; non-primary edges are decision branches that skip ahead or loop back as rework), `painPoints`, `forkedFromStepIds` (future step → current step), and `rationale` keyed by step id. All times are stored in minutes; `waitBeforeMin` is queue time before a step, a `wait` step's cycle time is also waiting, and every other step's cycle time is touch time. Status (`draft` → `current_mapped` → `future_drafted` → `improving` → `complete`) is derived in the reducer and never edited.

## LoopSolve integration

"Start investigation" from a step or pain point builds a LoopSolve investigation with the problem pre-filled and a `source` pointing back at the map and step, saves it in the LoopSolve store, and records a `LinkedInvestigation` and history event on the map. LoopSolve shows a "From LoopFlow" chip that links back to the step. The pain point and the Analyze/Summary stages show the investigation's live status; future-state rationale can reference one of its actions. "Export with investigations" bundles both; import handles either shape.

## Running

```bash
npm run dev            # site + LoopFlow at http://localhost:3000/flow
npm test               # Vitest: schema round-trip, metrics, layout, diff, rules, status, print pages
npm run test:e2e       # Playwright: LoopFlow + LoopSolve at 375×812, 1024×768, 1440×900
PORT=3000 npm run test:e2e   # reuse a running dev server (warm /flow and /solve first)
SCREENSHOTS=1 PHASE=4 PORT=3000 npx playwright test e2e/loopflow-screenshots.spec.ts   # gate screenshots
npm run typecheck
```

Gate reports: `docs/loopflow/phase-1.md` … `phase-4.md` with screenshots under `docs/loopflow/screenshots/`.

## Naming

"LoopFlow" is the working name. The codebase uses the internal id `flow` everywhere (routes, storage keys `loopflow:*`, analytics `loopflow_*`), so a rename after the trademark check is a copy change.
