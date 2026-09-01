"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { IconAlert, IconCheck, IconCircle, IconDot, IconShield } from "./icons";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";

export const control = `min-h-(--solve-control) ${focus}`;

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "dark";

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-copper text-white hover:bg-copper-dark border border-copper",
  secondary: "border border-ink/25 bg-cream text-ink hover:border-ink hover:bg-white",
  ghost: "border border-transparent bg-transparent text-graphite hover:bg-ink/5 hover:text-ink",
  danger: "border border-risk-critical/40 bg-cream text-risk-critical hover:bg-risk-critical-bg",
  dark: "bg-ink text-cream hover:bg-black border border-ink",
};

export const SolveButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: "sm" | "md" | "lg";
    icon?: ReactNode;
  }
>(function SolveButton({ variant = "secondary", size = "md", icon, className = "", children, type = "button", ...rest }, ref) {
  const sizes = {
    sm: "px-3 text-[13px] min-h-[36px]",
    md: `px-4 text-[14px] ${control}`,
    lg: `px-6 text-[15px] ${control}`,
  };
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[3px] font-medium tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${btnVariants[variant]} ${sizes[size]} ${focus} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex min-h-(--solve-control) min-w-(--solve-control) items-center justify-center rounded-[3px] text-graphite transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40 ${focus} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

const inputBase =
  "w-full rounded-[3px] border border-line bg-cream px-3 text-ink placeholder:text-stone/80 transition-colors hover:border-ink/30 focus:border-copper focus:outline-none";

export function Field({
  label,
  helper,
  children,
  htmlFor,
  required,
  className = "",
}: {
  label: string;
  helper?: string;
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium tracking-[0.01em] text-ink">
        {label}
        {required ? <span className="ml-1 text-copper">*</span> : null}
      </label>
      {helper ? <p className="solve-secondary -mt-0.5 text-[12.5px] leading-5 text-stone">{helper}</p> : null}
      {children}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`${inputBase} min-h-(--solve-control) ${className}`} {...rest} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { onSubmitKey?: () => void }>(
  function TextArea({ className = "", onSubmitKey, onKeyDown, rows = 2, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${inputBase} min-h-(--solve-control) resize-y py-2.5 leading-6 ${className}`}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (onSubmitKey && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmitKey();
          }
        }}
        {...rest}
      />
    );
  },
);

export function Select({ className = "", children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} min-h-(--solve-control) appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%234a4a4a' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>")] bg-[length:14px] bg-[right_10px_center] bg-no-repeat pr-8 ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={`inline-flex min-h-(--solve-control) cursor-pointer items-center gap-2.5 text-[14px] text-ink ${className}`}>
      <input id={id} type="checkbox" className={`h-5 w-5 shrink-0 accent-copper ${focus}`} {...rest} />
      {label}
    </label>
  );
}

export type Tone = "neutral" | "amber" | "red" | "green" | "blue" | "copper" | "ink";

const toneClasses: Record<Tone, string> = {
  neutral: "border-line bg-paper-2 text-graphite",
  amber: "border-risk-amber/30 bg-risk-amber-bg text-risk-amber",
  red: "border-risk-critical/30 bg-risk-critical-bg text-risk-critical",
  green: "border-risk-track/30 bg-risk-track-bg text-risk-track",
  blue: "border-risk-confirm/30 bg-risk-confirm-bg text-risk-confirm",
  copper: "border-copper/30 bg-copper-soft text-copper-dark",
  ink: "border-ink bg-ink text-cream",
};

export function Chip({
  tone = "neutral",
  icon,
  children,
  className = "",
  as: Tag = "span",
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  return (
    <Tag
      className={`solve-chip inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-0.5 text-[12px] font-medium tracking-[0.01em] whitespace-nowrap ${toneClasses[tone]} ${className}`}
    >
      {icon}
      {children}
    </Tag>
  );
}

/** Icon + label + color, per the "never color alone" rule. */
export function StateIcon({ state }: { state: "ok" | "todo" | "warn" | "info" | "shield" }) {
  const size = 13;
  switch (state) {
    case "ok":
      return <IconCheck size={size} />;
    case "warn":
      return <IconAlert size={size} />;
    case "info":
      return <IconDot size={size} />;
    case "shield":
      return <IconShield size={size} />;
    default:
      return <IconCircle size={size} />;
  }
}

export function SectionTitle({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-copper">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-[22px] font-medium tracking-[-0.02em] text-ink md:text-[26px]">{title}</h2>
        {children ? <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-graphite">{children}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  rule,
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { rule?: "amber" | "copper" | "red" | "green" | "blue" | "ink"; as?: "div" | "li" | "article" | "section" }) {
  const rules = {
    amber: "border-l-[3px] border-l-risk-amber",
    copper: "border-l-[3px] border-l-copper",
    red: "border-l-[3px] border-l-risk-critical",
    green: "border-l-[3px] border-l-risk-track",
    blue: "border-l-[3px] border-l-risk-confirm",
    ink: "border-l-[3px] border-l-ink",
  };
  return (
    <Tag className={`rounded-[3px] border border-line bg-cream ${rule ? rules[rule] : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Note({ children, tone = "neutral", icon }: { children: ReactNode; tone?: "neutral" | "amber" | "red" | "copper"; icon?: ReactNode }) {
  const tones = {
    neutral: "border-line bg-paper-2/60 text-graphite",
    amber: "border-risk-amber/25 bg-risk-amber-bg text-risk-amber",
    red: "border-risk-critical/25 bg-risk-critical-bg text-risk-critical",
    copper: "border-copper/25 bg-copper-soft/70 text-copper-dark",
  };
  return (
    <div className={`flex items-start gap-2.5 rounded-[3px] border px-3.5 py-3 text-[13.5px] leading-6 ${tones[tone]}`}>
      {icon ? <span className="mt-1 shrink-0">{icon}</span> : null}
      <div>{children}</div>
    </div>
  );
}

export function Coaching({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {items.map((m) => (
        <li key={m} className="flex items-start gap-2 text-[13px] leading-5 text-risk-amber">
          <IconAlert size={13} className="mt-1 shrink-0" />
          <span>{m}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  title,
  action,
  icon,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-start gap-4 rounded-[3px] border border-dashed border-ink/20 bg-cream/60 p-6 ${className}`}>
      {icon}
      <p className="max-w-md text-[14.5px] leading-6 text-graphite">{title}</p>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode; badge?: ReactNode }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-[3px] border border-line bg-paper-2/70 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-[2px] px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-colors ${focus} ${
              active ? "bg-ink text-cream" : "text-graphite hover:bg-cream hover:text-ink"
            }`}
          >
            {o.icon}
            {o.label}
            {o.badge}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full min-h-(--solve-control) items-center justify-between gap-4 rounded-[3px] px-2 text-left hover:bg-ink/5 ${focus}`}
    >
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        {description ? <span className="block text-[12px] text-stone">{description}</span> : null}
      </span>
      <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full border transition-colors ${checked ? "border-copper bg-copper" : "border-ink/25 bg-paper-2"}`}>
        <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[3px] border border-line bg-paper-2 px-1.5 py-0.5 font-mono text-[11px] text-graphite">{children}</kbd>;
}
