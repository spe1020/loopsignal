import { loopScanAreas } from "@/lib/content";

export type LoopScanLead = {
  name: string;
  company: string;
  email: string;
  area: (typeof loopScanAreas)[number];
  process: string;
  submittedAt: string;
  referrer?: string;
  landingPage?: string;
  utm?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseLoopScanLead(input: unknown): LoopScanLead | string {
  if (!input || typeof input !== "object") {
    return "Please complete the form and try again.";
  }

  const body = input as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const area = String(body.area ?? "").trim();
  const process = String(body.process ?? "").trim();

  if (name.length < 2) return "Please enter your name.";
  if (company.length < 2) return "Please enter your company.";
  if (!emailPattern.test(email)) return "Please enter a valid work email.";
  if (!loopScanAreas.includes(area as (typeof loopScanAreas)[number])) {
    return "Please choose an area.";
  }
  if (process.length < 8) {
    return "Please describe the process you’d like to improve.";
  }

  const utm = body.utm && typeof body.utm === "object" ? body.utm : {};

  return {
    name,
    company,
    email,
    area: area as (typeof loopScanAreas)[number],
    process,
    submittedAt:
      typeof body.submittedAt === "string"
        ? body.submittedAt
        : new Date().toISOString(),
    referrer:
      typeof body.referrer === "string" ? body.referrer : undefined,
    landingPage:
      typeof body.landingPage === "string" ? body.landingPage : undefined,
    utm: {
      utm_source: optionalString((utm as Record<string, unknown>).utm_source),
      utm_medium: optionalString((utm as Record<string, unknown>).utm_medium),
      utm_campaign: optionalString(
        (utm as Record<string, unknown>).utm_campaign,
      ),
      utm_content: optionalString((utm as Record<string, unknown>).utm_content),
      utm_term: optionalString((utm as Record<string, unknown>).utm_term),
    },
  };
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function deliverLead(lead: LoopScanLead) {
  const url = process.env.LEAD_WEBHOOK_URL;

  if (!url) {
    console.warn(
      "[loopscan] LEAD_WEBHOOK_URL is not set. Lead accepted locally but not forwarded.",
      {
        company: lead.company,
        area: lead.area,
        submittedAt: lead.submittedAt,
      },
    );
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    throw new Error(`Lead webhook failed with ${response.status}`);
  }
}
