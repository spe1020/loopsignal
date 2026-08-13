import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/solutions",
    "/how-it-works",
    "/about",
    "/insights",
    "/loopscan",
  ].map((path) => ({
    url: `https://loopworks.com${path}`,
    lastModified: new Date(),
  }));

  const posts = articles.map((article) => ({
    url: `https://loopworks.com/insights/${article.slug}`,
    lastModified: new Date(article.date),
  }));

  return [...pages, ...posts];
}
