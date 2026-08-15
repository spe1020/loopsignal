import type { BotType, BriefAction } from "./types";
import { botTypeLabels } from "./types";

const demoNotice =
  "Demo Bot. This simulation does not send email, change ERP, or contact a supplier.";

export const botCapabilities: Record<
  BotType,
  { prepare: string[]; approval: string[] }
> = {
  supplier_follow_up: {
    prepare: [
      "prepare supplier follow-up",
      "request an updated commitment",
      "flag a missing response",
      "return the result to the buyer",
    ],
    approval: [
      "send supplier email",
      "change a purchase order",
      "commit cost",
    ],
  },
  reporting: {
    prepare: [
      "prepare a department brief",
      "summarize open actions",
      "prepare an executive email",
    ],
    approval: ["send the brief to a distribution group"],
  },
  knowledge: {
    prepare: [
      "search LoopKnow",
      "retrieve a relevant SOP",
      "find previous corrective actions",
      "return cited information",
    ],
    approval: ["close a quality corrective action"],
  },
  sourcing: {
    prepare: [
      "review a LoopSource comparison",
      "identify missing quote information",
      "prepare supplier clarification questions",
    ],
    approval: ["approve a supplier", "issue an RFQ"],
  },
  monitoring: {
    prepare: [
      "watch an issue",
      "check for updated input",
      "flag when conditions change",
    ],
    approval: ["alter the production schedule"],
  },
};

export function botPreview(action: BriefAction, botType: BotType): string {
  if (botType === "supplier_follow_up") {
    return `Prepare a request for updated ship quantity and confirmed delivery date. Return the response to the Buyer for review. ${demoNotice}`;
  }
  if (botType === "knowledge") {
    return `Search LoopKnow for prior corrective actions related to this quality signal and return cited results. ${demoNotice}`;
  }
  if (botType === "sourcing") {
    return `Review the LoopSource comparison for missing quote information and prepare clarification questions. ${demoNotice}`;
  }
  if (botType === "reporting") {
    return `Prepare the selected brief from current LoopBrief signals. ${demoNotice}`;
  }
  return `Watch this signal and flag if the condition changes. ${demoNotice}`;
}

export function botDraft(action: BriefAction, botType: BotType): string {
  const name = botTypeLabels[botType];
  if (botType === "supplier_follow_up") {
    return `${name} draft\n\nPlease confirm remaining quantity and delivery date for the Stainless Fastener Kit. Return the commitment to the Buyer for review.\n\n${demoNotice}`;
  }
  if (botType === "knowledge") {
    return `${name} draft\n\nSuggested LoopKnow search: previous Molded Housing surface-finish corrective actions. Open LoopKnow to verify sources.\n\n${demoNotice}`;
  }
  if (botType === "sourcing") {
    return `${name} draft\n\nSuggested next step: open LoopSource and compare fastener-kit quotes for lead time, risk, and second-source flexibility.\n\n${demoNotice}`;
  }
  if (botType === "reporting") {
    return `${name} draft\n\nExecutive brief is ready for review. Copy the email preview if leadership needs a written summary.\n\n${demoNotice}`;
  }
  return `${name} draft\n\nMonitoring is armed on this signal. No system was changed.\n\n${demoNotice}`;
}

export function defaultBotForAction(action: BriefAction): BotType {
  if (action.botType) return action.botType;
  if (action.category === "supply" && action.horizon === "immediate") {
    return "supplier_follow_up";
  }
  if (action.category === "quality") return "knowledge";
  if (action.horizon === "structural" && action.category === "supply") {
    return "sourcing";
  }
  return "monitoring";
}
