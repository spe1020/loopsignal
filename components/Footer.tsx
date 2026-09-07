"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { company } from "@/lib/company";
export function Footer() {
  const pathname = usePathname();
  if (pathname === "/workspace") return null;
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
            Turn daily problems into improvements that last.
          </p>
          <p className="mt-5 text-xs text-white/60">{company.contactEmail}</p>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-widest text-white/55">
            Explore LoopSignal
          </h2>
          <ul className="mt-4 space-y-4 text-sm text-white/80">
            <li>
              <Link href="/workspace">Try a live example</Link>
            </li>
            <li>
              <Link href="/pilot">Join the pilot</Link>
            </li>
            <li>
              <Link href="/solve">Your local investigations</Link>
            </li>
            <li>
              <Link href="/flow">Your local process maps</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-widest text-white/55">
            Company & support
          </h2>
          <ul className="mt-4 space-y-4 text-sm text-white/80">
            <li>
              <Link href="/about">About LoopSignal</Link>
            </li>
            <li>
              <Link href="/services">Optional onboarding & integration</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/security">Data handling</Link>
            </li>
          </ul>
          <p className="mt-6 text-xs leading-6 text-white/55">
            Public examples use fictional data. Company workspaces and
            subscriptions are planned.
          </p>
        </div>
      </div>
      <p className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} LoopSignal
      </p>
    </footer>
  );
}
