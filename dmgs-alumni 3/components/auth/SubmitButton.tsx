"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary mt-2 w-full justify-center py-3.5 disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
