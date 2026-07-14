import Link from "next/link";
import { Crest } from "@/components/ui/Crest";
import { HeaderNav } from "./HeaderNav";
import { createClient } from "@/lib/supabase/server";

/**
 * Top ribbon + sticky header. The interactive nav (user menu, mobile
 * hamburger) lives in the HeaderNav client component.
 */
export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initials = "";
  let isSuperAdmin = false;
  let pendingCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    isSuperAdmin = profile?.role === "super_admin";
    if (isSuperAdmin) {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      pendingCount = count ?? 0;
    }
    const name = profile?.full_name ?? user.email ?? "";
    initials = name
      .split(" ")
      .map((p: string) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <>
      {/* Top ribbon */}
      <div className="bg-emerald-900 py-2 font-sans text-[12px] uppercase tracking-[0.08em] text-cream">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8">
          <span className="opacity-75">Doherty Memorial Grammar School · Est. 1955</span>
          <span className="hidden opacity-75 sm:inline">Ijero-Ekiti, Nigeria</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-[1280px] items-center gap-3 px-5 py-4 md:gap-8 md:px-8 md:py-5">
          <Link href="/" className="flex items-center gap-3.5 no-underline">
            <Crest />
            <span>
              <span className="block font-display text-[20px] font-semibold leading-none text-emerald-900 md:text-[22px]">
                Old Students Association
              </span>
              <span className="mt-1 hidden font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted sm:block">
                Doherty Memorial Grammar School
              </span>
            </span>
          </Link>

          <HeaderNav
            signedIn={Boolean(user)}
            initials={initials}
            isSuperAdmin={isSuperAdmin}
            pendingCount={pendingCount}
          />
        </div>
      </header>
    </>
  );
}
