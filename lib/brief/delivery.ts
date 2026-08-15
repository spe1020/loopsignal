/**
 * Future email sending must stay server-side.
 *
 * LoopBrief data → deterministic report generator → email template
 * → server-side email service → distribution group
 *
 * Never expose provider credentials in the client. This module only
 * prepares preview copy and fictional distribution settings.
 */
export const EMAIL_SENDING_ENABLED = false;

export type DistributionRole = {
  role: string;
  address: string;
};

export type DistributionGroup = {
  id: string;
  name: string;
  roles: DistributionRole[];
};

export type ScheduleItem = {
  id: string;
  name: string;
  frequency: string;
  delivery: string;
  recipients: string;
};

export const executiveGroup: DistributionGroup = {
  id: "executive",
  name: "Executive Group",
  roles: [
    { role: "Plant Manager", address: "plantmanager@example.com" },
    { role: "VP Operations", address: "vp.operations@example.com" },
    { role: "Supply Chain Director", address: "supply.director@example.com" },
    { role: "Quality Director", address: "quality.director@example.com" },
  ],
};

export const demoSchedules: ScheduleItem[] = [
  {
    id: "exec-daily",
    name: "Executive Brief",
    frequency: "Daily",
    delivery: "7:00 AM",
    recipients: "Executive Group",
  },
  {
    id: "supply-daily",
    name: "Supply Chain Brief",
    frequency: "Daily",
    delivery: "6:30 AM",
    recipients: "Supply Chain Team",
  },
  {
    id: "weekly-ops",
    name: "Weekly Operations Review",
    frequency: "Friday",
    delivery: "2:00 PM",
    recipients: "Operations Leadership",
  },
];

export type ExecutiveEmail = {
  subject: string;
  body: string;
};

export type FutureEmailDelivery = {
  provider: "server";
  template: "executive_brief" | "department_brief";
  groupId: string;
};
