import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapProject } from "@/lib/projects";
import { ngn } from "@/lib/format";
import { ProjectForm } from "@/components/donations/ProjectForm";
import { deleteProject } from "@/app/donations/manage/actions";
import { ConfirmSubmit } from "./ConfirmSubmit";

/** Manage → Projects: list, create and edit projects without leaving Manage. */
export async function ProjectsTab({ uid, edit }: { uid: string; edit?: string }) {
  const supabase = createClient();
  const [{ data: rows }, { data: totals }] = await Promise.all([
    supabase.from("projects").select("*").order("sort_order"),
    supabase.rpc("project_totals"),
  ]);
  const projects = (rows ?? []).map(mapProject);
  const raised = new Map<string, number>((totals ?? []).map((t: { project_id: string; total: number | string }) => [t.project_id, Number(t.total)]));

  if (edit) {
    const project = edit === "new" ? undefined : projects.find((p) => p.slug === edit);
    return (
      <div className="m-stackcol" style={{ gap: 20, maxWidth: 820 }}>
        <Link className="m-link" href="/admin?tab=projects" style={{ fontSize: 14 }}>
          ← All projects
        </Link>
        <h2 style={{ fontSize: 28, color: "var(--m-emerald)" }}>{project ? `Edit: ${project.title}` : edit === "new" ? "New project" : "Project not found"}</h2>
        {(project || edit === "new") && (
          <div className="m-card" style={{ padding: "8px 28px 28px" }}>
            <ProjectForm project={project} uid={uid} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="m-stackcol" style={{ gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: "var(--m-muted)" }}>
          {projects.length} {projects.length === 1 ? "project" : "projects"} · members see them on the Give page in this order
        </span>
        <Link href="/admin?tab=projects&edit=new" className="m-btn m-btn-gold">
          New project
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="m-card m-empty">No projects yet. Create the first one with New project.</div>
      ) : (
        <div className="m-card m-plist">
          {projects.map((p) => {
            const r = raised.get(p.id) ?? 0;
            const pct = p.goal > 0 ? Math.min(100, Math.round((r / p.goal) * 100)) : 0;
            return (
              <div key={p.id}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <span className="m-eyebrow">
                    {p.tag}
                    {!p.isPublished && <span className="m-draft"> · Hidden from members</span>}
                  </span>
                  <b style={{ fontFamily: "var(--m-serif)", fontSize: 20, color: "var(--m-emerald)" }}>{p.title}</b>
                  <span className="m-num" style={{ fontSize: 14, color: "var(--m-muted)" }}>
                    {ngn(r)} of {ngn(p.goal)} · {pct}% funded
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href={`/admin?tab=giving&view=projects&project=${p.id}`} className="m-btn m-btn-line m-btn-sm">
                    Report
                  </Link>
                  <Link href={`/donations/projects/${p.slug}`} className="m-btn m-btn-line m-btn-sm">
                    View
                  </Link>
                  <Link href={`/admin?tab=projects&edit=${p.slug}`} className="m-btn m-btn-primary m-btn-sm">
                    Edit
                  </Link>
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmit
                      message={`Delete "${p.title}"? Gifts already made stay in the reports under General fund, and the project page disappears. This cannot be undone.`}
                      className="m-btn m-btn-line m-btn-sm"
                      style={{ color: "#8a2a2a" }}
                    >
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
