# Learning base event spec (v1, draft)

**Status:** Phase 0 draft for review. Docs only: nothing here is implemented yet, and the repo has no Nostr code today.
**Covers:** how every record in `lib/solve/schema.ts` and `lib/flow/schema.ts` (at `origin/main` `2b27076`) is stored as signed events on a company relay.
**Read with:** [README](README.md) for the direction, [roadmap](roadmap.md) for the phases, and the brief's guardrails, which apply everywhere.
**Gates:** S1–S9 in Prep's Phase 0 acceptance gates. The section for each gate is marked `[S1]` and so on.

The key words MUST, MUST NOT, SHOULD and MAY mean what they mean in RFC 2119.

All keys in this document and in `examples/` are **TEST ONLY**. Each one is derived as `sha256("loopsignal TEST ONLY <label>")`, so anyone can recompute the private key. Never use them for anything real. Relay URLs are placeholders (`wss://relay.example.invalid`, `ws://localhost`).

---

## 1. The model in one page

- **Members write change events (4600).** One user command produces one signed, append-only event. The event carries the full new state of every record the command touched, and for each record it names the version it was based on. Nothing is ever replaced, so history can't be lost.
- **Reviewers write approval events (4601).** Approving a verification, or approving a lesson, is a signature by a member who holds the reviewer role.
- **Owners write membership events (4680).** Who is a member, and who may approve, is itself in the log. That keeps guardrail 5 true: you can work out whether an approval counts from the events alone.
- **The relay writes receipts (4690).** Each receipt numbers an accepted event in order (`seq`) and chains to the previous receipt. Acceptance order decides "did this person hold the role at the time". `created_at` never decides it, because the signer chooses `created_at`.
- **The relay derives snapshots (36400).** A replaceable copy of each record's current state, for fast reads. A snapshot is a cache: anyone can rebuild it from the change events, and if the two disagree, the change events win.

Every event that belongs to an investigation or a map carries one scope tag, `w`, so a single filter fetches all of it (§4).

Records are identified by their existing ids (the 12-character nanoids in the zod schemas), so the Phase 1 round trip is lossless. Links between records are `e` tags that point at the event which created the target record (§6).

Phase notes: in Phase 2 (a stock local relay such as khatru or strfry with no custom hooks) there are no receipts, no snapshots and no role checks. Clients fold change events themselves and detect conflicts on their own (§7). Receipts, snapshots, role enforcement and stale-write rejection at the relay arrive with the Phase 3 company relay.

---

## 2. Event kinds `[S2]`

Five kinds. That is the fewest that work. A record that can ride inside another record's event does: `ProblemStatement`, `ImpactFlags` and `InvestigationSource` ride in the investigation record, `TimeObservation` rides in its step, and `forkedFromStepIds` entries ride on future-state steps.

| Kind | Range | Name | Signed by | Why it needs its own kind |
|---|---|---|---|---|
| `4600` | regular | Record change | the member making the change | Every write to every record type. It's regular, so relays keep every one and none is replaced. One kind covers all 18 record types (§5.1). Relay rules don't differ between record types, so splitting by type would add kinds and no rules. |
| `4601` | regular | Approval | a member with the reviewer role | The Phase 3 relay has to accept these from reviewers only. That rule is enforced by kind, and an approval must never be mixed into, or replaced by, an ordinary edit. |
| `4680` | regular | Membership | a member with the owner role | Role state has to be in the log (guardrail 5). It has to be readable without parsing investigation content, and every grant and revoke has to stay in history. |
| `4690` | regular | Relay receipt | the company relay's key | Acceptance order. This is the clock for authority (§9.3) and for rebuilding (§7.1). Only the relay can sign it, so it can't ride in a member's event. |
| `36400` | addressable (`30000`–`39999`) | Record snapshot (derived) | the company relay's key | The current state of one record, replaceable by design. If snapshots rode inside change events, replacing one would drop history. |

**Registry check.** `nostr-protocol/nips` README at commit [`b587c619c2ea662d40b40976aeccf6ac8d6ba9eb`](https://github.com/nostr-protocol/nips/blob/b587c619c2ea662d40b40976aeccf6ac8d6ba9eb/README.md), which was `master` head when I fetched it on 2026-11-07 (commit time 2026-11-07T13:37:05Z). Nothing is registered in 4600–4699 or 36400–36499. The nearest registered kinds are `4550` (NIP-72) and `5128` (NIP-5A) on the regular side, and `35128` (NIP-5A) and `37516` (NIP-CC) on the addressable side. NIP-90's old 5000–7000 range is marked unrecommended and isn't in the kinds table, but we stay clear of it anyway. The rest of each block (4602–4679, 4681–4689, 4691–4699, 36401–36499) is left free for later LoopSignal kinds. This check only shows the registry on the day it was run. Phase 1 SHOULD re-run it.

**Tag letters.** The new single-letter tag `w` (scope) is not used by any NIP at the same commit. I grepped every `*.md` for `["w",` and found none. `b`, `j`, `o` and `v` are the other unused letters. Every other tag in this spec is either a standard one (`e`, `p`, `k`, `d`, `x`, `alt`, `imeta`) or has a name longer than one letter, which relays don't index.

---

## 3. Common rules for every event

| Tag | On | Meaning |
|---|---|---|
| `["w", "<scope>"]` | 4600, 4601, 36400, and 4690 receipts for scoped events | The scope. `inv:<investigationId>` or `map:<mapId>`. Exactly one per event. |
| `["schema", "<family>", "<n>"]` | every event | Schema version tag (§8). Family is `solve`, `flow`, `company` or `relay`. For `solve` and `flow`, `n` equals that tool's `SCHEMA_VERSION`, which is `1` today. |
| `["alt", "<text>"]` | every event | NIP-31 fallback text. Fixed generic strings only (for example "LoopSignal record change"). It never contains record content. |

- Content is JSON text (RFC 8259), UTF-8, at most 64 KiB per event. A command that would exceed that is split (§5.2).
- `created_at` is the signer's own claim. It's for display only. It never orders, deduplicates or authorizes anything.
- Events are published only to the one relay URL the user configured (guardrail 1). Clients MUST NOT add relay hints to tags. The third element of every `e` tag is `""`.
- An event with a bad signature, no `schema` tag, or a malformed tag is invalid. Readers ignore it and relays reject it.

---

## 4. Scoping and queries `[S4]`

Every event that belongs to an investigation carries `["w", "inv:<id>"]`. Every event that belongs to a map carries `["w", "map:<id>"]`. Approvals carry the scope of the investigation they approve. Receipts copy the scope of the event they receipt. Membership events are company-wide and have no scope.

```json
["REQ", "ls-001", {"kinds": [4600, 4601], "#w": ["inv:HFBbSjIzaAPd"]}]
["REQ", "ls-001-order", {"kinds": [4690], "#w": ["inv:HFBbSjIzaAPd"]}]
["REQ", "ls-001-fast", {"kinds": [36400], "#w": ["inv:HFBbSjIzaAPd"]}]
["REQ", "roles", {"kinds": [4680]}, {"kinds": [4690], "#k": ["4680"]}]
```

The first filter returns everything needed to rebuild LS-001. The second returns the order. The third is the Phase 3 fast path. The fourth returns role state and its order.

---

## 5. Record changes (kind 4600) and field coverage

### 5.1 Record types

| `rec` type | Schema | Record id |
|---|---|---|
| `investigation` | `Investigation` (with `ProblemStatement`, `ImpactFlags`, `InvestigationSource`) | `Investigation.id` |
| `containment` | `ContainmentAction` | `id` |
| `cause` | `CauseNode` | `id` |
| `category` | `FishboneCategory` | `id` |
| `evidence` | `Evidence` | `id` |
| `evidence-link` | `EvidenceLink` | `id` |
| `timeline` | `TimelineEvent` | `id` |
| `action` | `Action` | `id` |
| `verification` | `Verification` | `id` |
| `lesson` | `LessonLearned` | `id` |
| `map` | `ProcessMap` (with `Scope`) | `ProcessMap.id` |
| `lane` | `Lane` | `id` |
| `map-version` | `MapVersion` (`kind` and `notes`) | `current` or `future` |
| `step` | `Step` (with `TimeObservation[]`) | `id` |
| `edge` | `Edge` | `id` |
| `pain-point` | `PainPoint` | `id` |
| `rationale` | `ChangeRationale` (with `LinkedAction`) | `<version>/<stepId>`, the key it has in `MapVersion.rationale` |
| `linked-investigation` | `LinkedInvestigation` | `id` |

Approvals (`VerificationReview` and lesson approvals) aren't 4600 records. They are 4601 events (§9).

### 5.2 Event shape

```text
tags:
  ["w", scope]
  ["schema", family, n]
  ["cmd", <command name>, <command id>, (<part>/<total>)]
  ["rec", <type>, <record id>, "create" | "update" | "remove"]   one per op
  ["e", <event id>, "", "base"]                                  one per base, see §7.2
  ["e", <create event id of target>, "", <field name>]           one per reference, see §6
  ["e", <approval event id>, "", "invalidates"]                  optional, see §9.5
  ["alt", "LoopSignal record change"]
content: {"cmd": <name>, "ops": [<op>, ...], "lifecycle"?: {"type": "closed" | "reopened", "note"?: <text>}}
op:      {"type": <rec type>, "id": <record id>, "op": "create" | "update" | "remove", "base"?: [<event id>, ...], "state"?: <record>}
```

- `state` is the **whole** record after the change, with exactly the field names of the zod schema. Fields marked client-local in §5.3 are left out. `remove` ops carry no `state`.
- `cmd` is the reducer command name (`add_cause`, `update_action`, `close`, `fork_future`, `sync_local`, and so on). It's for audit, and history is built from it (§7.4). The command id groups the events of one command.
- **One command, one event, so commands are atomic.** The exception is creates: an event creates **at most one** record. A command that creates several records is split into parts, and each part is tagged `n/total` (for example, `sync_local` of LS-001 is 53 parts). Creates can't conflict, so splitting them is safe. Readers treat a command as pending until all of its parts are present. Updates and removes in one command always go in one event.
- Retrying publishes the same signed event again. That's idempotent, because relays drop a duplicate id.

### 5.3 Field coverage: every field in both schemas `[S1]`

How to read the Location column. `state.x` means `content.ops[i].state.x` of a 4600 event, where `ops[i].type` is the record type in the Kind column. In a derived 36400 snapshot, the same value is at `content.x`. Where a row says "+ `e`/`f`", the value is also an `e` tag whose marker is `f` (§6). "Derived" means it is computed on read and never written. "Client-local" means it stays in the browser and is never sent to the relay.

| Schema · field(s) | Kind · record | Location |
|---|---|---|
| **shared `entity`** · `id` | 4600 · every record type that spreads `entity` | `["rec", type, id, op]` tag and `state.id`. Unique within its record type in a scope. A removed id is never reused. |
| `entity` · `createdAt`, `updatedAt` | 4600 · same | `state.createdAt`, `state.updatedAt`. These are the author's display times, carried over unchanged, and are never used for ordering. Exception: `Investigation.updatedAt` and `ProcessMap.updatedAt`, below. |
| **Investigation** · `id`, `createdAt` | 4600 · `investigation` | `state.id`, `state.createdAt`. The id also forms the scope `["w", "inv:<id>"]`. |
| Investigation · `updatedAt` | 4600 · `investigation` | `state.updatedAt`. Writers change it only when the investigation record itself changes. Readers show the latest `updatedAt` of any record in the scope. That equals today's value, and it means editing a cause doesn't also have to rewrite (and conflict on) the investigation record. |
| Investigation · `schemaVersion` | every event in the scope | `["schema", "solve", "<n>"]`. Not in content. |
| Investigation · `rcaNumber`, `title`, `owner`, `department`, `closedAt`, `reopenedCount` | 4600 · `investigation` | `state.<field>`. `closedAt` is set by `close` and cleared by `reopen`, as today. |
| Investigation · `status` | derived | `deriveStatus()` on read, as today ("Never edited directly"). |
| Investigation · `shopFloorMode` | client-local | A display mode for one screen. On a shared relay, one member's toggle would change everyone's view. **Assumption:** this is open question O-5. |
| Investigation · `problem` | 4600 · `investigation` | `state.problem` (all of `ProblemStatement`, below) |
| Investigation · `containment`, `causes`, `fishboneCategories`, `evidence`, `evidenceLinks`, `timeline`, `actions`, `verifications`, `lessons` | 4600 · one record per element | Each element is its own record (rows below). On read, array order is creation order. |
| Investigation · `verificationReviews` | 4601 | One approval event per element (`VerificationReview` rows). Reviews made in a browser before sync go to `state.legacyReviews` on the investigation record (§9.6). |
| Investigation · `history` | derived | Rebuilt from events (§7.4). A local array carried over at sync goes verbatim to `state.importedHistory` on the investigation record. |
| Investigation · `source` | 4600 · `investigation` | `state.source` (`InvestigationSource`, below) |
| **ProblemStatement** · `whatHappened`, `whatShouldHaveHappened`, `where`, `when`, `whenIso`, `frequency`, `impact`, `affected`, `process`, `department`, `equipment`, `product`, `financialImpactNote` | 4600 · `investigation` | `state.problem.<field>` |
| ProblemStatement · `generatedStatement` | 4600 · `investigation` | `state.problem.generatedStatement`. Derived text, stored as today. It stays out of the review snapshot, as today. |
| ProblemStatement · `impactFlags` | 4600 · `investigation` | `state.problem.impactFlags` |
| **ImpactFlags** · `customer`, `financial`, `safety`, `quality`, `delivery` | 4600 · `investigation` | `state.problem.impactFlags.<flag>` |
| **InvestigationSource** · `tool`, `mapNumber`, `label` | 4600 · `investigation` | `state.source.<field>` |
| InvestigationSource · `mapId`, `stepId`, `painPointId` | 4600 · `investigation` | `state.source.<field>` + `e`/`source.mapId`, `e`/`source.stepId`, `e`/`source.painPointId` (cross-scope, §6.2) |
| **ContainmentAction** · `id`, `createdAt`, `updatedAt`, `action`, `owner`, `scope`, `startedAt`, `quantityAffected`, `verificationNote`, `status` | 4600 · `containment` | `state.<field>` |
| **CauseNode** · `id`, `createdAt`, `updatedAt`, `text`, `origin`, `evidenceState`, `classification`, `rootCauseRationale`, `removalTest`, `note`, `challenged`, `candidate`, `order` | 4600 · `cause` | `state.<field>` |
| CauseNode · `parentId` | 4600 · `cause` | `state.parentId` + `e`/`parentId` (no tag when `null`) |
| CauseNode · `categoryId` | 4600 · `cause` | `state.categoryId` + `e`/`categoryId` |
| CauseNode · `collapsed` | client-local | Each viewer folds the tree on their own screen. Today's review policy already treats it as layout. Read back as the default, `false`. |
| **FishboneCategory** · `id`, `createdAt`, `updatedAt`, `name`, `order`, `isDefault` | 4600 · `category` | `state.<field>` |
| **Evidence** · `id`, `createdAt`, `updatedAt`, `title`, `type`, `description`, `source`, `date` | 4600 · `evidence` | `state.<field>`. File bytes are not a v1 field. §10 reserves `attachments`. |
| **EvidenceLink** · `id`, `createdAt`, `updatedAt`, `relation` | 4600 · `evidence-link` | `state.<field>` |
| EvidenceLink · `evidenceId`, `causeId` | 4600 · `evidence-link` | `state.<field>` + `e`/`evidenceId`, `e`/`causeId` |
| **TimelineEvent** · `id`, `createdAt`, `updatedAt`, `at`, `text`, `tag` | 4600 · `timeline` | `state.<field>`. `tag` is the record's own field, not a Nostr tag. |
| TimelineEvent · `causeId` | 4600 · `timeline` | `state.causeId` + `e`/`causeId` |
| **Action** · `id`, `createdAt`, `updatedAt`, `kind`, `horizon`, `title`, `description`, `owner`, `dueDate`, `priority`, `status`, `requiredForClosure`, `verificationMethod`, `expectedResult` | 4600 · `action` | `state.<field>`. `kind` here means corrective or preventive, not the event kind. |
| Action · `linkedCauseIds` | 4600 · `action` | `state.linkedCauseIds` + one `e`/`linkedCauseIds` per id |
| **Verification** · `id`, `createdAt`, `updatedAt`, `expected`, `observed`, `checkAt`, `verifier`, `result` | 4600 · `verification` | `state.<field>` |
| Verification · `actionId` | 4600 · `verification` | `state.actionId` + `e`/`actionId` |
| Verification · `evidenceIds` | 4600 · `verification` | `state.evidenceIds` + one `e`/`evidenceIds` per id |
| **VerificationReview** · `id` | 4601 · subject `verification` | `["rec", "review", id, "create"]` and `content.id` |
| VerificationReview · `verificationId` | 4601 | `content.verificationId` + `e`/`verificationId`. The approval also carries `e`/`reviewed`, the verification's head change at signing time. |
| VerificationReview · `approvedAt` | 4601 | `created_at`, shown as the decision time. Authority and order come from the receipt `seq` (§9.3), not this value. |
| VerificationReview · `approvedBy` | 4601 | `pubkey`: this is the identity that counts. `content.approvedByName` holds the trimmed `verifier` text, which is what today's code puts in `approvedBy`, kept for display. |
| VerificationReview · `reopenedEventId` | 4601 | `content.reopenedEventId` + `e`/`reopenedEventId` when it isn't `null` (§9.4) |
| VerificationReview · `snapshotVersion`, `snapshot` | 4601 | `content.snapshotVersion` (`1`) and `content.snapshot`: the canonical JSON string from `reviewSnapshot()`, unchanged, now inside a signed event |
| VerificationReview · `invalidatedAt` | derived | The `created_at` of the first accepted change after the approval that makes the snapshot differ, or the first accepted reopen after it (§9.5). Writers mark it with `e`/`invalidates`. For legacy reviews, it's stored in `state.legacyReviews[].invalidatedAt`. |
| **LessonLearned** · `id`, `createdAt`, `updatedAt`, `lesson`, `relatedProcess`, `standardWorkUpdate`, `trainingUpdate`, `documentUpdate`, `similarProcessesToReview` | 4600 · `lesson` | `state.<field>` |
| LessonLearned · `sourceVerificationId`, `sourceReviewId`, `approvedAt`, `approvedBy` | 4601 · subject `lesson` | `content.sourceVerificationId` + `e`/`sourceVerificationId`; `content.sourceReviewId` + `e`/`sourceReviewId`, which points at the verification approval event; `created_at`; `pubkey` (and `content.approvedByName`). If a synced local lesson already has these values, they stay in `state.<field>` as legacy values and never count as approval (§9.6). |
| **HistoryEvent (solve)** · `id`, `at`, `type`, `from`, `to`, `note` | derived | Built from events (§7.4): `id` is the event id, `at` is `created_at`, `type` follows the §7.4 table, `from` and `to` come from replaying `deriveStatus`, and `note` is `content.lifecycle.note`. Local entries go to `state.importedHistory[]` verbatim. |
| **ProcessMap** · `id`, `createdAt` | 4600 · `map` | `state.id`, `state.createdAt`. The id also forms the scope `["w", "map:<id>"]`. |
| ProcessMap · `updatedAt` | 4600 · `map` | Same rule as `Investigation.updatedAt`: readers show the latest `updatedAt` in the scope. |
| ProcessMap · `schemaVersion` | every event in the scope | `["schema", "flow", "<n>"]` |
| ProcessMap · `mapNumber`, `title`, `process`, `owner`, `department`, `site`, `unit`, `noPainPoints` | 4600 · `map` | `state.<field>` |
| ProcessMap · `scope` | 4600 · `map` | `state.scope` |
| **Scope** · `startsWith`, `endsWith` | 4600 · `map` | `state.scope.<field>` |
| ProcessMap · `status` | derived | `deriveStatus()` on read, as today |
| ProcessMap · `shopFloorMode` | client-local | Same as `Investigation.shopFloorMode` (O-5) |
| ProcessMap · `lanes` | 4600 · `lane` | One record per lane |
| ProcessMap · `versions` (`current`, `future`) | 4600 · `map-version` | One record per version that exists. The id is `current` or `future`. If `future` isn't there, the map has no future state. |
| ProcessMap · `investigations` | 4600 · `linked-investigation` | One record per element |
| ProcessMap · `history` | derived | Built from events (§7.4). The local array goes to `state.importedHistory` on the map record. |
| **Lane** · `id`, `createdAt`, `updatedAt`, `name`, `kind`, `order` | 4600 · `lane` | `state.<field>` |
| **MapVersion** · `kind`, `notes` | 4600 · `map-version` | `state.kind`, `state.notes` |
| MapVersion · `steps`, `edges`, `painPoints` | 4600 · `step`, `edge`, `pain-point` | One record each, with `state.version` set to `current` or `future` |
| MapVersion · `forkedFromStepIds` | 4600 · `step` | Each entry rides on its future step as `state.forkedFromStepId` + `e`/`forkedFromStepId`. `normalizeVersion()` already prunes the map to existing steps, so this loses nothing. The `future` version reads back as an object (empty if there are no entries), and `current` reads back as undefined. |
| MapVersion · `rationale` | 4600 · `rationale` | One record per key (rows below) |
| **Step** · `id`, `createdAt`, `updatedAt`, `order`, `type`, `name`, `description`, `cycleTimeMin`, `waitBeforeMin`, `valueClass`, `system`, `trigger`, `batchSize`, `firstPassYield`, `timeSource` | 4600 · `step` | `state.<field>` |
| Step · `laneId` | 4600 · `step` | `state.laneId` + `e`/`laneId` |
| Step · `observations` | 4600 · `step` | `state.observations[]` |
| **TimeObservation** · `id`, `at`, `durationMin`, `note` | 4600 · `step` | `state.observations[].<field>`. Rides inside its step. |
| **Edge** · `id`, `createdAt`, `updatedAt`, `label`, `isPrimary` | 4600 · `edge` | `state.<field>` |
| Edge · `fromStepId`, `toStepId` | 4600 · `edge` | `state.<field>` + `e`/`fromStepId`, `e`/`toStepId` |
| **PainPoint** · `id`, `createdAt`, `updatedAt`, `text`, `category`, `severity` | 4600 · `pain-point` | `state.<field>` |
| PainPoint · `stepId` | 4600 · `pain-point` | `state.stepId` + `e`/`stepId` |
| PainPoint · `investigationId` | 4600 · `pain-point` | `state.investigationId` + `e`/`investigationId` (cross-scope) |
| **ChangeRationale** · `text` | 4600 · `rationale` | `state.text`. The record id is `<version>/<key>`. `state.stepId` holds the key, + `e`/`stepId`. The key is the future step for added or changed steps, and the current step for removed ones. |
| ChangeRationale · `linkedAction` | 4600 · `rationale` | `state.linkedAction` |
| **LinkedAction** · `investigationId`, `actionId` | 4600 · `rationale` | `state.linkedAction.<field>` + `e`/`linkedAction.investigationId`, `e`/`linkedAction.actionId` (cross-scope) |
| **LinkedInvestigation** · `id`, `openedAt`, `lastKnownStatus` | 4600 · `linked-investigation` | `state.<field>`. `lastKnownStatus` stays a cache, as today. If the investigation is on the relay, readers SHOULD show its live status. |
| LinkedInvestigation · `investigationId`, `stepId`, `painPointId` | 4600 · `linked-investigation` | `state.<field>` + `e`/`investigationId` (cross-scope), `e`/`stepId`, `e`/`painPointId` |
| **HistoryEvent (flow)** · `id`, `at`, `type`, `note` | derived | Same as solve history (§7.4). Local entries go to `state.importedHistory[]`. |
| **MapBundle** · `kind`, `map`, `investigations` | not stored | This is a file envelope for export, not a record. The relay equivalent is the map's scope plus the scopes of the investigations it links to. Export keeps writing the same file. |

The investigation and map records also carry two more keys that aren't schema fields: `state.importedHistory` and `state.legacyReviews`. They exist only on records that started life in a browser (§7.4, §9.6).

`stages` and `isStage` in both schema files are UI routes, not data, so they aren't stored.

---

## 6. Links between records `[S4]`

### 6.1 Rule

Every reference from one record to another is an `e` tag. Its marker is the field name, and it points at the **event that created the target record**. The content keeps the plain id as well, so the domain record reads back unchanged. A writer MUST emit exactly one tag per reference value. A reader MUST reject an event whose reference tags don't match its content. Phase 1 tests this ("link integrity").

Why `e` to the create event, not `a`: an `a` coordinate includes the author's pubkey, but members edit each other's records, so there is no single author. A create event id doesn't change no matter who edits the record later. It also can't be forged, because it's a hash, and it stays valid after a restore to a relay with a different key.

A reference to a record created **in the same event** can't name that event's own id. Since an event creates at most one record (§5.2), this only comes up when a record references itself, which nothing in either schema does.

| Field | Marker | Target `rec` type |
|---|---|---|
| `CauseNode.parentId` | `parentId` | `cause` |
| `CauseNode.categoryId` | `categoryId` | `category` |
| `EvidenceLink.evidenceId` / `.causeId` | `evidenceId` / `causeId` | `evidence` / `cause` |
| `TimelineEvent.causeId` | `causeId` | `cause` |
| `Action.linkedCauseIds[]` | `linkedCauseIds` | `cause` |
| `Verification.actionId` | `actionId` | `action` |
| `Verification.evidenceIds[]` | `evidenceIds` | `evidence` |
| `InvestigationSource.mapId` / `.stepId` / `.painPointId` | `source.mapId` / `source.stepId` / `source.painPointId` | `map` / `step` / `pain-point` |
| `Step.laneId` | `laneId` | `lane` |
| `Step.forkedFromStepId` (from `MapVersion.forkedFromStepIds`) | `forkedFromStepId` | `step` |
| `Edge.fromStepId` / `.toStepId` | `fromStepId` / `toStepId` | `step` |
| `PainPoint.stepId` | `stepId` | `step` |
| `PainPoint.investigationId` | `investigationId` | `investigation` |
| `ChangeRationale` key | `stepId` | `step` |
| `LinkedAction.investigationId` / `.actionId` | `linkedAction.investigationId` / `linkedAction.actionId` | `investigation` / `action` |
| `LinkedInvestigation.investigationId` / `.stepId` / `.painPointId` | `investigationId` / `stepId` / `painPointId` | `investigation` / `step` / `pain-point` |
| `VerificationReview.verificationId` (4601) | `verificationId` | `verification` |
| `VerificationReview.reopenedEventId` (4601) | `reopenedEventId` | the 4600 reopen event itself |
| Lesson approval (4601) | `lessonId` / `sourceVerificationId` | `lesson` / `verification` |
| `LessonLearned.sourceReviewId` (4601) | `sourceReviewId` | the 4601 verification approval itself |
| Change base (4600) | `base` | the 4600 event that last changed the record (§7.2) |
| Invalidation marker (4600) | `invalidates` | the 4601 approval it invalidates (§9.5) |
| Snapshot (36400) | `create` / `head` | the record's create event / its current head |

### 6.2 Cross-scope references

Flow → solve (`PainPoint.investigationId`, `LinkedInvestigation.investigationId`, `LinkedAction.*`) and solve → flow (`InvestigationSource.*`) work the same way, as long as the target is on the same relay. Today these ids point into the same browser store. If the target hasn't been synced, the content keeps the id, the tag is left off, and the reader shows the link as "not shared". This is the one case where a reference has no tag. It's allowed because local-first stays intact (guardrail 3): nothing is uploaded just to satisfy a link.

---

## 7. History, stale writes and conflicts `[S3]`

### 7.1 (a) Rebuilding a record from change events

1. Fetch the scope's 4600 events and their 4690 receipts (§4).
2. Drop invalid events. With a Phase 3 relay, also drop any event that has no receipt, because that event was never accepted.
3. Order by receipt `seq`. Without receipts (Phase 2), order by the `base` links, then `created_at`, then id. That ordering is only for display. Conflict detection (7.2) doesn't depend on it.
4. Apply each event as one unit. `create` makes the record, `update` replaces its state with `state`, and `remove` leaves a tombstone. If **any** op in an event is stale (7.2), **none** of that event's ops are applied, and each of its op states is kept as a conflicting version.
5. A record's current state is the state from its head. A snapshot (36400) is exactly this result for one record, signed by the relay. A snapshot that disagrees with the fold is wrong and gets rebuilt.

The Phase 1 prototype used for `examples/` rebuilt the LS-001 investigation from its 53 events, and the flow sample from its 78 events. Both matched the original documents field for field (see "What was verified" at the end).

### 7.2 (b) The stale-write rule

- **Base.** Every `update` or `remove` op names, in `op.base` and as `e`/`base` tags, the id of each 4600 event that was a head of that record when the writer read it. A record's **heads** are the accepted events with an op for it that no later accepted op for the same record names as a base. Normally a record has exactly one head.
- **Stale.** An op is stale if its `base` doesn't name every current head of the record. A `create` is stale if the record id already exists in the scope.
- **Phase 3 relay.** The relay checks this atomically when the event arrives. If any op is stale, it rejects the whole event: `["OK", <id>, false, "invalid: stale base for action/<id>; head is <event id>"]`. No receipt is issued.
- **Phase 2 relay (no hooks).** Both writes get stored. Readers find two heads and mark the record as being in conflict. The same rule covers forks restored from two backups.
- **Resolving.** Any member publishes an `update` whose `base` names every head. The record has one head again, and every version stays in history.

Two members editing **different** records never conflict. Two members editing the same record do, even when they changed different fields. v1 deliberately doesn't do field-level merging (open question O-6). Writers leave the investigation and map records alone when they change other records (§5.3, `updatedAt`), so this doesn't turn every write into a conflict.

### 7.3 (c) What a member sees on a conflict

> Someone else saved a change to this item after you opened it, so your change was not saved over theirs. You can see both versions side by side. Keep one, or combine them, and save again.

This describes the behavior. The final wording belongs to Prep's Phase 2 UX gate, and Foreman reviews it. Until the member resolves the conflict, their own version stays in the local sync queue with status `conflict`. It is never dropped.

### 7.4 (d) Today's local `HistoryEvent` arrays

- **When a local record is synced,** its `history` array is copied verbatim into `state.importedHistory` on the investigation or map record. Its entries are browser claims. The event is signed, which proves who uploaded it, but not that the entries are true. Readers label them "recorded locally before sharing".
- **After sync, nobody writes the arrays.** History is the event log:

| Today's `history` type | Where it comes from on the relay |
|---|---|
| solve `created`, flow `created` | the 4600 that creates the investigation or map record |
| solve `status_changed` | derived by replaying `deriveStatus()` after each accepted change |
| solve `closed` | 4600 with `content.lifecycle.type = "closed"` (`cmd` `close`) |
| solve `reopened` | 4600 with `content.lifecycle.type = "reopened"`. That's either `cmd` `reopen`, or any command that auto-reopens a closed investigation, which today's reducer already does. |
| solve and flow `imported`, `duplicated` | `cmd` `import` or `duplicate` on the create event. These still create a **new id**, as today. |
| solve `verification_reviewed` | the 4601 approval |
| flow `current_mapped` | derived: the first accepted change after which `isCurrentMapped()` holds, as today's reducer does it |
| flow `future_forked` | `cmd` `fork_future` |
| flow `investigation_opened` | `cmd` `link_investigation`, which creates a `linked-investigation` record |

- When a reader produces the domain `history` array, it's `importedHistory` followed by entries built from events: `id` is the event id and `at` is `created_at`.

---

## 8. Schema versions and migration `[S5]`

Every event carries `["schema", family, n]`. A reader built for version `R` of a family:

1. **Unknown kind** in 4600–4699 or 36400–36499, or an unknown family: ignore it. Never delete it, and never write anything that depends on it.
2. **`n > R`** (a newer writer): show that scope read-only, with the message today's import shows ("made by a newer LoopSolve (schema n). Update LoopSolve to open it."). Never publish an op whose base is a newer-version event, because that would silently drop fields the reader doesn't know about.
3. **`n = R`**: unknown keys in `state` MUST be carried forward unchanged when that record is rewritten. Today's zod schemas strip unknown keys, so the Phase 1 codec has to keep them aside for the rewrite.
4. **`n < R`**: run the existing migration chain (`lib/loop/migrate.ts`, keyed by from-version, via `migrate()` in `lib/solve/io.ts` and `lib/flow/io.ts`) on `state` when reading. New writes use `R`. Old events are never rewritten, because history is append-only.
5. **No `schema` tag**: the event is invalid.

**Today's local records** have `schemaVersion: 1`. Sync runs `migrate()` first, which is a no-op at v1, and then publishes with `["schema", "solve" | "flow", "1"]`. The `schemaVersion` value lives in the tag, not in `state`.

---

## 9. Membership, receipts and approvals `[S6]`

### 9.1 Today's rules, which stay

From `lib/solve/reducer.ts` (`approve_verification`), `lib/solve/reviews.ts`, `lib/solve/rules.ts` and `docs/product-preview/reviews.md`:

- Only the explicit approve command creates a review. Picking Effective, editing, or bumping `updatedAt` never does.
- A review is possible only when `reviewBlockers()` is empty: the latest verification for a required action, result `effective`, plus the shared root-cause and containment requirements.
- A review binds a canonical snapshot of its dependencies, plus the latest reopening event id.
- It becomes invalid when a material dependency changes. Reverting the change doesn't bring it back. Reopening invalidates every earlier review.
- **Legacy lessons are never auto-credited.** A lesson counts only through the exact review it names (`sourceReviewId`), and a new review doesn't silently re-approve an old lesson.

What's new is only this: the review, and the lesson approval, are signed events, and the signer has to have authority.

### 9.2 Membership (4680) and who may approve

```text
pubkey: an owner      tags: ["p", <member>], ["op", "grant" | "revoke"], ["role", <role>]..., ["schema", "company", "1"]
content: {"name": <display name>}
```

- **Provisional roles, until the Phase 5 role matrix:** `owner` (grants and revokes roles), `member` (may read and write 4600), and `reviewer` (may sign 4601). Revoking `member` removes every role.
- **Who may approve, provisionally:** any member who holds `reviewer` in the role state at the approval's receipt (9.3).
- **Root of trust.** The company relay's configuration pins one owner pubkey. That pinned key is the only role state that lives outside the log. Everything after it is a 4680 event, and replaying with the same pinned key gives the same role state, so guardrail 5 holds. The pinned key is part of the backup (Phase 3).
- **Self-approval, as today's code handles it:** the reducer copies `approvedBy` from the verification's own `verifier` text. It doesn't compare the approver with the action owner, with whoever wrote the verification, or with the investigation owner. One person can complete an action, verify it and approve it. (In LS-001, M. Okafor owns the investigation and is the verifier on both verifications.) This spec keeps that behavior: the relay accepts an approval from the member who wrote the verification. Whether that should change is open question O-1. One note for whoever decides: today the action owner is free text, not a member, so a "the approver isn't the owner" rule can't be checked until owners are members.

### 9.3 What proves authority, and "at the time"

A signature proves who holds the key. Authority is a separate question: did that key hold `reviewer` **when the relay accepted the approval**?

- **The clock is the receipt chain.** For each event it accepts, the Phase 3 relay publishes a 4690 receipt: `["e", <id>, "", "accepted"]`, `["k", <kind>]`, `["seq", <n>]`, `["e", <previous receipt>, "", "prev"]`. `seq` goes up by one with each accepted event. Each receipt names the one before it, so the order can't be rewritten without breaking the chain. That only protects against members who hold receipts already. It doesn't protect against the relay's own key (§11).
- **The rule.** Approval `A` with receipt `seq = n` has authority if, in the role state built from every 4680 whose receipt `seq < n` (each one signed by a key that held `owner` at its own `seq`), `A.pubkey` holds `member` and `reviewer`. `created_at` is never consulted.
- **At write time,** the Phase 3 relay applies the same rule to its current role state and rejects with `["OK", <id>, false, "restricted: signer is not a reviewer"]`.
- **On replay or restore,** every reader re-checks the rule from receipts and 4680 events, so an approval that a faulty or hook-less relay accepted still fails. A restore MUST carry the original receipts, verified against the original relay key, and continue the chain from them. If an approval's receipt can't be verified, its authority is "unknown" and it doesn't count.
- **Consequence, stated plainly:** an approval signed offline that reaches the relay **after** the reviewer was revoked is rejected, even though it was signed earlier. The reviewer has to be re-granted and approve again.
- **Before Phase 3** (no receipts, no roles): approvals are signed, but their authority can't be established. The app behaves as it does today, so any member can approve for closure. The learning base (Phase 4) credits only approvals that pass this rule.

**Worked case: a revoked reviewer backdates an approval.** These are the real events in `examples/worked-case.events.json` and `examples/receipts.events.json`.

| seq | Event | Effect |
|---|---|---|
| 1 | 4680 owner → owner: grant `member`, `owner` | the pinned owner records itself |
| 2 | 4680 owner → M. Okafor: grant `member`, `reviewer` | |
| 3 | 4680 owner → R. Delgado: grant `member`, `reviewer` (`created_at` 2026-11-07T14:00:05Z) | |
| 4–134 | 4600 sync of LS-001 (53 parts) and the flow sample (78 parts) | |
| 135–136 | 4600: resolve the challenge on root cause a4; add a completed corrective action for root cause b3 | makes act1's verification reviewable (9.7) |
| 137 | 4601 M. Okafor approves act1's verification | valid: Okafor holds `reviewer` in the state from seq 1–136 |
| 138 | 4601 M. Okafor approves the lesson | valid |
| 139 | 4600 update act3 | |
| 140 | 4600 edit evidence e1, marked `invalidates` the seq-137 approval | approval 137 is no longer current |
| 141 | 4680 owner → R. Delgado: revoke `reviewer` (`created_at` 2026-11-07T14:04:42Z) | |
| — | 4601 R. Delgado approves the edited verification, with `created_at` 2026-11-07T14:00:10Z (before seq 141's time) | **rejected** |

The backdated approval arrives after seq 141. The Phase 3 relay checks its current role state, finds no `reviewer` for Delgado, and rejects it. No receipt is issued. Now suppose a relay without the hook had stored it anyway: its receipt would be seq 142 or later, the state built from seq 1–141 has no `reviewer` for Delgado, and every reader rejects it on replay. The 14:00:10 `created_at` makes no difference either way. The prototype checked both outcomes: `approval authorized: true`, `backdated approval authorized at relay time: false`.

### 9.4 The approval event (4601)

**Verification review** (`["subject", "verification"]`), signed by the reviewer:

```text
tags: ["w", scope], ["schema", "solve", "1"], ["subject", "verification"],
      ["rec", "review", <review id>, "create"],
      ["e", <verification create event>, "", "verificationId"],
      ["e", <verification head change at signing>, "", "reviewed"],
      ["e", <latest reopen 4600>, "", "reopenedEventId"]        (only when not null)
content: {"id", "verificationId", "approvedByName", "reopenedEventId", "snapshotVersion": 1, "snapshot"}
```

`reopenedEventId` is the id of the latest accepted 4600 that carries `lifecycle.type = "reopened"`, so `latestReopenId()` becomes that event id. For investigations synced from a browser, if no reopen has happened on the relay, it's the id of the latest `reopened` entry in `importedHistory`.

**Lesson approval** (`["subject", "lesson"]`), signed by the reviewer: tags `e`/`lessonId`, `e`/`sourceReviewId` (the verification approval) and `e`/`sourceVerificationId`. Content: `{"lessonId", "sourceReviewId", "sourceVerificationId", "approvedByName"}`.

### 9.5 When something counts

- **A verification approval `A` is valid** if (1) it has authority (9.3), and (2) in the state rebuilt from changes with `seq < n`, `reviewBlockers()` is empty for its verification, `content.snapshot` equals `reviewSnapshot()`, and `content.reopenedEventId` equals `latestReopenId()`. This is the same guard as `approve_verification`. If the verification already had a current review at `n`, `A` changes nothing, just as the reducer ignores the command today.
- **It is current** (that is, `currentReview()`) if it is valid, it is the latest valid approval for that verification, no accepted change after it made the snapshot differ, no accepted reopen came after it, and its snapshot equals `reviewSnapshot()` of the current state.
- **`invalidatedAt`** is the `created_at` of the first accepted 4600 after `A` (by `seq`) that changes the snapshot, or the first reopen. That 4600 SHOULD carry `["e", A.id, "", "invalidates"]`. Readers also recompute it, and a marker can't be undone. So once invalid, always invalid, which matches "reverting does not reactivate". Readers compute invalidation; it doesn't depend on the marker.
- **A lesson is approved** if a lesson approval `B` for it has authority at its own `seq`, and the approval named in `B.sourceReviewId` is the current review of the latest verification for its action. That is today's demo rule: `sourceVerificationId === latest.id && sourceReviewId === currentReview(latest).id`. Editing the lesson's text later doesn't withdraw its approval, which is also today's behavior. Whether it should is open question O-2.

### 9.6 Records made before sharing (legacy)

When a browser investigation is synced, its local `verificationReviews` aren't turned into approvals, since nobody signed them. They're copied to `state.legacyReviews` on the investigation record. Any of them without `invalidatedAt` gets the sync time. Local lesson approvals (`approvedAt`, `approvedBy`, `sourceReviewId`) stay in the lesson's `state` as written. Neither one ever counts. Each verification needs a fresh signed review on the relay, which is the same thing today's Import and Duplicate already require. This is the one deliberate exception to a lossless round trip: active local reviews read back invalidated. LS-001 and the flow sample have no reviews, so their round trip is exact.

### 9.7 LS-001 as shipped can't be approved yet

Running `reviewBlockers()` on act1's effective verification in the unmodified sample returns two blockers: root cause a4 is still `challenged`, and root cause b3 has no completed corrective action. The worked case adds two ordinary changes first (seq 135–136). Both are in `examples/worked-case.events.json` under `preApprovalChanges`. This is today's rule doing its job, and this spec doesn't loosen it.

---

## 10. Attachments `[S7]`

There is no attachment field in v1. Evidence of type `photo_ref` holds a text pointer, for example `qa-share/rca/LS-001/locator-wear.jpg` in the sample. Phase 3 adds one optional field, alongside the company Blossom endpoint:

```text
Evidence.state.attachments: [{"sha256": <hex>, "mime": <type>, "size": <bytes>, "name"?: <text>}]
tags, one set per attachment: ["x", <sha256>], ["imeta", "x <sha256>", "m <mime>", "size <bytes>"]
```

- The bytes live **only** on the company's Blossom endpoint, at `<endpoint>/<sha256>` (BUD-01). Uploads and downloads use Blossom auth (kind 24242), and the relay's member list decides access (Phase 3).
- Events store no URL. The hash is the address, so a restore to a new host keeps every reference valid.
- The hash proves the bytes didn't change. It doesn't prove they still exist. The restore drill (Phase 3) has to restore the bytes as well as the events.
- Readers older than this field ignore it (§8, rule 3: writers carry it forward).

---

## 11. Deletion, retention, and what signatures don't prove `[S8]`

**Removing a record in the app** publishes a `remove` op. The record disappears from current views, but its earlier versions stay in history. That's what keeps the audit trail whole.

**NIP-09** is different. A kind-5 event, signed by the **same key** as the events it names, asks relays to stop serving them. Relays SHOULD delete them, and clients SHOULD hide them. It doesn't guarantee:

- copies already downloaded to members' browsers (IndexedDB or localStorage), JSON exports, or printed reports
- backups, which keep the events until that backup ages out
- derived data (snapshots and the Phase 3 index) until it's rebuilt
- anything at all, if the relay chooses to ignore the request
- deletion of a departed member's events. NIP-09 only lets an author delete their own events, so erasing someone else's data needs an operator-level purge. That's Phase 3 retention work, and the policy is open (O-4).

Proposed for Phase 3 (not decided here): the company relay refuses NIP-09 requests for 4601, 4680 and 4690, so approvals, role history and the order of events can't be erased by the people they concern.

**What signatures prove, and what they don't.** A signature proves that each record is unchanged since it was signed. It doesn't prove that the set of records is complete. Whoever runs the relay can drop events or decline to serve them, and on a LoopSignal-hosted relay that's us. The receipt chain lets a member notice a gap only if they already hold a later receipt. It doesn't stop the relay's key holder from rewriting it. "Every record signed and tamper-evident" is accurate. "Nothing was removed" is not, and no copy may say it.

**Draft customer sentences, pending Foreman's review:**

1. *Deletion:* "Removing a record takes it out of everyday views but keeps it in the audit history. Erasing it from the server is a separate step, and copies can remain in backups, exports and on devices that already downloaded it until those are cleared too."
2. *Completeness:* "Every record is signed, so a change made after it was saved can be detected. Signatures can't prove that no record is missing: whoever runs the server could remove one, and when LoopSignal hosts your server, that is us."

---

## 12. Derived snapshots (kind 36400)

Phase 3. The relay signs them with its own key. `["d", "<scope>/<type>/<id>"]`. Content is the record's current `state` (or `{"removed": true}`). The tags include `e`/`create`, `e`/`head`, `["seq", <head's seq>]`, the scope and schema tags, and the same reference tags as the head. Members never publish 36400. Readers MAY use snapshots for fast loads. Anything that decides authority or closure MUST use the change events.

---

## 13. Examples `[S9]`

These are real, valid events: the ids are computed and the signatures verify. A throwaway encoder generated them from `buildSample("LS-001")` (`lib/solve/sample.ts`) and `buildSampleMap("MAP-2026-001", { linkInvestigation })` (`lib/flow/sample.ts`), with `now = 2026-11-07T12:00:00Z` and `TZ=UTC`. The samples generate fresh ids on every run, so these ids are one fixed instance. Full sets:

| File | What's in it |
|---|---|
| `examples/ls-001.record.json` | the LS-001 `Investigation` document the events were built from |
| `examples/ls-001.events.json` | the 53 kind-4600 events that express it |
| `examples/flow-sample.record.json` | the flow `ProcessMap` document |
| `examples/flow-sample.events.json` | its 78 kind-4600 events |
| `examples/worked-case.events.json` | membership, pre-approval changes, both approvals, update, stale update, invalidating update, backdated approval, derived snapshot |
| `examples/receipts.events.json` | all 141 receipts, seq 1–141 |

TEST ONLY pubkeys: owner `822976b9700ef0a83975f96743613ac78dd4a78ca898aae090b8b324ed668191`, M. Okafor `a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80`, R. Delgado `43d63c021295adb5f0ff3680c2656933f69c8226959c777817f7418ea74cfecc`, relay `61d67638af08350531e450c48872b520404af0b5f6e6e6276d1677d67b582671`.

### 13.1 Kind 4600: create (LS-001 root cause a4)

```json
{
  "id": "03548a749d2ae7a55097969ab21d55be84950f7f2cd7ae02a745729f96721faa",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060027,
  "kind": 4600,
  "tags": [
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["cmd", "sync_local", "cmd-sync-ls001", "11/53"],
    ["rec", "cause", "4bTvlbY6HF2J", "create"],
    ["e", "225faf0a6b4c7a390d92a2c61073f8b21b67343d4767369390457d2c127dc8c3", "", "parentId"],
    ["alt", "LoopSignal record change"]
  ],
  "content": "{\"cmd\":\"sync_local\",\"ops\":[{\"type\":\"cause\",\"id\":\"4bTvlbY6HF2J\",\"op\":\"create\",\"state\":{\"id\":\"4bTvlbY6HF2J\",\"createdAt\":\"2026-10-27T09:30:00.000Z\",\"updatedAt\":\"2026-10-27T09:30:00.000Z\",\"text\":\"Locator wear was not caught because the fixture PM interval (12 months) is longer than the locator's wear life at current volume\",\"parentId\":\"ETpXi0V7OqWJ\",\"origin\":\"why\",\"evidenceState\":\"verified\",\"classification\":\"root\",\"rootCauseRationale\":\"Wear measurements on FX-118 and its sister fixture show locators leave tolerance around month 7 at current volume. The 12-month PM interval was set in 2019 at half today's volume. Removing this cause (shorter interval) prevents the shift that caused the oversize hole.\",\"removalTest\":\"yes\",\"challenged\":true,\"candidate\":true,\"order\":0}}]}",
  "sig": "830bdfada92265fc59fb36894919f2661c7ae8bf9eb4a5a83dcb1e35c78b32fad41548ce239eaad115f7523d5bbd590e26cd5b9822860f2ed7ecda1f7ec4ec57"
}
```

### 13.2 Kind 4600: update with a base (LS-001 act3), accepted at seq 139

```json
{
  "id": "922c59b96bda3f9aabdebb62b3a09d715b10a1a2cce901eac70c4a12db0aa015",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060277,
  "kind": 4600,
  "tags": [
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["cmd", "update_action", "cmd-0003"],
    ["rec", "action", "0--Ml6gJe5OM", "update"],
    ["e", "397c00faa79176f3d535d7a1e00ceb5e46b8dd7ccd20566d564ae080ee988cc5", "", "base"],
    ["e", "03548a749d2ae7a55097969ab21d55be84950f7f2cd7ae02a745729f96721faa", "", "linkedCauseIds"],
    ["alt", "LoopSignal record change"]
  ],
  "content": "{\"cmd\":\"update_action\",\"ops\":[{\"type\":\"action\",\"id\":\"0--Ml6gJe5OM\",\"op\":\"update\",\"base\":[\"397c00faa79176f3d535d7a1e00ceb5e46b8dd7ccd20566d564ae080ee988cc5\"],\"state\":{\"id\":\"0--Ml6gJe5OM\",\"createdAt\":\"2026-10-29T10:00:00.000Z\",\"updatedAt\":\"2026-11-07T14:10:00.000Z\",\"kind\":\"preventive\",\"horizon\":\"structural\",\"title\":\"Change fixture PM interval to 6 months and add locator measurement to the PM checklist\",\"description\":\"Update CMMS PM template for the FX-1xx family; record locator diameter at each PM.\",\"linkedCauseIds\":[\"4bTvlbY6HF2J\"],\"owner\":\"L. Ferreira\",\"dueDate\":\"2026-11-13\",\"status\":\"ready_for_verification\",\"priority\":\"high\",\"verificationMethod\":\"CMMS template review + first PM record\",\"expectedResult\":\"Locators replaced before reaching minimum diameter\"}}]}",
  "sig": "938a199778c318c44e4abab84e1adebb3a68ece7b229ab40a221c20a91cc4adb0f2e2a6466ed04e9506d3df970eb74bd5c6030aba7294648558de33f8a13e5b2"
}
```

The same base, from another member, which the Phase 3 relay rejects as stale (`invalid: stale base for action/…`):

```json
{
  "id": "2e0cc3aafc13f9cfe6569c00779030346d7530db69315cc2723fdd4ba5a94006",
  "pubkey": "43d63c021295adb5f0ff3680c2656933f69c8226959c777817f7418ea74cfecc",
  "created_at": 1794060279,
  "kind": 4600,
  "tags": [
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["cmd", "update_action", "cmd-0004"],
    ["rec", "action", "0--Ml6gJe5OM", "update"],
    ["e", "397c00faa79176f3d535d7a1e00ceb5e46b8dd7ccd20566d564ae080ee988cc5", "", "base"],
    ["e", "03548a749d2ae7a55097969ab21d55be84950f7f2cd7ae02a745729f96721faa", "", "linkedCauseIds"],
    ["alt", "LoopSignal record change"]
  ],
  "content": "{\"cmd\":\"update_action\",\"ops\":[{\"type\":\"action\",\"id\":\"0--Ml6gJe5OM\",\"op\":\"update\",\"base\":[\"397c00faa79176f3d535d7a1e00ceb5e46b8dd7ccd20566d564ae080ee988cc5\"],\"state\":{\"id\":\"0--Ml6gJe5OM\",\"createdAt\":\"2026-10-29T10:00:00.000Z\",\"updatedAt\":\"2026-11-07T14:11:00.000Z\",\"kind\":\"preventive\",\"horizon\":\"structural\",\"title\":\"Change fixture PM interval to 6 months and add locator measurement to the PM checklist\",\"description\":\"Update CMMS PM template for the FX-1xx family; record locator diameter at each PM.\",\"linkedCauseIds\":[\"4bTvlbY6HF2J\"],\"owner\":\"L. Ferreira\",\"dueDate\":\"2026-12-01\",\"status\":\"in_progress\",\"priority\":\"high\",\"verificationMethod\":\"CMMS template review + first PM record\",\"expectedResult\":\"Locators replaced before reaching minimum diameter\"}}]}",
  "sig": "921b9aa1880e256762e4c2ea47a67102f14b04adc623cf93f3786f23abcb5d7da450ac60bc382b3b254644d1ed226c1c4dc7f649734e9657e4b52321e6374632"
}
```

### 13.3 Kind 4600: flow sample, a cross-scope link (pain point on step 6 → LS-001)

```json
{
  "id": "d98f27a6627e1e0d634a42142627e747b4a0552c78df405b709f33ce0827b21b",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060191,
  "kind": 4600,
  "tags": [
    ["w", "map:aZU4KPu1evkj"],
    ["schema", "flow", "1"],
    ["cmd", "sync_local", "cmd-sync-map001", "40/78"],
    ["rec", "pain-point", "NycLXvjVBGvS", "create"],
    ["e", "60737fdf11e4a47dbd42392a6e5eecc309455e9787ae25b98757e81bd5d77f89", "", "stepId"],
    ["e", "3d5fbb7f279025286b1b51b8f2afcec81810d2c2419a0783e7056c79210209c9", "", "investigationId"],
    ["alt", "LoopSignal record change"]
  ],
  "content": "{\"cmd\":\"sync_local\",\"ops\":[{\"type\":\"pain-point\",\"id\":\"NycLXvjVBGvS\",\"op\":\"create\",\"state\":{\"id\":\"NycLXvjVBGvS\",\"createdAt\":\"2026-10-21T11:20:00.000Z\",\"updatedAt\":\"2026-10-21T11:20:00.000Z\",\"stepId\":\"7oI0DEZWul89\",\"text\":\"Manufacturability review does not check drawing tolerances against fixture capability. The BR-2210 oversize hole surfaced in production, not at quote.\",\"category\":\"quality\",\"severity\":\"high\",\"investigationId\":\"HFBbSjIzaAPd\",\"version\":\"current\"}}]}",
  "sig": "443f71286e39f1300846c09235e12ab6ac6b5f27e9e076ca40247609a1a6fc8b3e1da5fc61bb114942e4913201dd67200ffd746d1f1d85ec6ce42a9308ad5488"
}
```

A flow step with its time observations riding inside it:

```json
{
  "id": "c4f76cc557286be4b17a0a5ecdbecc4b8805e2e89bf128001aad5d36874fcc02",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060131,
  "kind": 4600,
  "tags": [
    ["w", "map:aZU4KPu1evkj"],
    ["schema", "flow", "1"],
    ["cmd", "sync_local", "cmd-sync-map001", "10/78"],
    ["rec", "step", "_G_1pel5N419", "create"],
    ["e", "2c23d87b7b149204caad3091f40756dfd3fd0e876741af0c47af4620b3d33abd", "", "laneId"],
    ["alt", "LoopSignal record change"]
  ],
  "content": "{\"cmd\":\"sync_local\",\"ops\":[{\"type\":\"step\",\"id\":\"_G_1pel5N419\",\"op\":\"create\",\"state\":{\"id\":\"_G_1pel5N419\",\"createdAt\":\"2026-10-19T09:00:00.000Z\",\"updatedAt\":\"2026-10-19T09:00:00.000Z\",\"order\":2,\"type\":\"process\",\"name\":\"Sales logs RFQ in CRM\",\"valueClass\":\"nnva\",\"timeSource\":\"observed\",\"observations\":[{\"id\":\"NOrTY7TQUidl\",\"at\":\"2026-10-20T10:05:00.000Z\",\"durationMin\":9},{\"id\":\"6nsWIYOK4nWG\",\"at\":\"2026-10-20T14:20:00.000Z\",\"durationMin\":12},{\"id\":\"65I1N8BDpvp0\",\"at\":\"2026-10-21T10:00:00.000Z\",\"durationMin\":10}],\"laneId\":\"DB3rzQn6vcYD\",\"waitBeforeMin\":480,\"cycleTimeMin\":10,\"system\":\"CRM\",\"trigger\":\"Daily inbox sweep\",\"version\":\"current\"}}]}",
  "sig": "155e3a9a68e4911d1e358fca9b86f283254a24355fb072a1694f43004263e7fd48f0c861fef9e3c7223712ac18a79537fec9876478329dc65e7996781077e9d3"
}
```

### 13.4 Kind 4601: lesson approval (seq 138)

```json
{
  "id": "e2f61bdc00ae97627c782c0699a33e4291941c8b28ce6e0b5776fa02f634dc23",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060275,
  "kind": 4601,
  "tags": [
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["subject", "lesson"],
    ["e", "2585584047828466adc3c73b4c8f6d01d3ad5facff0d8e593516cf1ccbdfc9a1", "", "lessonId"],
    ["e", "75da02165a2b1f464619508767e4349ea214155bda7184d0ea93e83b5917cbae", "", "sourceReviewId"],
    ["e", "de361dca13336624d0e4d2ef5c2a43e62ec99283e4cda4096f6cc67de4aa44bb", "", "sourceVerificationId"],
    ["alt", "LoopSignal lesson approval"]
  ],
  "content": "{\"lessonId\":\"K-c8m7wsHD97\",\"sourceReviewId\":\"rv-ls001-v1\",\"sourceVerificationId\":\"Kg0_FKGJ_AWw\",\"approvedByName\":\"M. Okafor\"}",
  "sig": "dfdafc00c60682256c5e4043d2761571ebe8f6f4b0a3339dd8c47bc8cda02cff7cb72446f85188ec9b7c5e14432d4d84b86cd43046b73bac017c45e5a814e84e"
}
```

The verification approval at seq 137 is valid in full in `worked-case.events.json` (key `approval`, id `75da02165a2b1f464619508767e4349ea214155bda7184d0ea93e83b5917cbae`). Here it is with `snapshot` cut short. **This excerpt is not a valid event**, because cutting the snapshot changes the id:

```json
{
  "id": "75da02165a2b1f464619508767e4349ea214155bda7184d0ea93e83b5917cbae",
  "pubkey": "a0be4305b85028e52408d5b82a8847d0d79464c65a90ddfdd5566bed3153ae80",
  "created_at": 1794060273,
  "kind": 4601,
  "tags": [
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["subject", "verification"],
    ["rec", "review", "rv-ls001-v1", "create"],
    ["e", "de361dca13336624d0e4d2ef5c2a43e62ec99283e4cda4096f6cc67de4aa44bb", "", "verificationId"],
    ["e", "de361dca13336624d0e4d2ef5c2a43e62ec99283e4cda4096f6cc67de4aa44bb", "", "reviewed"],
    ["alt", "LoopSignal verification review"]
  ],
  "content": "{\"id\": \"rv-ls001-v1\", \"verificationId\": \"Kg0_FKGJ_AWw\", \"approvedByName\": \"M. Okafor\", \"reopenedEventId\": null, \"snapshotVersion\": 1, \"snapshot\": \"{\\\"action\\\":{\\\"description\\\":\\\"Install new hardened locator pin; verify with first-piece CMM.\\\",\\\"expectedResult\\\":\\\"Hole diameter within 10.00 ± 0.05, Cpk ≥ 1.33\\\",\\\"hori…\"}",
  "sig": "5cc78b7d3716edece5e4cf461b7cbfb949b5ce0c78bf4bc311712310dedea14781deaffb6b4a01c6db8e4518d4c4b173d2463484606fc9a87a15f2b3a7a0d68b"
}
```

### 13.5 Kind 4680: grant and revoke

```json
{
  "id": "794a9f48256c0c4384f30613fceec318a58a718393f2e04d0f665fac8626fe86",
  "pubkey": "822976b9700ef0a83975f96743613ac78dd4a78ca898aae090b8b324ed668191",
  "created_at": 1794060005,
  "kind": 4680,
  "tags": [
    ["p", "43d63c021295adb5f0ff3680c2656933f69c8226959c777817f7418ea74cfecc"],
    ["op", "grant"],
    ["role", "member"],
    ["role", "reviewer"],
    ["schema", "company", "1"],
    ["alt", "LoopSignal membership change"]
  ],
  "content": "{\"name\":\"R. Delgado (fictional)\"}",
  "sig": "2d41a98f7cf7b8a9063d3c59fd30d9aabb4293cce645e830a7e0d544e619e5667beb2aae741e2e3a9032213b0d5ecf3af94d70425950512ad0337743fede9626"
}
```

```json
{
  "id": "4a785f8178903362ddafd608d125752dc63bcd8b9ddc879b9ed984cf0e6020f4",
  "pubkey": "822976b9700ef0a83975f96743613ac78dd4a78ca898aae090b8b324ed668191",
  "created_at": 1794060282,
  "kind": 4680,
  "tags": [
    ["p", "43d63c021295adb5f0ff3680c2656933f69c8226959c777817f7418ea74cfecc"],
    ["op", "revoke"],
    ["role", "reviewer"],
    ["schema", "company", "1"],
    ["alt", "LoopSignal membership change"]
  ],
  "content": "{\"name\":\"R. Delgado (fictional)\"}",
  "sig": "6755c20e3098eebce8afb12135016237532c65709ad8389a0ffd7b5fe664777a5d5a1cd35ca74e15eeb8c6cb6b84f3556003d6559fbf2d3a6a29d02e66b2a555"
}
```

### 13.6 Kind 4690: the receipt for the seq-137 approval

```json
{
  "id": "2af223404b49e7b1088ad82efb49b1b58753e52c018729525bf51a055e11af26",
  "pubkey": "61d67638af08350531e450c48872b520404af0b5f6e6e6276d1677d67b582671",
  "created_at": 1794060274,
  "kind": 4690,
  "tags": [
    ["e", "75da02165a2b1f464619508767e4349ea214155bda7184d0ea93e83b5917cbae", "", "accepted"],
    ["k", "4601"],
    ["seq", "137"],
    ["e", "4ddbf353979bed1015e9f248d95e02b806ee2ddd433b9ca4df5077b2584e655a", "", "prev"],
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "relay", "1"],
    ["alt", "LoopSignal relay receipt"]
  ],
  "content": "",
  "sig": "e14afaaa17bfca6792df69ebb5d7c4fb31003bb967e636fcacca449cfe8765bc8cd9e2806bddfabd09a619c0ccb9c89535e6907dc5ef73673535cf2260142425"
}
```

### 13.7 Kind 36400: derived snapshot of root cause a4 after seq 135

```json
{
  "id": "2488781c8aea88f2872df42f5ab46601c0cbcf25641a30db81898f0342afffd7",
  "pubkey": "61d67638af08350531e450c48872b520404af0b5f6e6e6276d1677d67b582671",
  "created_at": 1794060284,
  "kind": 36400,
  "tags": [
    ["d", "inv:HFBbSjIzaAPd/cause/4bTvlbY6HF2J"],
    ["w", "inv:HFBbSjIzaAPd"],
    ["schema", "solve", "1"],
    ["rec", "cause", "4bTvlbY6HF2J", "snapshot"],
    ["e", "03548a749d2ae7a55097969ab21d55be84950f7f2cd7ae02a745729f96721faa", "", "create"],
    ["e", "87981394bdd022f26c96ad7c4c63572b5d96310a77b0e0c181756acaa603c454", "", "head"],
    ["seq", "135"],
    ["e", "225faf0a6b4c7a390d92a2c61073f8b21b67343d4767369390457d2c127dc8c3", "", "parentId"],
    ["alt", "LoopSignal record snapshot (derived)"]
  ],
  "content": "{\"id\":\"4bTvlbY6HF2J\",\"createdAt\":\"2026-10-27T09:30:00.000Z\",\"updatedAt\":\"2026-11-07T14:05:00.000Z\",\"text\":\"Locator wear was not caught because the fixture PM interval (12 months) is longer than the locator's wear life at current volume\",\"parentId\":\"ETpXi0V7OqWJ\",\"origin\":\"why\",\"evidenceState\":\"verified\",\"classification\":\"root\",\"rootCauseRationale\":\"Wear measurements on FX-118 and its sister fixture show locators leave tolerance around month 7 at current volume. The 12-month PM interval was set in 2019 at half today's volume. Removing this cause (shorter interval) prevents the shift that caused the oversize hole.\",\"removalTest\":\"yes\",\"challenged\":false,\"candidate\":true,\"order\":0}",
  "sig": "797f7736367baa2b19e09e926d3bdbe5ac5d86f0903512a9cf9e8845c722ae5fafadbfbbd071adc2a7d33e3d14519997b4e0a7009cfd73519758db09ed83b981"
}
```

### 13.8 LS-001 rebuild checklist

LS-001 has 53 records, each created by one part of the `sync_local` command `cmd-sync-ls001`. The sample has one `history` entry (`created`), which is in part 1's `state.importedHistory`, and no `verificationReviews`. Fetch the 53 events in `examples/ls-001.events.json`, fold them (§7.1), and you have the investigation.

| # | Sample record (schema) | Sample content | `rec` type | Event part | Event id |
|---|---|---|---|---|---|
| 1 | `Investigation (+ ProblemStatement, ImpactFlags, history)` | LS-001 — Machined bracket hole diameter out of tolerance | `investigation` | 1/53 | `3d5fbb7f2790…` |
| 2 | `FishboneCategory` | People | `category` | 2/53 | `986911dfd461…` |
| 3 | `FishboneCategory` | Machine | `category` | 3/53 | `36d9b87c54bb…` |
| 4 | `FishboneCategory` | Method | `category` | 4/53 | `1a3186cc9065…` |
| 5 | `FishboneCategory` | Material | `category` | 5/53 | `6ec2be14eb70…` |
| 6 | `FishboneCategory` | Measurement | `category` | 6/53 | `aa141370c1fc…` |
| 7 | `FishboneCategory` | Environment | `category` | 7/53 | `8ced3944fbe4…` |
| 8 | `CauseNode` | Drill wandered off the nominal hole position, enlarging the… | `cause` | 8/53 | `0ab547f178d0…` |
| 9 | `CauseNode` | The part shifted in fixture FX-118 during the drill cycle | `cause` | 9/53 | `9104a1ea73c3…` |
| 10 | `CauseNode` | Fixture locator pin was worn 0.11 mm below its minimum diam… | `cause` | 10/53 | `225faf0a6b4c…` |
| 11 | `CauseNode` | Locator wear was not caught because the fixture PM interval… | `cause` | 11/53 | `03548a749d2a…` |
| 12 | `CauseNode` | The oversize condition ran for roughly five hours before it… | `cause` | 12/53 | `0dee37717b84…` |
| 13 | `CauseNode` | Hourly in-process check uses a go/no-go plug that passes up… | `cause` | 13/53 | `80b17aa50be5…` |
| 14 | `CauseNode` | Setup standard SW-0312 has no fixture locator wear check, s… | `cause` | 14/53 | `0e669f045555…` |
| 15 | `CauseNode` | Second-shift operator was new to Cell 3 (third week) | `cause` | 15/53 | `726d9422f794…` |
| 16 | `CauseNode` | Bar stock lot 4471 hardness at upper end of spec | `cause` | 16/53 | `164cce578dcb…` |
| 17 | `CauseNode` | Reamer changed mid-shift without a first-piece check | `cause` | 17/53 | `dbc937842141…` |
| 18 | `CauseNode` | Coolant concentration low (5.8% vs 7–9%) | `cause` | 18/53 | `3a294e08ca66…` |
| 19 | `Evidence` | CMM report, 42 held brackets | `evidence` | 19/53 | `ff7571c53cb1…` |
| 20 | `Evidence` | Locator pin measurement, FX-118 | `evidence` | 20/53 | `afaee6820e70…` |
| 21 | `Evidence` | Fixture PM record, FX-118 | `evidence` | 21/53 | `755d7f76766b…` |
| 22 | `Evidence` | Sister fixture FX-119 locator measurement | `evidence` | 22/53 | `67b500ea0295…` |
| 23 | `Evidence` | Setup standard SW-0312 rev B | `evidence` | 23/53 | `f439e60e0880…` |
| 24 | `Evidence` | Operator interview, second shift | `evidence` | 24/53 | `8981b0299464…` |
| 25 | `Evidence` | Plug gauge calibration record | `evidence` | 25/53 | `c3e767080db7…` |
| 26 | `Evidence` | Photo: FX-118 locator wear | `evidence` | 26/53 | `4808496b07e3…` |
| 27 | `EvidenceLink` | supports: CMM report, 42 held b… → Drill wandered off the n… | `evidence-link` | 27/53 | `2e4588e7ee5c…` |
| 28 | `EvidenceLink` | supports: CMM report, 42 held b… → The part shifted in fixt… | `evidence-link` | 28/53 | `e96062cb6bcd…` |
| 29 | `EvidenceLink` | supports: Locator pin measureme… → Fixture locator pin was … | `evidence-link` | 29/53 | `a1f8a601d73f…` |
| 30 | `EvidenceLink` | supports: Photo: FX-118 locator… → Fixture locator pin was … | `evidence-link` | 30/53 | `da0a18c0ab5b…` |
| 31 | `EvidenceLink` | supports: Fixture PM record, FX… → Locator wear was not cau… | `evidence-link` | 31/53 | `72601f79ccb6…` |
| 32 | `EvidenceLink` | supports: Sister fixture FX-119… → Locator wear was not cau… | `evidence-link` | 32/53 | `26e711e63b1f…` |
| 33 | `EvidenceLink` | supports: CMM report, 42 held b… → The oversize condition r… | `evidence-link` | 33/53 | `ce7ae1c0fa37…` |
| 34 | `EvidenceLink` | supports: Plug gauge calibratio… → Hourly in-process check … | `evidence-link` | 34/53 | `a19ea0acfc34…` |
| 35 | `EvidenceLink` | supports: Operator interview, s… → Hourly in-process check … | `evidence-link` | 35/53 | `88fb4e49d4a5…` |
| 36 | `EvidenceLink` | supports: Setup standard SW-031… → Setup standard SW-0312 h… | `evidence-link` | 36/53 | `a924cd3ff329…` |
| 37 | `EvidenceLink` | contradicts: Operator interview, s… → Second-shift operator… | `evidence-link` | 37/53 | `cb9231b55e2d…` |
| 38 | `EvidenceLink` | contradicts: CMM report, 42 held b… → Bar stock lot 4471 ha… | `evidence-link` | 38/53 | `00aceaf102ea…` |
| 39 | `TimelineEvent` | Second shift starts; setup check on Drill Station 3B signed… | `timeline` | 39/53 | `66f3482109a3…` |
| 40 | `TimelineEvent` | Estimated first oversize part (based on CMM order of parts … | `timeline` | 40/53 | `29ae45925f0d…` |
| 41 | `TimelineEvent` | Operator notes slightly more chatter; hourly plug check pas… | `timeline` | 41/53 | `f69a3d3377cc…` |
| 42 | `TimelineEvent` | Weld cell reports brackets loose on locating pin; productio… | `timeline` | 42/53 | `88b945d09444…` |
| 43 | `TimelineEvent` | 42 brackets segregated and tagged HOLD; 100% inspection ord… | `timeline` | 43/53 | `32b4cf55893a…` |
| 44 | `TimelineEvent` | Tool room measures FX-118 locator pin at 7.89 mm. | `timeline` | 44/53 | `e11498418748…` |
| 45 | `ContainmentAction` | Segregate and tag all BR-2210 brackets produced on second s… | `containment` | 45/53 | `f17a86809a2a…` |
| 46 | `ContainmentAction` | 100% CMM inspection of BR-2210 WIP from Oct 26–Oct 27 befor… | `containment` | 46/53 | `f5ee11f75e26…` |
| 47 | `Action` | Replace worn fixture locator on FX-118 | `action` | 47/53 | `94c1133cc5ba…` |
| 48 | `Action` | Replace locator on sister fixture FX-119 and inspect FX-120 | `action` | 48/53 | `70e470e7f0cc…` |
| 49 | `Action` | Change fixture PM interval to 6 months and add locator meas… | `action` | 49/53 | `397c00faa791…` |
| 50 | `Action` | Add locator wear check to setup standard SW-0312 and replac… | `action` | 50/53 | `2e03ff321e3a…` |
| 51 | `Verification` | effective: First piece 10.01 mm; 30-piece study mean 10.005… | `verification` | 51/53 | `de361dca1333…` |
| 52 | `Verification` | monitoring: Two shifts run so far; all in tolerance. Contin… | `verification` | 52/53 | `754c0e6ae55f…` |
| 53 | `LessonLearned` | PM intervals set years ago do not track volume. Any fixture… | `lesson` | 53/53 | `258558404782…` |

The flow sample is 78 events: 1 `map`, 5 `lane`, 2 `map-version`, 25 `step` (15 current, 10 future), 27 `edge`, 4 `pain-point`, 13 `rationale` and 1 `linked-investigation`.

---

## 14. Open questions raised by this spec

Each of these keeps today's behavior until someone decides. None of them blocks Phase 0.

| # | Question | Today | Who decides |
|---|---|---|---|
| O-1 | Should the relay reject an approval signed by the member who wrote the verification, or who owns the action? | allowed | Seth (Prep drafts) |
| O-2 | Should editing an approved lesson's text withdraw its approval? | it doesn't | Seth (Prep drafts) |
| O-3 | Should the approval signer have to be the person named in `verifier`? | there is no identity to compare | Prep, in the Phase 5 role matrix |
| O-4 | Retention: who may purge another member's events, and how backups age out | not applicable | Seth, with Phase 3 |
| O-5 | Is `shopFloorMode` per device (this spec's assumption) or per record (today, local only)? | stored on the record | Prep |
| O-6 | Is record-level conflict (two people, same record, different fields) acceptable for v1, or is field-level merge required? | single user, so no conflicts | Prep, at the Phase 2 UX gate |

---

## What was verified, and what wasn't

**Verified, at `origin/main` `2b27076`, with a throwaway prototype in the agent's workspace (not committed; Phase 1 owns the real codec):**
- `ls-001.events.json` folded back to an `Investigation` that is identical to `ls-001.record.json` after canonical key ordering. Same check for the flow sample.
- Every event id and signature in `examples/` verifies with `nostr-tools` 2.26.0 `verifyEvent`.
- Every reference field matched exactly one `e` tag, and there were no extra tags.
- `reviewSnapshot()` for act1's verification changes after the e1 edit, and `currentReview()` goes from present to absent.
- The authority rule accepts the seq-137 approval and rejects the backdated one.
- Every field name in both schema files appears in the §5.3 table (checked by script).

**Not verified:**
- No relay ran. Stale-write rejection, receipts, snapshots and role hooks are specified, not built. Phase 3 has to prove them.
- The registry check only shows the registry on 2026-11-07.
- The 64 KiB content limit is chosen to be safe for stock relays. I didn't check any relay's actual default.
- Blossom (§10) and NIP-09 behavior come from the specs, not from running them.
- How long the fold takes on large investigations hasn't been measured.
