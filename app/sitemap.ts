import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "/",
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
    "/security",
    "/privacy",
  ].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
  }));

  const posts = articles.map((article) => ({
    url: absoluteUrl(`/insights/${article.slug}`),
    lastModified: new Date(article.date),
  }));

  return [...pages, ...posts];
}
