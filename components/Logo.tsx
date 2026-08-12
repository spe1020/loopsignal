import Link from "next/link";

export function LoopMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 10.5c0-2.5 2-4.5 4.5-4.5h7c2.5 0 4.5 2 4.5 4.5v11c0 2.5-2 4.5-4.5 4.5h-7C10 25.5 8 23.5 8 21V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 16H5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="24" cy="10.5" r="2.15" fill="#c24e1d" />
    </svg>
  );
}

export function Logo({
  href = "/",
  inverted = false,
}: {
  href?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 ${inverted ? "text-cream" : "text-ink"}`}
    >
      <LoopMark />
      <span className="text-[15px] font-medium tracking-[-0.02em]">
        LoopWorks
      </span>
    </Link>
  );
}
