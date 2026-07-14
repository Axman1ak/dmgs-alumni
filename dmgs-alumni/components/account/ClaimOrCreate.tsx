"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { createMyListing, type FormState } from "@/app/account/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: FormState = {};

/**
 * First-time profile creation. Members build their OWN directory listing -
 * there is no claiming of pre-existing records (that would let anyone
 * impersonate another alumnus). Every listing is owned by its creator.
 */
export function ClaimOrCreate({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [state, action] = useFormState(createMyListing, initial);

  useEffect(() => {
    if (state.message) router.refresh();
  }, [state.message, router]);

  return (
    <div>
      <p className="mb-6 text-[16px] leading-relaxed text-ink-soft">
        You don&rsquo;t have a directory listing yet. Create yours below. It goes
        live in the old students directory once complete.
      </p>

      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}

      <form action={action}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="full_name" label="Full name" defaultValue={defaultName} required />
          <Field name="class_year" label="Class year (e.g. 1977)" type="number" />
          <Field name="occupation" label="Occupation" />
          <Field name="city" label="City" />
          <Field name="state" label="State / Province" />
          <Field name="country" label="Country" />
          <Field name="phone" label="Phone" />
          <Field name="email" label="Email" type="email" />
        </div>
        <div className="mt-5">
          <label className="field-label" htmlFor="bio">About</label>
          <textarea id="bio" name="bio" rows={3} className="field-input" />
        </div>
        <div className="mt-6">
          <SubmitButton>Create my listing</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} className="field-input" />
    </div>
  );
}
