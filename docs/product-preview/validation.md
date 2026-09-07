# Validation evidence

Validated locally on 7 September 2026, including the PR #26 corrective follow-up, with the installed Next.js 16.3.0 / React 19.2.8 stack. The installed Next.js routing and server/client component guides were read before implementation. No production deployment was performed.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test -- --reporter=dot` | 88 tests passed in 14 files |
| `npm run build` | Passed; 37 static pages generated; existing dynamic routes retained |
| Chromium interaction regressions at 375×812, 768×1024, 1440×900 | 73 passed; 2 intentional skips for a mobile-only stopwatch test at larger widths |
| `git diff --check` | Passed |

Browser command:

```sh
PORT=3000 npm run test:e2e -- e2e/duplicate-persistence.spec.ts e2e/verification-reviews.spec.ts e2e/product-preview.spec.ts e2e/loopsolve.spec.ts e2e/loopflow.spec.ts --project=mobile-375 --project=tablet-768 --project=desktop-1440 --workers=2
```

## PR #26 review reproductions and corrections

The local checkout and GitHub PR head were independently verified as `4cc7017e6a7eae47d489f62a242fbe9f3f5fc0ae` against main `89989c605c415b849e3aec8e2c508e0386fe76f3`, with a clean working tree. Three temporary baseline tests reproduced the supplied findings before changes:

1. Changing nonempty follow-up evidence and completed countermeasure scope retained `closed`, `isVerifiedImprovement === true`, and no hard findings.
2. With controlled time, reopening blocked closure, then editing the old verifier's name enabled it without a new review or observation.
3. Incomplete required work and a missing reviewer produced hard findings absent from the six-code checklist. The baseline rendering finding was checked against the component's exact allowlist; the corrected rendering was subsequently exercised in Chromium.

The permanent regression tests now assert the corrected behavior. Explicit approval records bind a decision to a retained dependency snapshot and reopening event ID. Generic edits cannot establish approval. Material changes withdraw it, and even reverting the edit requires explicit review. Cosmetic changes preserve current approval. Same-timestamp/backwards-clock reopening cannot bypass review. Re-reviewing existing observations permits closure; prior review snapshots, history and learning remain, while learning credit requires approval tied to the new review. Legacy documents gain no fabricated approval metadata; JSON copies retain history and require review for their new identity.

The ordinary LoopSolve browser tests import synthetic investigations, approve and close through the real VerificationPanel, edit nonempty evidence through the EvidencePanel, prove a name edit cannot re-close, deliberately re-review the original observations, materially edit scope through the ActionPanel, reload, and export the preserved review history. Separate browser checks display every reproduced blocker, open its relevant editor and resolve it. A component regression supplies an unknown future finding code to prove it remains visible.

The [review field policy](reviews.md) documents exactly what invalidates approval and the browser-local trust boundary. The homepage/design and future hosted milestone remain unchanged. No merge, deployment or Prompt 2 work was performed.

## Copilot review follow-up

Both comments on head `4bed692` were checked against the actual code:

- [Review blocker scoping](https://github.com/spe1020/loopsignal/pull/26#discussion_r3949839976): a regression reproduced three blockers belonging to another unfinished required action. The current action can now be approved independently. Unit and browser checks retain the other action's blockers for closure, refuse its own premature approval, retain the first review as the second action is completed, and preserve shared root/containment checks.
- [Flush durability](https://github.com/spe1020/loopsignal/pull/26#discussion_r3949839905): the LoopSolve browser reproduction allowed a duplicate/navigation after the source-only quota failure; the same unguarded call existed in LoopFlow. `flush()` now returns success with the confirmed current snapshot or explicit failure. Both Duplicate callers inspect that result, catch copy-write failures, check copy durability, and preserve subsequent source edits before navigating.

The new browser suite exercises both tools: failed source saves leave the original and sequence unchanged, recovery export contains unsaved edits, retry allows a durable duplicate that survives reload, memory never authorizes navigation, and a failed copy write produces feedback without an unhandled rejection. Delayed IndexedDB acknowledgements prove that a pending flush includes newer source edits in the copy and that edits made while the copy itself saves survive on the original. The original save/recovery and demo-isolation suites also passed again.

The final run reused the existing development server on port 3000 without stopping it. The initial attempt on the default 3117 port could not start because that server was already running; the command above records the actual successful run. No production or hosted changes were made. Existing screenshots were retained; this follow-up changes workflow guards and feedback, without a design change.

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
| Ordinary LoopSolve blocked closure | [PNG](screenshots/closure-blocked-375.png) | [PNG](screenshots/closure-blocked-768.png) | [PNG](screenshots/closure-blocked-1440.png) |

The corrected blocked-closure phone and desktop captures were visually inspected. They show all four blockers, relevant-record navigation, the unapproved Effective label and disabled closure. The fixed phone stage-navigation bar appears at the initial viewport bottom in full-page captures; scrolling keeps the checklist accessible. The existing 15 promoted-workflow captures were regenerated by the passing suite and remained unchanged.

## Limits of this evidence

The hosted Vercel preview was not inspected in this corrective run; browser validation used the local app. The development server emitted the existing smooth-scroll configuration warning; it did not produce browser test failures.

Automated browser checks use Chromium emulated viewports, not physical phones, Safari/Firefox, or a complete screen-reader audit. Separate historical screenshot-generation suites were not rerun; the new suite captures the promoted experience and the existing interaction suites cover the individual tools. No hosted multi-user, tenant-isolation, file-backup restore, subscription provider, live message delivery, or production checks were performed because those capabilities are outside Prompt 1.

The legacy knowledge/sourcing engines were inspected, not exhaustively regression-tested. Their exact follow-up release gates are in [follow-ups](follow-ups.md). A browser-local preview passing these checks does not make the hosted subscription service ready.
