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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Crest size={80} />
      <h1 className="mt-8 font-display text-[40px] font-medium text-emerald-900">
        {rejected ? "Membership not approved" : "Awaiting approval"}
      </h1>
      <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-ink-soft">
        {rejected ? (
          <>
            We couldn&rsquo;t verify your membership at this time. If you believe
            this is a mistake, please reach out to the association&rsquo;s
            administrators.
          </>
        ) : (
          <>
            Thanks{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
            Your request is with our administrators for verification. You&rsquo;ll
            be able to sign in as soon as it&rsquo;s approved. There is no need
            to do anything else.
          </>
        )}
      </p>

      <div className="mt-9 flex items-center gap-3">
        <form action={signOut}>
          <button type="submit" className="btn btn-outline">
            Sign out
          </button>
        </form>
        <Link href="/" className="btn btn-primary">
          Return home
        </Link>
      </div>
    </div>
  );
}
