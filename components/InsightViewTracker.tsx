"use client";

import { useEffect } from "react";
import { trackInsightView } from "@/lib/analytics";

export function InsightViewTracker({
  slug,
  category,
}: {
  slug: string;
  category: string;
}) {
  useEffect(() => {
    trackInsightView({
      article_slug: slug,
      article_category: category,
    });
  }, [slug, category]);

  return null;
}
