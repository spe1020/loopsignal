"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  trackInsightCtaClick,
  trackLoopScanCTA,
  type CtaLocation,
} from "@/lib/analytics";

const variants = {
  primary:
    "bg-copper px-6 py-3.5 text-[14px] text-white hover:bg-copper-dark",
  secondary:
    "border border-ink/20 bg-transparent px-5 py-3 text-[13px] text-ink hover:border-ink hover:bg-ink hover:text-cream",
  text: "bg-transparent px-1 py-3.5 text-[14px] text-graphite hover:text-ink",
  dark: "bg-cream px-6 py-3.5 text-[14px] text-ink hover:bg-white",
  light:
    "border border-white/25 bg-transparent px-5 py-3 text-[13px] text-cream hover:border-cream hover:bg-cream hover:text-ink",
};

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  location?: CtaLocation;
  articleSlug?: string;
};

function labelFromChildren(children: React.ReactNode) {
  return typeof children === "string" ? children : undefined;
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  location,
  articleSlug,
}: ButtonProps) {
  const pathname = usePathname();
  const ctaText = labelFromChildren(children);

  function onClick() {
    if (!href.startsWith("/loopscan") || !location) return;
    trackLoopScanCTA({
      location,
      page: pathname,
      cta_text: ctaText,
    });
    if (location === "article") {
      trackInsightCtaClick({
        article_slug: articleSlug,
        page: pathname,
        cta_text: ctaText,
        destination: "loopscan",
      });
    }
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[2px] font-medium tracking-[0.02em] transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
