import Link from "next/link";
import { Crest } from "@/components/ui/Crest";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/messages", label: "Messages" },
  { href: "/donations", label: "Giving" },
];

/**
 * Top ribbon + sticky header. Shows the nav and a user chip when signed in,
 * or a "Member sign in" link when signed out.
 */
export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initials = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
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
          <span className="opacity-75">Ijero-Ekiti, Nigeria</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-8 py-5">
          <Link href="/" className="flex items-center gap-3.5 no-underline">
            <Crest />
            <span>
              <span className="block font-display text-[22px] font-semibold leading-none text-emerald-900">
                Old Students Association
              </span>
              <span className="mt-1 block font-sans text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                Doherty Memorial Grammar School
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded px-4 py-2.5 font-sans text-[13px] font-medium uppercase tracking-[0.04em] text-ink-soft transition-colors hover:text-emerald-900"
                  >
                    {item.label}
                  </Link>
                ))}
                <span className="ml-2 flex items-center gap-2.5 rounded-full bg-emerald-900 py-1.5 pl-3.5 pr-1.5 font-sans text-[13px] text-cream">
                  {initials || "—"}
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gold-500 text-[12px] font-semibold text-emerald-900">
                    {initials || "?"}
                  </span>
                </span>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Member sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
