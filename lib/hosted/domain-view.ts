import { reviewSnapshot } from "@/lib/solve/reviews";
import { hardFindings, reviewBlockers } from "@/lib/solve/rules";
import { ensure, type HostedDocument, type Attachment } from "./types";
export function hostSnapshot(
  doc: HostedDocument,
  verificationId: string,
  files: Attachment[],
) {
  const v = doc.investigation.verifications.find(
    (v) => v.id === verificationId,
  );
  ensure(v, "Verification unavailable");
  const deps = JSON.parse(reviewSnapshot(doc.investigation, v)) as {
    evidenceIds: string[];
  };
  return JSON.stringify({
    version: 1,
    files: files
      .filter(
        (f) =>
          deps.evidenceIds.includes(f.evidence_id) && f.state !== "deleted",
      )
      .map((f) => ({
        id: f.id,
        evidenceId: f.evidence_id,
        version: f.object_version,
        checksum: f.checksum,
        state: f.state,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    observations: doc.observations
      .filter((o) => o.verificationId === v.id)
      .sort((a, b) => a.id.localeCompare(b.id)),
    missing: (doc.provenance?.missingFiles ?? [])
      .filter((id) => deps.evidenceIds.includes(id))
      .sort(),
  });
}
export function hostedReviewBlockers(
  doc: HostedDocument,
  id: string,
  files: Attachment[],
) {
  const inv = doc.investigation,
    v = inv.verifications.find((v) => v.id === id);
  if (!v) return ["Choose a result."];
  const evidenceIds = (
    JSON.parse(reviewSnapshot(inv, v)) as { evidenceIds: string[] }
  ).evidenceIds;
  const issues = reviewBlockers(inv, id);
  if (
    files.some(
      (f) =>
        evidenceIds.includes(f.evidence_id) &&
        ["staged", "missing"].includes(f.state),
    ) ||
    (doc.provenance?.missingFiles ?? []).some((id) => evidenceIds.includes(id))
  )
    issues.push(
      "Resolve the missing or unfinished source files before approval.",
    );
  const observations = doc.observations.filter((o) => o.verificationId === id);
  if (
    !observations.length ||
    observations.some(
      (o) =>
        !v.evidenceIds.includes(o.evidenceId) ||
        o.start > o.end ||
        o.end > (v.checkAt ?? "") ||
        !o.unit.trim(),
    )
  )
    issues.push(
      "Add a source-linked measurement with units and an observation period ending on or before the result check date.",
    );
  if ((v.checkAt ?? "") > new Date().toISOString().slice(0, 10))
    issues.push("A result cannot be checked in the future.");
  return issues;
}
export function hostedBlockers(doc: HostedDocument, files: Attachment[]) {
  const issues = hardFindings(doc.investigation).map((f) => ({
    message: f.message,
    section:
      f.stage === "root-cause"
        ? "causes"
        : f.stage === "verify"
          ? "results"
          : f.stage === "contain"
            ? "containment"
            : f.stage === "investigate"
              ? "evidence"
              : f.stage,
    entityId: f.entityId,
  }));
  for (const a of doc.investigation.actions.filter(
    (a) => a.kind === "corrective" || a.requiredForClosure,
  )) {
    const v = doc.investigation.verifications
      .filter((v) => v.actionId === a.id)
      .at(-1);
    if (v)
      for (const message of hostedReviewBlockers(doc, v.id, files))
        if (!issues.some((i) => i.message === message))
          issues.push({ message, section: "results", entityId: a.id });
  }
  return issues;
}
