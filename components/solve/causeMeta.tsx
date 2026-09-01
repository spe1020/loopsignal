import type { CauseClassification, EvidenceState, EvidenceType, RemovalTest } from "@/lib/solve/schema";
import { IconAlert, IconCheck, IconCircle, IconClose, IconDot, IconEye, IconFlag, IconNote, IconTarget, IconClock, IconQuestion, IconSearch, IconGrid, IconBook, IconMagnify } from "./icons";
import type { Tone } from "./ui";

export const evidenceStateMeta: Record<EvidenceState, { label: string; short: string; tone: Tone; icon: React.ReactNode; hint: string }> = {
  assumption: { label: "Assumption", short: "Assumption", tone: "neutral", icon: <IconCircle size={12} />, hint: "Not yet checked against anything." },
  observed: { label: "Observed", short: "Observed", tone: "blue", icon: <IconEye size={12} />, hint: "Someone saw it, but there is no measurement or record yet." },
  data_supported: { label: "Data-supported", short: "Data", tone: "copper", icon: <IconDot size={12} />, hint: "A measurement, record, or test points this way." },
  verified: { label: "Verified", short: "Verified", tone: "green", icon: <IconCheck size={12} />, hint: "Confirmed with linked supporting evidence." },
  disproved: { label: "Disproved", short: "Disproved", tone: "red", icon: <IconClose size={12} />, hint: "Evidence shows this is not a cause." },
};

export const classificationMeta: Record<CauseClassification, { label: string; tone: Tone; icon: React.ReactNode }> = {
  unclassified: { label: "Unclassified", tone: "neutral", icon: <IconCircle size={12} /> },
  symptom: { label: "Symptom", tone: "neutral", icon: <IconDot size={12} /> },
  contributing: { label: "Contributing", tone: "amber", icon: <IconFlag size={12} /> },
  root: { label: "Root cause", tone: "copper", icon: <IconTarget size={12} /> },
};

export const removalTestMeta: Record<RemovalTest, { label: string; tone: Tone; icon: React.ReactNode }> = {
  yes: { label: "Yes", tone: "green", icon: <IconCheck size={12} /> },
  no: { label: "No", tone: "red", icon: <IconClose size={12} /> },
  not_sure: { label: "Not sure", tone: "amber", icon: <IconQuestion size={12} /> },
};

export const evidenceTypeMeta: Record<EvidenceType, { label: string; icon: React.ReactNode }> = {
  observation: { label: "Observation", icon: <IconEye size={14} /> },
  measurement: { label: "Measurement", icon: <IconGrid size={14} /> },
  document: { label: "Document", icon: <IconNote size={14} /> },
  photo_ref: { label: "Photo reference", icon: <IconMagnify size={14} /> },
  test_result: { label: "Test result", icon: <IconCheck size={14} /> },
  interview: { label: "Interview", icon: <IconQuestion size={14} /> },
  system_record: { label: "System record", icon: <IconClock size={14} /> },
  historical_incident: { label: "Historical incident", icon: <IconBook size={14} /> },
};

export const timelineTagMeta = {
  observed: { label: "Observed", tone: "blue" as Tone, icon: <IconEye size={12} /> },
  system_record: { label: "System record", tone: "neutral" as Tone, icon: <IconClock size={12} /> },
  reported: { label: "Reported", tone: "amber" as Tone, icon: <IconAlert size={12} /> },
};

export { IconSearch };
