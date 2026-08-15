const fallbackSiteUrl = "https://loopsignal.com";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl
).replace(/\/$/, "");
