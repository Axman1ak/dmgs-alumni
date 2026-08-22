"use client";

import { useState } from "react";

/**
 * Password input with a show/hide eye toggle. Works controlled (value +
 * onChange) or uncontrolled (defaultValue), so it drops into every auth form.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  required,
  minLength,
  value,
  onChange,
  defaultValue,
  hint,
}: {
  id: string;
  name: string;
  label?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  value?: string;
  onChange?: (v: string) => void;
  defaultValue?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const controlled = value !== undefined && onChange !== undefined;

  return (
    <div className="mb-5">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="field-input pr-12"
          {...(controlled
            ? { value, onChange: (e) => onChange!(e.target.value) }
            : { defaultValue })}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted transition-colors hover:text-emerald-900"
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {hint && <p className="mt-1.5 font-sans text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.4M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 4.4-1.1" />
      <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
      <path d="M2 2l20 20" />
    </svg>
  );
}
