import Link from "next/link";
import { Logo } from "./Logo";
import { nav } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
        <div className="lg:col-span-5">
          <Logo inverted />
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/60">
            Better systems. Better work.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
            LoopWorks helps manufacturers improve how work gets done using
            process improvement, AI, and automation.
          </p>
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
                <Link
                  href="/first-loop"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  Find Your First Loop
                </Link>
              </li>
              <li>
                <Link
                  href="/first-loop"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  LoopScan
                </Link>
              </li>
              <li>
                <Link
                  href="/solutions"
                  className="text-sm text-white/70 transition-colors hover:text-cream"
                >
                  Solutions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
              Approach
            </p>
            <p className="mt-4 text-sm leading-6 text-white/55">
              See.
              <br />
              Simplify.
              <br />
              Build.
              <br />
              Learn.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1120px] px-6 py-6 text-xs text-white/35 lg:px-8">
          <p>© {new Date().getFullYear()} LoopWorks. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
