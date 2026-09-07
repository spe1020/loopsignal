# Architecture decisions

## Keep the existing domain, add a focused preview

`Investigation.id` is the stable problem record ID. Its evidence, causes, evidence-to-cause links, actions, verifications, lessons, and history retain the existing LoopSolve entity IDs. The preview reuses `InvestigationSchema`, the LoopSolve reducer, and the ordinary closure rules. It adds a small, versioned `Demo` envelope and typed commands for the guided experience, not a generic workflow engine.

The LoopFlow `ProcessMap` holds process steps and references the investigation and action by ID. Problems, Actions, Results, Lessons, and process context read the **same** investigation. There is no second action record or status cache. Metric observations have stable IDs, an investigation reference, an evidence reference, inspected/rejected counts, and observation dates. The chart and aggregate rates are derived from them.

`lib/workspace/demo.ts` is the fictional fixture and command boundary; `lib/workspace/storage.ts` is its separate storage adapter; `components/workspace/DemoWorkspace.tsx` is the interactive presentation. The shared `DocumentProvider` and `createDocumentStore` boundary remains common to individual tools and the preview. Company identity and authorization are intentionally absent.

## Verification is a domain rule

Ordinary close is guarded inside the reducer, not just by a disabled button. It requires:

1. Every accepted root has its own rationale and existing source evidence with actual supporting content. Unsupported, challenged, or contradicting root evidence needs resolution.
2. Every accepted root is covered by a completed corrective action.
3. Every corrective action (and preventive action explicitly marked required) is complete, assigned, linked to an existing cause, and has a latest effective verification with expected/observed results, reviewer, date, and existing linked evidence.
4. Containment is verified or released. Reopening requires fresh verification.

Monitoring and partially effective results remain open. There is no exception-as-verified bypass. Optional preventive work is explicitly separate; a future cancelled/accepted-risk disposition must remain separately labeled, with rationale and authority, and earn no verified-improvement recognition.

Changing evidence or required action state invalidates a previously closed result and records a reopening without deleting history or lessons. The preview checks the source-linked three-lot result against its target before accepting Effective. It is still a human-reviewed example, not an autonomous conclusion.

## Compatible documents, explicit approval

The existing v1 Investigation JSON receives **optional additive fields**: `Action.requiredForClosure`, and `Lesson.sourceVerificationId`, `approvedAt`, `approvedBy`. There is no destructive shape migration or version bump for old files. Legacy lessons remain unapproved. Tests exercise v1 import, copy IDs, round trips, preserved notes, and absence of inferred approval.

A read-time compatibility repair (`normalizeClosure`) detects historical closed records that fail the stronger rules, preserves their original close history, appends a deterministic review/reopen event, and removes the active closure. It does not rewrite the stored original just by reading it. Editing then saves the repaired snapshot. Fixing a field cannot silently reinstate an old invalid closure; approval must occur again. This repair is tested for idempotence and preservation.

The next hosted milestone needs a separate explicit device-to-company migration. It must not reinterpret local display names as authenticated users, local history as an immutable audit log, or demo approvals as company approvals.

## Recognition follows evidence

The optional progress panel derives cause support, countermeasure completion, verified improvement, and approved learning from records. Lesson recognition requires the current valid verification ID. Reopening preserves the lesson and contribution history but withdraws current verification/learning credit until reviewed again. No closure-speed rankings, issue-count points, synthetic ROI, or penalties for reporting new problems.

Owners and reviewer names in the public example are fictional roles, with no impersonation of real team accounts. Contribution text is only shown after the corresponding work is actually completed in the example.

## Commercial and route boundary

Homepage and primary navigation promote the implemented software preview. `/pilot` reuses the established Formspree form, with an explicit software-pilot subject and distinct confirmation; no messages were sent during testing. Consulting remains optional and its useful pages stay available. `NEXT_PUBLIC_SITE_URL` / `lib/site.ts` remains the sole canonical origin configuration. Existing social-preview assets are preserved.

LoopKnow and LoopSource were inspected but kept out of the promoted journey. Their source-passage and allocated-volume issues have precise release gates in [follow-ups](follow-ups.md). LoopFlow’s PCE was corrected because it is reused: **value-added time / lead time**, with estimates, unknown times, and provisional recorded-time totals visible.
