import Link from "next/link";

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
};

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-[2px] font-medium tracking-[0.02em] transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
