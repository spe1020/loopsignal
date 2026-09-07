# Explicit verification reviews

PR #26 follow-up to Prompt 1. Both the guided demo and ordinary LoopSolve use `approve_verification` in the Solve reducer. Editing a verification, choosing Effective, or updating `updatedAt` never creates an approval.

## Decision and lifecycle

A person completes the action being reviewed, records expected/observed results, a reviewer, a parseable check date and linked source evidence, selects Effective, then explicitly approves. The reducer checks readiness; the panel's disabled button is only feedback. Required actions can receive their approvals in any order. Missing owners, completion or verification fields on a different action do not block this action’s review. Shared root-cause and containment requirements still apply; closure continues to check all required actions. The latest verification for each required action needs a current approval before closure.

Each approval appends a `verificationReviews` entry and a `verification_reviewed` history event. The entry contains the reviewer, decision time, verification ID, latest reopening **event ID**, snapshot format version and a canonical JSON snapshot of the reviewed dependencies. An event relationship establishes freshness; generic edit times and clock ordering do not. A deliberate review can reuse the same observations, evidence IDs and check date after reopening. It does not fabricate another measurement window.

The reducer marks a review invalid when a material dependency changes. It retains the original decision, snapshot, history and lessons. Reverting the edit does not reactivate that approval. A closed investigation automatically reopens when its closure requirements cease to hold. Reopening invalidates the relationship for all prior reviews, including when it shares a timestamp with approval or the local clock moves backwards. Current-state checks also compare the snapshot on reads, so an externally changed JSON record cannot retain active approval merely because its text is nonempty.

A lesson's `sourceReviewId` identifies the exact decision that supported it. Historical learning stays available, but a new review of the same verification does not silently reapprove the old lesson or re-earn the demo learning milestone.

## Material fields

The snapshot binds a review to:

- Investigation identity and the problem fields, including the requirement, impact and process context. The generated statement is excluded because it is derived from those fields.
- All containment records and their business fields, including scope and status.
- The set and kinds of required actions. For the reviewed action: title, description, kind, horizon, cause links, owner (trimmed), completion status, required-for-closure flag, verification method and expected result.
- All accepted roots, the reviewed action's linked causes and their ancestors: text, parent relationships, evidence state, classification, rationale, removal test, notes and challenge state.
- Supporting/contradicting links for those causes, and every source record reached by those links or by the verification's evidence IDs: title, type, description, source and date. Missing records and changed links are detectable.
- The verification's identity, action link, expected and observed results, check date, reviewer (trimmed), result and evidence IDs.

Text changes are detected mechanically. The software does not interpret whether corrected free text proves effectiveness; the person must make a new decision. Source bytes outside the document are not fetched or authenticated.

## Changes that do not withdraw approval

Investigation display title, header owner/department, shop-floor mode, diagram category/layout/order/collapse/candidate controls, action due date/priority, generic creation/edit timestamps, record array order and evidence/cause ID list order do not change the approved evidence or completed scope. Leading/trailing whitespace around owner/reviewer names is normalized; other text changes are conservative material edits. Unlinked evidence, unaccepted and unlinked hypotheses, optional actions, timeline-only context and lesson edits do not invalidate a verification. Accepting or linking those records into the reviewed dependencies does.

No excluded field can establish approval. For example, reformatting a verifier name after reopening still requires the explicit approval command.

## Existing documents, imports and recovery

`verificationReviews` defaults to an empty array in the additive v1 schema. Existing files are never assigned inferred approval times, including records that were marked Effective or Closed. Read-time repair preserves the original close event and learning, and marks an unsupported historical closure for review without rewriting the stored original just to read it. The fictional demo store applies the same repair.

An unchanged document retains its valid review when saved, reloaded or serialized. JSON exports retain readable snapshots and prior decisions. Import and Duplicate continue to create a **new investigation ID**, preserve prior decisions as history and require a review for that copy. Existing investigations and their sequence counters are not overwritten. The original persistence, recovery-export and demo-isolation regressions remain in the browser suite.

This is a local workflow integrity model. User-editable browser files, names, timestamps and snapshots are not authenticated signatures or tamper-proof audit records. The [next milestone](next-milestone.md) still needs company authorization, server-enforced commands, concurrency handling, trusted shared storage and protected audit history before subscriptions.
