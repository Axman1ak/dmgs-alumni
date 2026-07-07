import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ngn, shortDate } from "@/lib/format";
import { PrintButton } from "@/components/donations/PrintButton";

export const dynamic = "force-dynamic";

type Donation = {
  id: string;
  donor_name: string | null;
  is_anonymous: boolean;
  amount: number;
  status: string;
  created_at: string;
};

export default async function ClassReportPage({
  params,
}: {
  params: { year: string };
}) {
  const year = Number(params.year);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_of_year")
    .eq("id", user.id)
    .single();

  const isSuper = profile?.role === "super_admin";
  const authorized = isSuper || profile?.admin_of_year === year;

  if (!authorized) {
    return (
      <div className="mx-auto max-w-[720px] px-8 py-20 text-center">
        <h1 className="mb-3 font-display text-[32px] text-emerald-900">Not authorized</h1>
        <p className="text-ink-soft">
          You can only view the donation report for the class you administer.
        </p>
        <Link href="/donations" className="btn btn-outline mt-6">
          Back to giving
        </Link>
      </div>
    );
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("label, donation_goal")
    .eq("year", year)
    .maybeSingle();

  const { data: donations } = await supabase
    .from("donations")
    .select("id, donor_name, is_anonymous, amount, status, created_at")
    .eq("class_year", year)
    .eq("status", "success")
    .order("created_at", { ascending: false });

  const rows = (donations ?? []) as Donation[];
  const total = rows.reduce((sum, d) => sum + Number(d.amount), 0);
  const goal = Number(cls?.donation_goal ?? 0);

  return (
    <div className="mx-auto max-w-[820px] px-8 py-12 print:py-0">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <Link href="/donations" className="font-sans text-[13px] text-emerald-700 hover:underline">
          ← Back to giving
        </Link>
        <PrintButton />
      </div>

      {/* Report header */}
      <div className="mb-8 border-b-2 border-emerald-900 pb-6">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-gold-500">
          DMGS Old Students Association · Donation Report
        </p>
        <h1 className="mt-2 font-display text-[40px] font-semibold text-emerald-900">
          {cls?.label ?? `Class of ${year}`}
        </h1>
        <p className="mt-1 font-sans text-[13px] text-ink-muted">
          Generated {shortDate(new Date().toISOString())}
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Stat label="Total raised" value={ngn(total)} />
        <Stat label="Donations" value={String(rows.length)} />
        <Stat label="Goal" value={goal > 0 ? ngn(goal) : "-"} />
      </div>

      {/* Records */}
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-emerald-900">
            <th className="py-2 font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">Donor</th>
            <th className="py-2 text-right font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">Amount</th>
            <th className="py-2 text-right font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-b border-border">
              <td className="py-2.5 text-[14px] text-ink">
                {d.is_anonymous ? "Anonymous" : d.donor_name ?? "-"}
              </td>
              <td className="py-2.5 text-right text-[14px] font-semibold text-emerald-900">
                {ngn(Number(d.amount))}
              </td>
              <td className="py-2.5 text-right text-[13px] text-ink-muted">
                {shortDate(d.created_at)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-emerald-900">
            <td className="py-3 font-display text-[18px] font-semibold text-emerald-900">Total</td>
            <td className="py-3 text-right font-display text-[18px] font-semibold text-emerald-900">
              {ngn(total)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-cream p-4 text-center">
      <div className="font-display text-[26px] font-semibold text-emerald-900">{value}</div>
      <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </div>
    </div>
  );
}
