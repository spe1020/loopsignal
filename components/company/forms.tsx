"use client";
import type { ReactNode } from "react";
export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "date"
    | "number"
    | "email"
    | "password"
    | "select"
    | "checks"
    | "checkbox";
  value?: string | number | boolean | string[];
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
};
export function Fields({ fields }: { fields: Field[] }) {
  return (
    <>
      {fields.map((f) => (
        <label className="co-field" key={f.name}>
          <span>{f.label}</span>
          {f.type === "textarea" ? (
            <textarea
              aria-label={f.label}
              name={f.name}
              defaultValue={String(f.value ?? "")}
              required={f.required}
              maxLength={12000}
              rows={3}
            />
          ) : f.type === "select" ? (
            <select
              aria-label={f.label}
              name={f.name}
              defaultValue={String(f.value ?? "")}
              required={f.required}
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "checks" ? (
            <span className="co-checks">
              {f.options?.map((o) => (
                <span key={o.value}>
                  <input
                    aria-label={o.label}
                    type="checkbox"
                    name={f.name}
                    value={o.value}
                    defaultChecked={
                      Array.isArray(f.value) && f.value.includes(o.value)
                    }
                  />
                  {o.label}
                </span>
              ))}
            </span>
          ) : f.type === "checkbox" ? (
            <input
              type="checkbox"
              aria-label={f.label}
              name={f.name}
              defaultChecked={Boolean(f.value)}
            />
          ) : (
            <input
              aria-label={f.label}
              name={f.name}
              type={f.type ?? "text"}
              step={f.type === "number" ? "any" : undefined}
              defaultValue={
                typeof f.value === "string" || typeof f.value === "number"
                  ? f.value
                  : ""
              }
              required={f.required}
              maxLength={f.type === "password" ? 128 : 12000}
            />
          )}{" "}
          {f.hint && <small>{f.hint}</small>}
        </label>
      ))}
    </>
  );
}
export function SimpleForm({
  fields,
  label,
  onSubmit,
  onChange,
  children,
}: {
  fields: Field[];
  label: string;
  onSubmit: (f: FormData) => Promise<void>;
  onChange?: (f: FormData) => void;
  children?: ReactNode;
}) {
  return (
    <form
      onChange={(e) => onChange?.(new FormData(e.currentTarget))}
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.reportValidity()) await onSubmit(new FormData(form));
      }}
    >
      <Fields fields={fields} />
      {children}
      <button className="co-primary" type="submit">
        {label}
      </button>
    </form>
  );
}
export const val = (f: FormData, key: string) => String(f.get(key) ?? "");
export const selected = (f: FormData, key: string) => f.getAll(key).map(String);
