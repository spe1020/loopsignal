import type { Metadata } from "next";
import { company } from "@/lib/company";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const TITLE_TEMPLATE = `%s — ${company.name}`;

const defaultOgImage = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: `${company.name} — ${company.tagline}`,
} as const;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.name,
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/brand/app-icon.svg"),
    width: 180,
    height: 180,
  },
  description: company.executiveDescription,
  email: company.contactEmail,
  slogan: company.tagline,
} as const;

type RouteMeta = {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  robots?: Metadata["robots"];
  canonicalPath?: string;
};

export const routeMeta = {
  home: {
    path: "/",
    title: `${company.name} — ${company.tagline}`,
    description:
      "LoopSignal helps manufacturers improve processes, connect disconnected systems, and automate the work that should not require manual effort.",
    absoluteTitle: true,
  },
  solutions: {
    path: "/solutions",
    title: "Solutions",
    description:
      "Process improvement, systems integration, and practical automation for supply chain, procurement, plant operations, and manufacturing knowledge.",
  },
  howItWorks: {
    path: "/how-it-works",
    title: "How It Works",
    description:
      "See, simplify, connect, automate, measure, improve. LoopSignal starts with the work, then improves the process and connects the right systems.",
  },
  about: {
    path: "/about",
    title: "About",
    description:
      "LoopSignal is a manufacturing consulting and systems integration company. We start with how the work actually happens.",
  },
  insights: {
    path: "/insights",
    title: "Insights",
    description:
      "Writing on manufacturing operations, process improvement, procurement, supply chain, and practical use of AI in the plant.",
  },
  loopscan: {
    path: "/loopscan",
    title: "LoopScan",
    description:
      "Tell LoopSignal about a process that takes too long, needs repetitive work, or depends on disconnected information.",
  },
  demo: {
    path: "/demo",
    title: "Demos",
    description:
      "Working examples of LoopSupply, LoopKnow, LoopSource, and LoopBrief — what can be built around your operation.",
  },
  supply: {
    path: "/supply",
    title: "LoopSupply",
    description:
      "Upload an open purchase-order CSV and see which supplier and material orders may need attention first.",
  },
  know: {
    path: "/know",
    title: "LoopKnow",
    description:
      "Ask a question against manufacturing documents and see a cited, revision-aware answer.",
  },
  source: {
    path: "/source",
    title: "LoopSource",
    description:
      "Compare supplier quotes by landed cost, lead time, commercial terms, and risk — not unit price alone.",
  },
  brief: {
    path: "/brief",
    title: "LoopBrief",
    description:
      "Turn production, quality, supply, and maintenance signals into a prioritized daily operating brief.",
  },
  firstLoop: {
    path: "/first-loop",
    title: "Find Your First Loop",
    description:
      "Tell LoopSignal about a process that takes too long, needs repetitive work, or depends on disconnected information.",
    canonicalPath: "/loopscan",
    robots: { index: false, follow: true },
  },
  talkToUs: {
    path: "/talk-to-us",
    title: "Talk to Us",
    description:
      "Tell LoopSignal about a process that takes too long, needs repetitive work, or depends on disconnected information.",
    canonicalPath: "/loopscan",
    robots: { index: false, follow: true },
  },
  signal: {
    path: "/signal",
    title: "Supply Risk Demo",
    description:
      "Upload an open purchase-order CSV and see which supplier and material orders may need attention first.",
    canonicalPath: "/supply",
    robots: { index: false, follow: true },
  },
  notFound: {
    path: "/404",
    title: "Page not found",
    description: "This page does not exist. Start from home or begin a LoopScan.",
    canonicalPath: "/",
    robots: { index: false, follow: false },
  },
} as const satisfies Record<string, RouteMeta>;

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  robots?: Metadata["robots"];
  canonicalPath?: string;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  imagePath?: string;
};

export function pageMeta({
  title,
  description,
  path,
  absoluteTitle = false,
  robots,
  canonicalPath,
  type = "website",
  publishedTime,
  authors,
  imagePath = "/opengraph-image",
}: PageMetaInput): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  const documentTitle = absoluteTitle ? title : `${title} — ${company.name}`;
  const image = {
    ...defaultOgImage,
    url: absoluteUrl(imagePath),
  };

  const sharedOg = {
    title: documentTitle,
    description,
    url: canonical,
    siteName: company.name,
    locale: "en_US" as const,
    images: [image],
  };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph:
      type === "article"
        ? {
            ...sharedOg,
            type: "article" as const,
            ...(publishedTime ? { publishedTime } : {}),
            ...(authors ? { authors } : {}),
          }
        : {
            ...sharedOg,
            type: "website" as const,
          },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description,
      images: [image.url],
    },
    ...(robots ? { robots } : {}),
  };
}

export function routePageMeta(
  route: (typeof routeMeta)[keyof typeof routeMeta],
): Metadata {
  return pageMeta(route);
}

for (const route of Object.values(routeMeta)) {
  if (route.description.length > 160) {
    throw new Error(
      `SEO description for ${route.path} is ${route.description.length} characters (max 160).`,
    );
  }
}

