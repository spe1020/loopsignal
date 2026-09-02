"use client";

import { forwardRef, useEffect, useState } from "react";
import { TextInput } from "@/components/loop/ui";
import type { TimeUnit } from "@/lib/flow/schema";
import { formatMinutes, parseTime, toUnit, unitLabels } from "@/lib/flow/time";

/**
 * Minutes in, minutes out; typed in the map's unit. "30" in an hours map is
 * 30 hours; "45m", "2d 4h" also work. Commits on blur and Enter.
 */
export const TimeInput = forwardRef<
  HTMLInputElement,
  {
    id?: string;
    value: number | undefined;
    unit: TimeUnit;
    onCommit: (min: number | undefined) => void;
    onEnter?: () => void;
    placeholder?: string;
    "aria-label"?: string;
    className?: string;
    autoFocus?: boolean;
  }
>(function TimeInput({ id, value, unit, onCommit, onEnter, placeholder, className = "", autoFocus, ...rest }, ref) {
  const display = value === undefined ? "" : String(toUnit(value, unit));
  const [draft, setDraft] = useState(display);
  useEffect(() => setDraft(display), [display]);
  function commit() {
    const min = parseTime(draft, unit);
    if (min !== value) onCommit(min);
    setDraft(min === undefined ? "" : String(toUnit(min, unit)));
  }
  return (
    <div className={`relative ${className}`}>
      <TextInput
        ref={ref}
        id={id}
        inputMode="decimal"
        value={draft}
        placeholder={placeholder ?? "?"}
        autoFocus={autoFocus}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            onEnter?.();
          }
        }}
        className="pr-24"
        {...rest}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[12px] text-stone">
        {unitLabels[unit].short}{value !== undefined && unit !== "minutes" ? ` · ${formatMinutes(value, { compact: true })}` : ""}
      </span>
    </div>
  );
});
