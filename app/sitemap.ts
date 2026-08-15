import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/solutions",
    "/how-it-works",
    "/about",
    "/insights",
    "/loopscan",
    "/supply",
    "/know",
    "/source",
    "/brief",
    "/demo",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: new Date(),
  }));

  const posts = articles.map((article) => ({
    url: `${siteUrl}/insights/${article.slug}`,
    lastModified: new Date(article.date),
  }));

  return [...pages, ...posts];
}
