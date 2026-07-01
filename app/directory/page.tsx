import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { signOut } from "@/app/(auth)/actions";

/**
 * Placeholder home for approved members. The full searchable directory lands
 * in Phase 2; this confirms the auth + approval loop end-to-end.
 */
export default function DirectoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1280px] px-8 py-20 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-gold-500">
          Phase 1 complete
        </p>
        <h1 className="mt-4 font-display text-[48px] font-medium text-emerald-900">
          You&rsquo;re in.
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-[17px] leading-relaxed text-ink-soft">
          Authentication, the admin-approval queue, and role-based access are
          live. The searchable alumni directory, events, messaging, and giving
          come next.
        </p>
        <form action={signOut} className="mt-8">
          <button type="submit" className="btn btn-outline">
            Sign out
          </button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
