"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useFormState } from "react-dom";
import type { Project } from "@/lib/projects";
import { saveProject, type ProjectState } from "@/app/donations/manage/actions";
import { createClient } from "@/lib/supabase/client";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: ProjectState = {};

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

const ILLUSTRATIONS = [
  { value: "library", label: "Books / library" },
  { value: "labs", label: "Science" },
  { value: "bursary", label: "Bursary / school" },
];

type BudgetRow = { label: string; amount: string };

/**
 * Simple project editor for non-technical admins: plain fields, a photo you
 * upload from your device, and a spend breakdown you fill in row by row. No
 * slugs, no syntax.
 */
export function ProjectForm({ project, uid }: { project?: Project; uid: string }) {
  const [state, action] = useFormState(saveProject, initial);

  const [photoUrl, setPhotoUrl] = useState<string | null>(project?.photo ?? null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [art, setArt] = useState<string>(project?.art ?? "library");
  const [rows, setRows] = useState<BudgetRow[]>(
    project && project.budget.length
      ? project.budget.map((b) => ({ label: b.label, amount: String(b.amount) }))
      : [{ label: "", amount: "" }],
  );

  const ideaText = project ? project.idea.join("\n\n") : "";
  // Serialize the budget rows into the "Label | amount" lines the action parses.
  const budgetSerialized = rows
    .filter((r) => r.label.trim())
    .map((r) => `${r.label.trim()} | ${r.amount.replace(/[^0-9.]/g, "") || "0"}`)
    .join("\n");

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    const type = (file.type || "").toLowerCase();
    const ext = EXT_BY_TYPE[type];
    if (!ext) {
      setPhotoError("Use a JPG, PNG, WebP or HEIC image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("That image is over 8MB. Please choose a smaller one.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${uid}/project-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: type, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function setRow(i: number, key: keyof BudgetRow, v: string) {
    setRows((prev) => prev.map((r, k) => (k === i ? { ...r, [key]: v } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { label: "", amount: "" }]);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, k) => k !== i));
  }

  return (
    <form action={action}>
      {project && <input type="hidden" name="id" value={project.id} />}
      {/* hidden fields kept simple / auto */}
      <input type="hidden" name="slug" value={project?.slug ?? ""} />
      <input type="hidden" name="sort_order" value="0" />
      <input type="hidden" name="photo_url" value={photoUrl ?? ""} />
      <input type="hidden" name="art" value={art} />
      <input type="hidden" name="budget" value={budgetSerialized} />

      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}

      {/* Basics */}
      <label className="field-label" htmlFor="title">Project name</label>
      <input id="title" name="title" defaultValue={project?.title ?? ""} required className="field-input" />

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="tag">Short label</label>
          <input id="tag" name="tag" defaultValue={project?.tag ?? ""} required placeholder="e.g. Classrooms" className="field-input" />
          <p className="mt-1.5 font-sans text-[11px] text-ink-muted">Shown as a small tag on the card.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="goal">Fundraising goal (₦)</label>
          <input id="goal" name="goal" type="number" min={0} defaultValue={project ? String(project.goal) : ""} placeholder="e.g. 3000000" className="field-input" />
        </div>
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="tagline">One-line summary</label>
        <input id="tagline" name="tagline" defaultValue={project?.tagline ?? ""} placeholder="Sound roofs, real desks, enough light to read by." className="field-input" />
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="idea">Description</label>
        <textarea id="idea" name="idea" rows={5} defaultValue={ideaText} placeholder="Explain the project in a few sentences. Leave a blank line between paragraphs." className="field-input" />
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="impact">What it achieves (optional)</label>
        <input id="impact" name="impact" defaultValue={project?.impact ?? ""} placeholder="e.g. Three working labs for 600 students a year." className="field-input" />
      </div>

      {/* Photo */}
      <div className="mt-6 border-t border-border pt-6">
        <label className="field-label">Photo (optional)</label>
        <div className="flex items-center gap-5">
          <div className="relative h-[90px] w-[120px] shrink-0 overflow-hidden border border-border bg-cream-dark">
            {photoUrl ? (
              <Image src={photoUrl} alt="" fill className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-sans text-[11px] text-ink-muted">
                No photo
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn btn-outline disabled:opacity-60"
            >
              {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload a photo"}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="ml-2 font-sans text-[12px] text-danger hover:underline"
              >
                Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={onPickPhoto}
              className="hidden"
            />
            {photoError && <p className="mt-2 font-sans text-[12px] text-danger">{photoError}</p>}
          </div>
        </div>

        {!photoUrl && (
          <div className="mt-4">
            <label className="field-label">No photo? Pick an illustration</label>
            <div className="flex flex-wrap gap-2">
              {ILLUSTRATIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setArt(o.value)}
                  className={`border px-4 py-2.5 font-sans text-[13px] ${
                    art === o.value
                      ? "border-emerald-700 bg-emerald-900 text-cream"
                      : "border-border bg-paper text-ink-soft hover:border-emerald-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Budget */}
      <div className="mt-6 border-t border-border pt-6">
        <label className="field-label">Where the money goes (optional)</label>
        <p className="mb-3 font-sans text-[12px] text-ink-muted">
          Add the main costs. This shows donors exactly what their gift funds.
        </p>
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={r.label}
                onChange={(e) => setRow(i, "label", e.target.value)}
                placeholder="Item (e.g. Roofing)"
                className="field-input flex-1"
              />
              <input
                value={r.amount}
                onChange={(e) => setRow(i, "amount", e.target.value)}
                inputMode="numeric"
                placeholder="₦ amount"
                className="field-input w-[140px]"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label="Remove item"
                className="shrink-0 border border-border px-3 text-ink-muted hover:border-danger hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-3 font-sans text-[13px] font-medium text-emerald-700 hover:underline"
        >
          + Add an item
        </button>
      </div>

      {/* Publish */}
      <label className="mt-6 flex items-center gap-2.5 border-t border-border pt-6 font-sans text-[14px] text-ink-soft">
        <input type="checkbox" name="is_published" defaultChecked={project ? project.isPublished : true} className="h-5 w-5" />
        Show this project to members now
      </label>

      <div className="mt-6">
        <SubmitButton>{project ? "Save changes" : "Create project"}</SubmitButton>
      </div>
    </form>
  );
}
