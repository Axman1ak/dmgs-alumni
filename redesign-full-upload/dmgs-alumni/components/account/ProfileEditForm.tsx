"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { updateMyProfile, savePhotoUrl, type FormState } from "@/app/account/actions";
import { CONNECT, COUNTRIES, INDUSTRIES, INTERESTS, initials, type ConnectPref } from "@/lib/options";
import { profileChecks } from "@/lib/completeness";

export type MyListing = {
  id: string;
  profile_id: string | null;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  maiden_name: string | null;
  former_name: string | null;
  class_year: number | null;
  country: string | null;
  state: string | null;
  industry: string | null;
  job_title: string | null;
  employer: string | null;
  interests: string[] | null;
  connect_pref: ConnectPref | null;
  linkedin_url: string | null;
  social_url: string | null;
  email: string | null;
  email_shared: boolean;
  photo_url: string | null;
};

const initial: FormState = {};

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="m-btn m-btn-primary" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const TICK = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export function ProfileEditForm({ person, memberSince }: { person: MyListing; memberSince: number }) {
  const router = useRouter();
  const [state, action] = useFormState(updateMyProfile, initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(person.photo_url);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Live copy of the fields that drive the completeness checklist.
  const [f, setF] = useState({
    first_name: person.first_name ?? "",
    last_name: person.last_name ?? "",
    country: person.country ?? "",
    state: person.state ?? "",
    industry: person.industry ?? "",
    job_title: person.job_title ?? "",
    employer: person.employer ?? "",
    linkedin_url: person.linkedin_url ?? "",
    social_url: person.social_url ?? "",
    email: person.email ?? "",
  });
  const [interests, setInterests] = useState<string[]>(person.interests ?? []);
  const [connect, setConnect] = useState<ConnectPref | "">(person.connect_pref ?? "");
  const [emailShared, setEmailShared] = useState(person.email_shared);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  const checks = profileChecks({ ...f, class_year: person.class_year, interests, connect_pref: connect || null });
  const pct = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);
  const countryOptions = f.country && !(COUNTRIES as readonly string[]).includes(f.country) ? [f.country, ...COUNTRIES] : [...COUNTRIES];

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !person.profile_id) return;
    setPhotoError(null);
    const type = (file.type || "").toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) return setPhotoError("That file type isn't supported. Use a JPG, PNG, WebP, GIF or HEIC image.");
    if (file.size > 8 * 1024 * 1024) return setPhotoError("That image is larger than 8MB. Please choose a smaller one.");
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${person.profile_id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: type, cacheControl: "3600" });
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

  const optional = <span style={{ fontWeight: 400, color: "var(--m-muted)" }}> (optional)</span>;
  const name = `${f.first_name} ${f.last_name}`.trim() || person.full_name;

  return (
    <form action={action}>
      <section className="m-page-head">
        <div className="m-wrap">
          <div>
            <h1>My profile</h1>
            <p className="sub">This is how classmates find and see you in the directory.</p>
          </div>
          <SaveButton />
        </div>
      </section>

      <div className="m-wrap m-body">
        {state.message && <p className="m-toast" style={{ marginBottom: 20 }}>{state.message}</p>}
        {state.error && <p className="m-error" style={{ marginBottom: 20 }}>{state.error}</p>}

        <div className="m-prof">
          <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="m-card" style={{ padding: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
              <span className="m-avatar" style={{ width: 120, height: 120, fontSize: 42 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photoUrl ? <img src={photoUrl} alt={name} /> : initials(name)}
              </span>
              <button type="button" className="m-btn m-btn-line m-btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload a photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif" onChange={onPickPhoto} hidden />
              {photoError && <span style={{ fontSize: 13, color: "#8a2a2a" }}>{photoError}</span>}
              <b style={{ fontFamily: "var(--m-serif)", fontSize: 22 }}>{name}</b>
              <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
                {person.class_year ? `Class of ${person.class_year} · ` : ""}Member since {memberSince}
              </span>
            </div>
            <div className="m-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <b>Profile {pct}% complete</b>
              <div className="m-bar"><span style={{ width: `${pct}%` }} /></div>
              {checks.map(([label, ok]) => (
                <span key={label} className={`m-ck ${ok ? "ok" : ""}`}>
                  <i>{ok ? TICK : null}</i>
                  {label}
                </span>
              ))}
            </div>
          </aside>

          <div className="m-card">
            <fieldset>
              <legend>1. Names</legend>
              <div className="m-field"><label htmlFor="p-first">First name</label><input className="m-input" id="p-first" name="first_name" value={f.first_name} onChange={set("first_name")} required autoComplete="given-name" /></div>
              <div className="m-field"><label htmlFor="p-last">Surname (last name)</label><input className="m-input" id="p-last" name="last_name" value={f.last_name} onChange={set("last_name")} required autoComplete="family-name" /></div>
              <div className="m-field"><label htmlFor="p-maiden">Maiden name{optional}</label><input className="m-input" id="p-maiden" name="maiden_name" defaultValue={person.maiden_name ?? ""} /><span className="m-hint">The surname you had at school, if it has changed.</span></div>
              <div className="m-field"><label htmlFor="p-former">Former name{optional}</label><input className="m-input" id="p-former" name="former_name" defaultValue={person.former_name ?? ""} /><span className="m-hint">Any other name classmates may know you by.</span></div>
            </fieldset>

            <fieldset>
              <legend>2–4. Class &amp; location</legend>
              <div className="m-field m-full"><label htmlFor="p-year">Graduation year / class set</label><input className="m-input" id="p-year" value={person.class_year ? `Class of ${person.class_year}` : "Not set"} disabled /><span className="m-hint">Set by an administrator from the register. Contact them to correct it.</span></div>
              <div className="m-field">
                <label htmlFor="p-country">Country</label>
                <select className="m-input" id="p-country" name="country" value={f.country} onChange={set("country")}>
                  <option value="">Choose a country</option>
                  {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="m-field"><label htmlFor="p-state">State / region</label><input className="m-input" id="p-state" name="state" value={f.state} onChange={set("state")} autoComplete="address-level1" /></div>
            </fieldset>

            <fieldset>
              <legend>5–7. Work</legend>
              <div className="m-field m-full">
                <label htmlFor="p-industry">Industry / profession</label>
                <select className="m-input" id="p-industry" name="industry" value={f.industry} onChange={set("industry")}>
                  <option value="">Choose an industry</option>
                  {INDUSTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="m-field"><label htmlFor="p-title">Job title</label><input className="m-input" id="p-title" name="job_title" value={f.job_title} onChange={set("job_title")} autoComplete="organization-title" /></div>
              <div className="m-field"><label htmlFor="p-employer">Current employer</label><input className="m-input" id="p-employer" name="employer" value={f.employer} onChange={set("employer")} autoComplete="organization" /><span className="m-hint">Leave empty if self-employed or retired.</span></div>
            </fieldset>

            <fieldset>
              <legend>8. Areas of interest</legend>
              <div className="m-full m-chips" role="group" aria-label="Areas of interest">
                {INTERESTS.map((x) => {
                  const on = interests.includes(x);
                  return (
                    <button key={x} type="button" className="m-chip-btn" aria-pressed={on} onClick={() => setInterests((cur) => (on ? cur.filter((i) => i !== x) : [...cur, x]))}>
                      {x}
                    </button>
                  );
                })}
                {interests.map((x) => <input key={x} type="hidden" name="interests" value={x} />)}
              </div>
            </fieldset>

            <fieldset>
              <legend>9. Willingness to connect / mentor</legend>
              <div className="m-full m-radios">
                {(Object.keys(CONNECT) as ConnectPref[]).map((k) => (
                  <label key={k} className={`m-rcard ${connect === k ? "on" : ""}`}>
                    <input type="radio" name="connect_pref" value={k} checked={connect === k} onChange={() => setConnect(k)} />
                    <span>
                      <b>{CONNECT[k].label}</b>
                      <span>{CONNECT[k].hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>10–11. Links &amp; email</legend>
              <div className="m-field"><label htmlFor="p-li">LinkedIn{optional}</label><input className="m-input" id="p-li" name="linkedin_url" value={f.linkedin_url} onChange={set("linkedin_url")} placeholder="linkedin.com/in/your-name" inputMode="url" /></div>
              <div className="m-field"><label htmlFor="p-soc">Other social link{optional}</label><input className="m-input" id="p-soc" name="social_url" value={f.social_url} onChange={set("social_url")} inputMode="url" /></div>
              <div className="m-field"><label htmlFor="p-email">Email{optional}</label><input className="m-input" id="p-email" name="email" type="email" value={f.email} onChange={set("email")} autoComplete="email" /></div>
              <div style={{ alignSelf: "end" }}>
                <button type="button" className="m-switch" role="switch" aria-checked={emailShared && Boolean(f.email)} disabled={!f.email} onClick={() => setEmailShared((v) => !v)}>
                  <span className="tr" />
                  {emailShared && f.email ? "Shown to verified members" : "Hidden. Members reach you through messages"}
                </button>
                {emailShared && f.email && <input type="hidden" name="email_shared" value="on" />}
              </div>
            </fieldset>

            <div style={{ padding: "0 32px 32px", display: "flex", justifyContent: "flex-end" }}>
              <SaveButton />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
