# LoopFlow — Phase 4 gate report (Walk Mode, Shop Floor Mode, analytics, Solutions card, polish)

Date: 2026-09-01 · Branch: `loopflow`

## Gate

| Requirement | Result |
| --- | --- |
| Lighthouse accessibility ≥ 95 on every route | 96 on `/flow`, `/flow/[id]/scope`, `map`, `map?walk=1`, `analyze`, `future`, `summary` (Lighthouse 12.8.2, accessibility category, 1440×900, seeded with the sample map). Remaining flags are shared LoopSolve brand tokens: 12px stone (`#7a7a7a`) and copper mono text on cream, and a footer link owned by the site. |
| Keyboard walkthrough | Map: Start mapping → Enter/Tab/number/Enter for each step, Alt+←/→ reorder, Esc close, arrows walk the SVG, Enter opens. Walk Mode: Enter next, ←/→ move, 1/2/3 value class, Esc exit. Both covered by e2e at all three breakpoints. |
| Reduced motion respected | `app/loop.css` disables every `loop-*` transition and animation under `prefers-reduced-motion: reduce`; the map has no transitions; the stopwatch only updates text. |
| Walk Mode | `?walk=1` on the Map stage: full screen, one step at a time, "What happens next?", lane chips with the last lane preselected, stopwatch (on saved steps) or typed time, three big value-class buttons, "Anything wrong here?" pain capture, Back to edit, Exit shows the map. |
| Shop Floor Mode | Shared implementation with LoopSolve (`loop-shopfloor`: 56px controls, larger type, secondary text hidden). In LoopFlow it also enlarges the stopwatch and makes the list the default view on tablet. |
| Analytics | Twelve `loopflow_*` events wired through `trackTool`; names and counts only. Documented in `ANALYTICS.md`. |
| Solutions card | "LoopFlow — See the process. Find the friction. Fix it once." added to the free tools list (`lib/content.ts`), plus footer, sitemap, header active state, and route metadata. |

## Test output

```
Vitest      44 passed (44)
Playwright  e2e/loopflow.spec.ts + e2e/loopsolve.spec.ts   22 passed, 2 skipped (mobile-only stopwatch test on tablet/desktop)
Lighthouse  accessibility 96 × 7 routes
```

`npm run typecheck` and eslint (components, lib, app, e2e) are clean.

## Screenshots

`docs/loopflow/screenshots/phase-4/`: `walk-{375,1024,1440}.png` plus every stage at all three widths.

## Known gaps

- Drag-to-reorder in the sequence is not implemented (Move earlier/later, Alt+arrows, and the list are the paths).
- Contrast on 12px stone and copper text is a shared brand decision, not changed here.
- Walk Mode adds a pain point on an existing step through a browser prompt; new steps capture it inline.
- "LoopFlow" is a working name pending the trademark check; the code uses `flow` everywhere.
