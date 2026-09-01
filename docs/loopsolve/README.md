# LoopSolve

Structured problem solving for real work. Lives at `/solve` inside the LoopSignal site.

**Define the problem. Find the cause. Close the loop.**

## Where the code lives

Everything is under three folders so it can be lifted into a standalone app later. Nothing here imports from marketing pages.

| Folder | What |
| --- | --- |
| `app/solve/**` | Routes: `/solve` (home), `/solve/[id]` (redirects to `problem`), `/solve/[id]/[stage]`. `solve.css` holds workspace, Shop Floor Mode, and print styles. |
| `lib/solve/**` | Domain: `schema.ts` (Zod, the contract), `reducer.ts`, `status.ts` (derived status), `rules.ts` (hard/soft findings), `completion.ts`, `stages.ts`, `storage.ts` (IndexedDB with localStorage and memory fallbacks), `io.ts` (export/import/migrate/duplicate), `sample.ts`, `layout/whys.ts`, `layout/fishbone.ts`, `svg.ts` (standalone SVG for print/export), `report.ts` (Markdown), `analytics.ts`, `integrations.ts` (future hooks, no implementation). |
| `components/solve/**` | UI: `Workspace` shell (rail, strip, bottom bar, context panel), `ProjectHeader`, `InvestigationProvider` (single reducer + autosave), stages under `stages/`, Investigate tools under `investigate/`, context panels under `panels/`, `Facilitation`. |

Shared with the site: design tokens in `app/globals.css`, `lib/brand.ts` (loop mark geometry), and `lib/analytics.ts` (`trackEvent`). LoopSolve events are typed in `lib/solve/analytics.ts` and only ever carry the event name, the stage, and numeric counts.

## Data

One investigation is one serializable document (`Investigation` in `lib/solve/schema.ts`, `schemaVersion: 1`). Persistence is local only: IndexedDB store `loopsolve/investigations`, keyed by id, with localStorage fallback. RCA numbers are sequential per browser (`loopsolve:rca-seq` in localStorage).

Autosave is debounced 500 ms and flushed on `visibilitychange`, `pagehide`, and `beforeunload`. Status is derived in the reducer on every change and never edited directly.

Three ideas that are easy to confuse are kept separate in code and copy:

- **Containment verification** (`ContainmentAction.verificationNote` / `status`) did the containment protect the customer?
- **Cause evidence state** (`CauseNode.evidenceState`) how well is this cause supported? `verified` is refused unless a supporting evidence link exists.
- **Action effectiveness verification** (`Verification.result`) did the corrective action fix the problem?

## Running

```bash
npm run dev            # site + LoopSolve at http://localhost:3000/solve
npm test               # Vitest: schema round-trip, rules, status, completion, layouts
npm run test:e2e       # Playwright: full loop at 375×812, 1024×768, 1440×900
PORT=3000 npm run test:e2e   # reuse a dev server that is already running
npm run typecheck
```

## Gate reports

### Phase 1: Foundation

Built: Zod schema and inferred types, reducer with derived status, IndexedDB persistence with fallbacks, `/solve` home (table on desktop, cards on mobile, import/export/duplicate/delete with undo), project header with inline title and saved indicator, stage rail (desktop), icon rail (tablet), horizontal navigator plus bottom action bar (mobile), Problem stage with live generated statement and quality check, Contain stage with quick-add chips and status chips, sample seed.

Tests: 22 Vitest tests green (schema round-trip, rules, status derivation, completion, layouts).

Screenshots: `screenshots/d1440-home.png`, `screenshots/m375-home.png`.

Known gaps: none blocking. Dates in the sample are anchored 12 days before "today" so the sample never carries future timestamps.

### Phase 2: Investigation

Built: Five Whys as a hand-laid-out tree (SVG edges, HTML cards positioned by `layout/whys.ts`) with an inline composer that chains to the next level, branch, collapse, delete with undo, zoom, SVG download, and a list view that is the mobile default and the screen-reader equivalent. Fishbone as a real Ishikawa (spine, head box, alternating ribs that grow with their causes, editable and reorderable categories) with a grouped list default on mobile and a full-screen zoomable sheet. Evidence library with type filter, search, and a cause picker with Supports / Contradicts. Timeline with elapsed-time gaps and optional cause link. Cause, Evidence, Category, and Timeline context panels. Promote fishbone cause to a Five Whys branch. Facilitation entry point.

Tests: layout tests assert no overlapping boxes for a 3-branch × 6-deep tree and no overlapping labels, cards, or head on the sample fishbone.

Screenshots: `screenshots/d1440-investigate.png`, `screenshots/d1440-investigate-fishbone.png`, `screenshots/t1024-investigate.png`, `screenshots/m375-investigate.png`.

Known gaps: drag-to-reassign category is not implemented (spec: nicety, everything reachable via the panel). Node positions animate with a CSS transition; there is no enter/exit animation for deleted branches.

### Phase 3: Close the loop

Built: Root Cause review with classification, rationale, removal test, inline coaching from `rules.ts`, and a picker to bring any cause under review. Actions in two horizon columns with kind tags, overdue derivation, cause linking, and coaching. Verify with per-action verification records, the "The problem is not closed" panel with the loop motif, Reopen (history event, counter, derived status, preserved records marked "Reopened after this result"), and Close gated by the hard rules. Summary with all report sections, 8D label toggle, Print, Copy Summary (Markdown), Export JSON, Download SVG diagrams, and editable Lessons Learned. Print stylesheet with a fixed header on every page and page breaks before the diagrams and root causes.

Tests: Playwright walks create → why → branch → link evidence → mark root → add action → verify Not Effective → Reopen → verify Effective → Close at all three viewports, and loads and prints the sample with zero console errors.

Screenshots: `screenshots/d1440-verify.png`, `screenshots/t1024-verify.png`, `screenshots/m375-verify.png`, `screenshots/d1440-summary.png`, `screenshots/print-summary-letter.png` (print media at Letter width).

Known gaps: the print PDF was reviewed as a print-media render and a headless PDF; a physical printer pass was not done.

### Phase 4: Modes and polish

Built: Shop Floor Mode (18px base, 56px controls, secondary metadata hidden, large status chips, full-screen sheets, persisted per investigation). Facilitation Mode (`?facilitate=1`, full-screen, Five Whys chain and Fishbone by category, Root Cause candidate walk, keyboard: Enter, ⌘/Ctrl+B, ←/→, 1/2/3, Esc). Analytics events wired through `trackEvent` with a type that only accepts the event enum, the stage, and numbers. LoopSolve card in the Demo area, footer link, sitemap entry, route metadata. Consulting CTA on the home footer and once on Summary after closure.

Lighthouse accessibility (desktop, run against the dev server with the sample seeded): `/solve` 96; every investigation route (`problem`, `contain`, `investigate` × 4 modes, `root-cause`, `actions`, `verify`, `summary`, `investigate?facilitate=1`) 95. The only remaining findings are in the shared site chrome, not LoopSolve: header nav link contrast (`text-stone` on cream) and the footer logo link's accessible name.

Keyboard: every action is a real button or link with a visible copper focus ring; panels close on Esc; the Five Whys composer submits on Enter; the facilitation keyboard test passes.

Known gaps: the manual VoiceOver pass on the Five Whys list view has not been done. Lighthouse was run in headless Chromium against `next dev`, not a production deploy.

## Method alignment

Stages map to 8D as shown in the Summary toggle: Problem (D0–D2), Contain (D3), Investigate and Root Cause (D4), Actions (D5–D7), Verify (D6), Summary and Lessons (D8). Nothing in the tool forces five whys, one root cause, or a person as the cause.
