import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Crest } from "@/components/ui/Crest";

/**
 * Holding page for signed-in members whose account is still pending (or was
 * rejected). The middleware sends unapproved users here.
 */
export default async function PendingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, status")
    .eq("id", user.id)
    .single();

  const rejected = profile?.status === "rejected";

  return (
    <div className="m-app" style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      <header className="m-head" style={{ position: "static" }}>
        <div className="m-wrap m-head-in">
          <Link href="/" className="m-brand">
            <Crest size={42} />
            <span>DMGS Old Students</span>
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div className="m-card" style={{ maxWidth: 520, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          <span className="m-eyebrow">{rejected ? "Membership" : "Request received"}</span>
          <h1 style={{ fontSize: 32, color: "var(--m-emerald)" }}>
            {rejected ? "Membership not approved" : "Awaiting approval"}
          </h1>
          <p style={{ lineHeight: 1.6, color: "#4d5358" }}>
            {rejected ? (
              <>
                We could not verify your membership. If you believe this is a mistake, please contact the
                association&rsquo;s administrators.
              </>
            ) : (
              <>
                Thank you{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. An administrator will check
                your details against the register, usually within a few days. Once you are approved, sign in again to
                reach the member area and complete the rest of your profile.
              </>
            )}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <Link href="/" className="m-btn m-btn-primary">Return to the home page</Link>
            <form action={signOut}>
              <button type="submit" className="m-btn m-btn-line">Sign out</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
