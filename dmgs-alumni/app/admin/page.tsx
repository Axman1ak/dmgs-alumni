import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MemberRow } from "@/components/admin/MemberRow";
import { createClient } from "@/lib/supabase/server";
import { approveMember, rejectMember } from "./actions";
import { shortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "super_admin") redirect("/directory");

  const { data: pending } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, occupation, class_year, city, state, country, phone, bio, verification_answer, created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, class_year, admin_of_year")
    .eq("status", "approved")
    .order("full_name");

  // Unclaimed listings imported from the OSA register. Each pending member is
  // compared against these so the admin can link them to their existing
  // listing instead of creating a duplicate.
  const { data: unclaimed } = await supabase
    .from("alumni")
    .select("id, full_name, class_year")
    .is("profile_id", null)
    .neq("source", "member");
  const register = unclaimed ?? [];

  const pendingRows = pending ?? [];
  const memberRows = members ?? [];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="texture-diagonal bg-emerald-900 px-5 sm:px-8 py-12 text-cream">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-2 font-sans text-[11px] uppercase tracking-[0.2em] text-gold-400">
                Administration
              </p>
              <h1 className="font-display text-[32px] font-medium leading-none sm:text-[44px]">
                Admin panel
              </h1>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <div className="font-display text-[34px] text-gold-400">{pendingRows.length}</div>
                <div className="font-sans text-[11px] uppercase tracking-[0.12em] opacity-80">Pending</div>
              </div>
              <div>
                <div className="font-display text-[34px] text-gold-400">{memberRows.length}</div>
                <div className="font-sans text-[11px] uppercase tracking-[0.12em] opacity-80">Members</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1100px] px-5 sm:px-8 py-12">
          {/* Pending approvals */}
          <section className="mb-14">
            <h2 className="mb-5 border-b border-border pb-3 font-display text-[28px] font-medium text-emerald-900">
              Pending approvals
            </h2>
            {pendingRows.length === 0 ? (
              <p className="border border-border bg-cream px-4 py-10 text-center font-sans text-[14px] text-ink-muted">
                No one waiting. New sign-ups will appear here for review.
              </p>
            ) : (
              <div className="space-y-4">
                {pendingRows.map((p) => (
                  <div
                    key={p.id}
                    className="border border-border border-l-4 border-l-gold-500 bg-cream px-6 py-5"
                  >
                    {/* Header: who, and the decision buttons */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-display text-[22px] font-semibold text-emerald-900">
                          {p.full_name}
                        </p>
                        <p className="font-sans text-[13px] text-ink-soft">{p.email}</p>
                        <p className="mt-0.5 font-sans text-[11px] text-ink-muted">
                          Requested {shortDate(p.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <form action={approveMember} id={`approve-${p.id}`}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="btn btn-primary px-5 py-2.5 text-[12px]">
                            Approve
                          </button>
                        </form>
                        <form action={rejectMember}>
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="btn btn-danger px-5 py-2.5 text-[12px]">
                            Reject
                          </button>
                        </form>
                      </div>
                    </div>

                    <RegisterMatch
                      formId={`approve-${p.id}`}
                      matches={findMatches(p.full_name, p.class_year, register)}
                    />

                    {/* Everything they submitted */}
                    <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Detail
                        label="Graduating class"
                        value={p.class_year ? String(p.class_year) : null}
                      />
                      <Detail label="Profession" value={p.occupation} />
                      <Detail label="Phone" value={p.phone} />
                      <Detail label="City" value={p.city} />
                      <Detail label="State" value={p.state} />
                      <Detail label="Country" value={p.country} />
                    </dl>

                    {p.bio && (
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                          About them
                        </p>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{p.bio}</p>
                      </div>
                    )}

                    {/* The thing that actually decides it */}
                    <div className="mt-4 border-l-2 border-gold-500 bg-gold-500/10 px-4 py-3">
                      <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                        Identity check &middot; senior prefect in their final year
                      </p>
                      <p className="mt-1 font-sans text-[15px] font-semibold text-emerald-900">
                        {p.verification_answer || "(not answered)"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Members + roles */}
          <section>
            <h2 className="mb-2 border-b border-border pb-3 font-display text-[28px] font-medium text-emerald-900">
              Members &amp; roles
            </h2>
            <p className="mb-5 font-sans text-[12px] text-ink-muted">
              Set a member&rsquo;s role. A <strong>class admin</strong> needs a graduating
              year and can then see that class&rsquo;s donors and reports. A{" "}
              <strong>super admin</strong> has full control.
            </p>
            <div className="overflow-hidden rounded-[2px] border border-border bg-cream">
              {memberRows.map((m) => (
                <MemberRow key={m.id} member={m} isSelf={m.id === user.id} />
              ))}
            </div>
            <p className="mt-3 font-sans text-[12px] text-ink-muted">
              Deleting a member removes their account, sign-in, and directory listing.
              Their donation records are kept, so class totals stay accurate.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-sans text-[14px] text-ink">
        {value || <span className="text-ink-muted">Not given</span>}
      </dd>
    </div>
  );
}

type RegisterRow = { id: string; full_name: string; class_year: number | null };
type Match = RegisterRow & { score: number };

function words(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .split(/[^a-z]+/)
    .filter((w) => w.length > 1);
}

/**
 * Likely register listings for a new member: surname match is the strongest
 * signal, then first name, then graduating year. Initials are ignored because
 * the register often abbreviates middle names.
 */
function findMatches(fullName: string, year: number | null, rows: RegisterRow[]): Match[] {
  const w = words(fullName);
  if (w.length === 0) return [];
  const first = w[0];
  const last = w[w.length - 1];
  return rows
    .map((r) => {
      const rw = words(r.full_name);
      let score = 0;
      if (rw.includes(last)) score += 2;
      if (rw.includes(first)) score += 2;
      if (year && r.class_year === year) score += 1;
      return { ...r, score };
    })
    .filter((m) => m.score >= 3)
    .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name))
    .slice(0, 5);
}

function RegisterMatch({ formId, matches }: { formId: string; matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <p className="mt-4 font-sans text-[12px] text-ink-muted">
        No likely match in the OSA register. Approving creates a new directory listing.
      </p>
    );
  }
  // Pre-select only a clear winner; ties (e.g. two "Emmanuel Ajayi", 1978)
  // are left for the admin to decide.
  const clear = matches[0].score >= 4 && (matches.length === 1 || matches[1].score < matches[0].score);
  const best = clear ? matches[0].id : "new";
  return (
    <fieldset className="mt-4 border border-border bg-paper px-4 py-3">
      <legend className="px-1 font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        Possible match in the OSA register
      </legend>
      <div className="space-y-2">
        {matches.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-center gap-3 font-sans text-[14px] text-ink">
            <input
              type="radio"
              name="link_alumni_id"
              value={m.id}
              form={formId}
              defaultChecked={m.id === best}
            />
            <span>
              Link to <strong>{m.full_name}</strong>
              <span className="text-ink-muted">
                {" "}&middot; {m.class_year ? `Class of ${m.class_year}` : "year unknown"}
              </span>
            </span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-3 font-sans text-[14px] text-ink">
          <input
            type="radio"
            name="link_alumni_id"
            value="new"
            form={formId}
            defaultChecked={best === "new"}
          />
          <span>Not them, create a new listing</span>
        </label>
      </div>
    </fieldset>
  );
}
