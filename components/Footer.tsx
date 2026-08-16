import Link from "next/link";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";
import { company } from "@/lib/company";
import { cta, nav } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
        <div className="lg:col-span-5">
          <Logo inverted showTagline />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/45">
            Improve the process. Connect the systems.
          </p>
          <p className="mt-4 text-sm text-white/70">{company.contactEmail}</p>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
              Navigate
            </p>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
              Work with us
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <TrackedLink
                  href={cta.nav.href}
                  location="footer"
                  ctaText={cta.nav.label}
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  {cta.nav.label}
                </TrackedLink>
              </li>
              <li>
                <Link
                  href={cta.seeDemos.href}
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  {cta.seeDemos.label}
                </Link>
              </li>
              <li>
                <Link
                  href="/supply"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  LoopSupply
                </Link>
              </li>
              <li>
                <Link
                  href="/know"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  LoopKnow
                </Link>
              </li>
              <li>
                <Link
                  href="/source"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  LoopSource
                </Link>
              </li>
              <li>
                <Link
                  href="/brief"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  LoopBrief
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
              Approach
            </p>
            <p className="mt-4 text-sm leading-6 text-white/55">
              LoopScan.
              <br />
              LoopBuild.
              <br />
              LoopOps.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-6 text-xs text-white/35 lg:px-8">
          <p>© {new Date().getFullYear()} LoopSignal. All rights reserved.</p>
          <Link href="/privacy" className="transition-colors hover:text-white/60">
            Privacy
          </Link>
          <Link href="/security" className="transition-colors hover:text-white/60">
            Security
          </Link>
        </div>
      </div>
    </footer>
  );
}
