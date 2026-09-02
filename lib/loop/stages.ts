/** Stage progress states shared by every Loop tool's stage navigator. */
export type StageState = "empty" | "in_progress" | "needs_attention" | "complete" | "verified";

export const stageStateLabels: Record<StageState, string> = {
  empty: "Empty",
  in_progress: "In progress",
  needs_attention: "Needs attention",
  complete: "Complete",
  verified: "Verified",
};

export type StageNavItem = {
  key: string;
  href: string;
  label: string;
  short: string;
  index: number;
  state: StageState;
};
