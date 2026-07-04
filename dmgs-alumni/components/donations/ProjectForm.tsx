"use client";

import { useFormState } from "react-dom";
import type { Project } from "@/lib/projects";
import { saveProject, type ProjectState } from "@/app/donations/manage/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/AuthCard";

const initial: ProjectState = {};

export function ProjectForm({ project }: { project?: Project }) {
  const [state, action] = useFormState(saveProject, initial);

  const budgetText = project
    ? project.budget.map((b) => `${b.label} | ${b.amount}`).join("\n")
    : "";
  const ideaText = project ? project.idea.join("\n\n") : "";

  return (
    <form action={action}>
      {project && <input type="hidden" name="id" value={project.id} />}
      {state.error && <FormNotice tone="error">{state.error}</FormNotice>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="title" label="Title" defaultValue={project?.title} required />
        <Field name="tag" label="Short tag (e.g. Bursary Fund)" defaultValue={project?.tag} required />
        <Field name="tagline" label="One-line tagline" defaultValue={project?.tagline ?? ""} />
        <Field name="goal" label="Funding goal (₦)" type="number" defaultValue={project ? String(project.goal) : ""} />
        <Field name="impact" label="Impact line" defaultValue={project?.impact ?? ""} />
        <div>
          <label className="field-label" htmlFor="art">Illustration style</label>
          <select id="art" name="art" defaultValue={project?.art ?? "library"} className="field-input">
            <option value="bursary">Bursary (cap &amp; sunrise)</option>
            <option value="labs">Science labs (flask)</option>
            <option value="library">Library (bookshelf)</option>
          </select>
        </div>
        <Field name="photo_url" label="Photo URL (optional — overrides illustration)" defaultValue={project?.photo ?? ""} />
        <Field name="sort_order" label="Sort order" type="number" defaultValue={project ? "0" : "0"} />
        <Field name="slug" label="URL slug (blank = auto)" defaultValue={project?.slug ?? ""} />
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="idea">
          The story — separate paragraphs with a blank line
        </label>
        <textarea id="idea" name="idea" rows={6} defaultValue={ideaText} className="field-input" />
      </div>

      <div className="mt-5">
        <label className="field-label" htmlFor="budget">
          Budget — one line per item, format: Label | amount
        </label>
        <textarea
          id="budget"
          name="budget"
          rows={5}
          defaultValue={budgetText}
          placeholder={"Tuition & levies | 750000\nUniforms & books | 300000"}
          className="field-input font-mono text-[13px]"
        />
      </div>

      <label className="mt-5 flex items-center gap-2.5 font-sans text-[13px] text-ink-soft">
        <input type="checkbox" name="is_published" defaultChecked={project ? project.isPublished : true} />
        Published (visible to members)
      </label>

      <div className="mt-6">
        <SubmitButton>{project ? "Save changes" : "Create project"}</SubmitButton>
      </div>
    </form>
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
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} className="field-input" />
    </div>
  );
}
