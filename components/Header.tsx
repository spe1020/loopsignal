"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";
import { cta, nav } from "@/lib/content";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled || open
          ? "border-line bg-cream/95 backdrop-blur-md"
          : "border-transparent bg-cream"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/demo"
                  ? pathname === "/demo" ||
                    pathname.startsWith("/supply") ||
                    pathname.startsWith("/signal") ||
                    pathname.startsWith("/know") ||
                    pathname.startsWith("/source") ||
                    pathname.startsWith("/brief")
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] tracking-[0.01em] transition-colors ${
                  active
                    ? "text-ink"
                    : "text-stone hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <TrackedLink
            href={cta.nav.href}
            location="navigation"
            ctaText={cta.nav.label}
            className="hidden rounded-[2px] bg-copper px-4 py-2.5 text-[13px] font-medium tracking-[0.02em] text-white transition-colors hover:bg-copper-dark sm:inline-flex"
          >
            {cta.nav.label}
          </TrackedLink>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 h-px w-5 bg-ink transition-transform ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 top-1.5 h-px w-5 bg-ink transition-opacity ${open ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 h-px w-5 bg-ink transition-transform ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-cream lg:hidden">
          <nav className="mx-auto flex max-w-[1120px] flex-col px-6 py-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-base text-ink"
              >
                {item.label}
              </Link>
            ))}
            <TrackedLink
              href={cta.nav.href}
              location="navigation"
              ctaText={cta.nav.label}
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center rounded-[2px] bg-copper px-4 py-3 text-[13px] font-medium text-white"
            >
              {cta.nav.label}
            </TrackedLink>
          </nav>
        </div>
      )}
    </header>
  );
}
