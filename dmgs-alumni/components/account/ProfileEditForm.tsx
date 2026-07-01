"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useFormState } from "react-dom";
import type { Alumni } from "@/lib/types";
import { initialsOf, classBadge } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  updateMyProfile,
  savePhotoUrl,
  type FormState,
} from "@/app/account/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: FormState = {};

export function ProfileEditForm({ person }: { person: Alumni }) {
  const router = useRouter();
  const [state, action] = useFormState(updateMyProfile, initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(person.photo_url);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const badge = classBadge(person.class_year);

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !person.profile_id) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${person.profile_id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const res = await savePhotoUrl(data.publicUrl);
      if (res.error) throw new Error(res.error);

      setPhotoUrl(data.publicUrl);
      router.refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {state.message && <FormNotice>{state.message}</FormNotice>}
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}

      {/* Photo */}
      <div className="mb-8 flex items-center gap-6">
        <div className="flex h-[120px] w-[96px] items-center justify-center overflow-hidden border-[3px] border-gold-500 bg-cream-dark font-display text-4xl font-medium text-emerald-800">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={person.full_name}
              width={96}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            initialsOf(person.full_name)
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn btn-outline disabled:opacity-60"
          >
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickPhoto}
            className="hidden"
          />
          {photoError && (
            <p className="mt-2 font-sans text-[12px] text-danger">{photoError}</p>
          )}
        </div>
      </div>

      <form action={action}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="full_name" label="Full name" defaultValue={person.full_name} required />
          <div>
            <label className="field-label">Class year (locked)</label>
            <input
              value={badge ? `Class of ${badge}` : "Not set"}
              disabled
              className="field-input cursor-not-allowed opacity-70"
            />
          </div>
          <Field name="occupation" label="Occupation" defaultValue={person.occupation} />
          <Field name="city" label="City" defaultValue={person.city} />
          <Field name="country" label="Country" defaultValue={person.country} />
          <Field name="phone" label="Phone" defaultValue={person.phone} />
          <Field name="email" label="Email" type="email" defaultValue={person.email} />
        </div>
        <div className="mt-5">
          <label className="field-label" htmlFor="bio">About</label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={person.bio ?? ""}
            className="field-input"
          />
        </div>
        <p className="mt-3 font-sans text-[12px] text-ink-muted">
          Your class year is locked — contact an administrator to correct it.
        </p>
        <div className="mt-6">
          <SubmitButton>Save changes</SubmitButton>
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
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="field-input"
      />
    </div>
  );
}
