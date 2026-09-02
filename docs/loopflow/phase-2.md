# LoopFlow — Phase 2 gate report (Map)

Date: 2026-09-01 · Branch: `loopflow`

## Gate

| Requirement | Result |
| --- | --- |
| Current-state map editable and readable on iPad landscape and iPhone | Done. 1024×768 shows the swimlane SVG with a right-hand step panel; 375×812 shows the sequence list with wait lines, lane badges, value-class chips, pain markers, and a "View diagram" full-screen sheet. Screenshots below. |
| Keyboard-only entry of a 12-step map | Done, covered by `e2e/loopflow.spec.ts` ("map twelve steps from the keyboard"): Start mapping → Enter adds the next step with the name focused → Tab to cycle time → type a number in the map's unit → Enter. Alt+←/→ reorders the selected step. Passes at all three breakpoints. |
| Stopwatch works on mobile | Done, covered by the "stopwatch on the mobile list" test at 375×812: tap Start on a list row, tap Stop, the observation appears and the median sets the cycle time. |
| No overlapping labels on the sample | Layout test: 5 lanes × 20 steps with 3 decisions has no overlapping step boxes or wait gaps, and every box sits inside its lane; the sample renders to SVG for both versions. |
| SVG export | Overflow menu → Export SVG downloads the current (and future, if present) state from the same layout as the on-screen map. |

## Test output

```
Vitest   43 passed (43)
Playwright  e2e/loopflow.spec.ts   7 passed, 2 skipped (stopwatch test is mobile-only)
Playwright  e2e/loopsolve.spec.ts  9 passed
```

`npm run typecheck` and eslint are clean.

## Screenshots

`docs/loopflow/screenshots/phase-2/`: `map-{375,1024,1440}.png`, `map-step-panel-{1024,1440}.png`, plus home and scope.

## Known gaps

- Default zoom floors at 70% and scrolls horizontally; a 15-step map at 1440 needs a scroll. Fit-to-width is one tap away.
- Drag-to-reorder within the sequence (a nicety in the spec) is not implemented; Move earlier / later, Alt+arrows, and the list are the reorder paths.
- Walk Mode is a placeholder until Phase 4.
