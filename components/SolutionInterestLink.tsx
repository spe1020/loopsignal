"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  trackLoopScanCTA,
  trackSolutionInterest,
  type SolutionInteraction,
  type SolutionInterest as SolutionKey,
} from "@/lib/analytics";

type SolutionInterestLinkProps = {
  href: string;
  solution: SolutionKey;
  interactionType: SolutionInteraction;
  className?: string;
  children: React.ReactNode;
};

export function SolutionInterestLink({
  href,
  solution,
  interactionType,
  className,
  children,
}: SolutionInterestLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackSolutionInterest({
          solution,
          page: pathname,
          interaction_type: interactionType,
        });
        if (href.startsWith("/loopscan")) {
          trackLoopScanCTA({
            location: "solutions",
            page: pathname,
            cta_text:
              typeof children === "string" ? children : undefined,
          });
        }
      }}
    >
      {children}
    </Link>
  );
}
