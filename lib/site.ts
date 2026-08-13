const fallbackSiteUrl = "https://loopworks.com";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl
).replace(/\/$/, "");
