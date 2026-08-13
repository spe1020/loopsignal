"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackLoopScanCTA, type CtaLocation } from "@/lib/analytics";

type TrackedLinkProps = {
  href: string;
  location: CtaLocation;
  ctaText?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function TrackedLink({
  href,
  location,
  ctaText,
  className,
  children,
  onClick,
}: TrackedLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        if (href.startsWith("/loopscan")) {
          trackLoopScanCTA({
            location,
            page: pathname,
            cta_text:
              ctaText ??
              (typeof children === "string" ? children : undefined),
          });
        }
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
