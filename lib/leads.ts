import {
  sanitizeIsoTimestamp,
  sanitizePath,
  sanitizeReferrerUrl,
  sanitizeReferringSource,
  sanitizeUtm,
} from "@/lib/attribution";
import { loopScanAreas } from "@/lib/content";

export type LoopScanLead = {
  name: string;
  company: string;
  email: string;
  area: (typeof loopScanAreas)[number];
  process: string;
  submittedAt: string;
  landingPage?: string;
  referringSource?: string;
  referrer?: string;
  firstVisitAt?: string;
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

  return {
    name,
    company,
    email,
    area: area as (typeof loopScanAreas)[number],
    process,
    submittedAt:
      sanitizeIsoTimestamp(body.submittedAt) ?? new Date().toISOString(),
    landingPage: sanitizePath(body.landingPage),
    referringSource: sanitizeReferringSource(body.referringSource),
    referrer: sanitizeReferrerUrl(body.referrer),
    firstVisitAt: sanitizeIsoTimestamp(body.firstVisitAt),
    utm: sanitizeUtm(body.utm),
  };
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
        landingPage: lead.landingPage,
        referringSource: lead.referringSource,
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
