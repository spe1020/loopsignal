# Company permissions — policy input

Identity is a Supabase Auth user verified on every API request. Membership is a current database row, never a JWT role claim. Every active member can read the company's one site/team records and private finalized files. A participant therefore has internal team visibility; this is not a guest/external sharing role. Organizations do not share records.

| Capability | Owner | Billing administrator | Manager | Collaborator | Participant | Viewer |
| --- | --- | --- | --- | --- | --- | --- |
| Read, search, download | yes | yes | yes | yes | yes | yes |
| Export existing work, including during read-only grace | yes | yes | yes | yes | yes | yes |
| Short problem capture | yes | no | yes | yes | yes | no |
| Investigate / edit causes, containment, actions, results, lessons | yes | no | yes | yes | no | no |
| Add evidence / update own assigned action status | yes | no | yes | yes | yes | no |
| Invite collaborators, participants, viewers; revoke those members | yes | no | yes | no | no | no |
| Change manager, billing administrator, reviewer authority | yes | no | no | no | no | no |
| Explicit result / lesson approval and closure | reviewer flag required | never | reviewer flag required | reviewer flag required | never | never |
| Billing / checkout / portal | yes | yes | no | no | no | no |
| Delete an investigation or evidence file | yes | no | yes | no | no | no |

Owner, manager, and collaborator each consume one full seat. Billing administrator, participant and viewer do not. A participant can report and supply evidence, and can change only the status of an action currently assigned to them; they cannot set cause classification, assign work, edit acceptance criteria, decide effectiveness, approve, or close. Owner is immutable in this milestone; owner transfer requires a later audited operation. A new owner starts without reviewer authority and must deliberately enable their own reviewer flag.

A reviewer may approve their own completed action. The approval UI explicitly names this as self-review and requires an affirmative command; audit records the authenticated actor and assignment. No independence or separation-of-duties claim is made. Customers requiring an independent reviewer need a later policy option before adoption.

All members may export only their current authorized company. Revocation takes effect on the next request, including downloads, pending invitations and delayed jobs. Direct client database writes are denied. A restricted server login (no BYPASSRLS, no table ownership) applies allowlisted commands inside one transaction; database row policies also require current membership. Billing entitlements do not grant role or reviewer authority.

Plan capacity is locked per organization for invitation reservation, acceptance, role changes, and billing transitions. Unexpired invitations reserve full seats. The evaluation is 14 days, one site, one team, 10 full seats, with the same capability limits. It starts once at company creation, is explicitly synthetic-only, and has no development bypass. Past-due/cancelled/expired evaluation is read-only, with authorized export for 30 days. After grace, data access is suspended until entitlement is restored; deletion requests remain possible for the owner. Downgrade never deletes work or promotes a role.
