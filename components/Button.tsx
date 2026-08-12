import Link from "next/link";

const variants = {
  primary:
    "bg-copper text-white hover:bg-copper-dark",
  secondary:
    "border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-cream",
  dark: "bg-cream text-ink hover:bg-white",
  light:
    "border border-white/25 bg-transparent text-cream hover:border-cream hover:bg-cream hover:text-ink",
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
      className={`inline-flex items-center justify-center rounded-[2px] px-5 py-3 text-[13px] font-medium tracking-[0.02em] transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
