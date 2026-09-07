# Validation evidence

Validated locally with the installed Next.js 16.3.0 / React 19.2.8 stack. The installed Next.js routing and server/client component guides were read before implementation. No production deployment was performed.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test -- --reporter=dot` | 65 tests passed in 12 files |
| `npm run build` | Passed; 37 static pages generated; existing dynamic routes retained |
| Chromium interaction regressions at 375×812, 768×1024, 1440×900 | 40 passed; 2 intentional skips for a mobile-only stopwatch test at larger widths |
| `git diff --check` | Passed |

Browser command:

```sh
npm run test:e2e -- e2e/product-preview.spec.ts e2e/loopsolve.spec.ts e2e/loopflow.spec.ts --project=mobile-375 --project=tablet-768 --project=desktop-1440 --workers=2
```

## What the tests establish

- Real homepage → evidence inspection → cause acceptance → linked/owned action → implementation confirmation → verification → approved lesson interaction, with keyboard and reduced-motion access.
- Missing evidence blocks Effective approval. Partial, monitoring, or ineffective review cannot earn verified recognition. An unverified lesson cannot be approved.
- The action ID, owner, and state agree across views; source-linked observation counts drive the result chart. Every follow-up lot must meet the target.
- Reopening retains the lesson and history while withdrawing verification/learning credit. Withdrawing support invalidates the result. Legacy invalid closures require a new review without rewriting the stored original on read.
- IndexedDB reload, localStorage persistence, JSON export, schema compatibility, and serialized save ordering. Simulated quota failures retain dirty edits, pause normal navigation, allow recovery export, and persist after retry. Fully blocked storage is labeled temporary memory and never says saved.
- Replay preserves actual investigations, maps, and sequence counters **byte-for-byte** in isolated browser test profiles. Those user-tool fixtures are synthetic; no real user document was read or changed by the tests.
- Existing LoopSolve creation/investigation/verification, sample/print/facilitation; LoopFlow keyboard mapping, linked investigation, future-map rationale, summary/print, sample stages, and phone stopwatch/walk workflows.
- Pilot form validation plus failure/retry/success use intercepted Formspree responses. Synthetic requests never reach production; no messages or bookings were sent. Live delivery remains untested intentionally.

The historical sample’s monitoring closure, misleading memory-save indicator, and touch-time PCE were reproduced against current code and corrected. Browser regression also exposed and corrected LoopFlow’s delayed phone focus call, which could steal focus after Tab.

## Screenshots

Real Chromium screenshots, captured from the local application with motion disabled. Desktop/tablet/phone renders were visually inspected; phone text sizing, evidence access, persistent navigation, and the LoopFlow keyboard focus issue were refined. The full-page captures are scrolled to the top first so sticky navigation is shown at its normal starting position.

| View | Phone 375 | Tablet 768 | Desktop 1440 |
| --- | --- | --- | --- |
| Homepage | [PNG](screenshots/home-375.png) | [PNG](screenshots/home-768.png) | [PNG](screenshots/home-1440.png) |
| Problem | [PNG](screenshots/problem-375.png) | [PNG](screenshots/problem-768.png) | [PNG](screenshots/problem-1440.png) |
| Action | [PNG](screenshots/action-375.png) | [PNG](screenshots/action-768.png) | [PNG](screenshots/action-1440.png) |
| Result | [PNG](screenshots/result-375.png) | [PNG](screenshots/result-768.png) | [PNG](screenshots/result-1440.png) |
| Lesson | [PNG](screenshots/lesson-375.png) | [PNG](screenshots/lesson-768.png) | [PNG](screenshots/lesson-1440.png) |

## Limits of this evidence

Automated browser checks use Chromium emulated viewports, not physical phones, Safari/Firefox, or a complete screen-reader audit. Separate historical screenshot-generation suites were not rerun; the new suite captures the promoted experience and the existing interaction suites cover the individual tools. No hosted multi-user, tenant-isolation, file-backup restore, subscription provider, live message delivery, or production checks were performed because those capabilities are outside Prompt 1.

The legacy knowledge/sourcing engines were inspected, not exhaustively regression-tested. Their exact follow-up release gates are in [follow-ups](follow-ups.md). A browser-local preview passing these checks does not make the hosted subscription service ready.
