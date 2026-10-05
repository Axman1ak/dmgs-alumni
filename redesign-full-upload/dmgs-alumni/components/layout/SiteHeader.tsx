import Link from "next/link";
import { Crest } from "@/components/ui/Crest";
import { HeaderNav } from "./HeaderNav";
import { createClient } from "@/lib/supabase/server";

/**
 * Site header (2026 redesign). Server part: who is signed in, their role,
 * pending approvals and unread messages. The interactive menu lives in
 * HeaderNav.
 */
export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initials = "";
  let isSuperAdmin = false;
  let isAdmin = false;
  let pendingCount = 0;
  let unread = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, status")
      .eq("id", user.id)
      .single();
    isSuperAdmin = profile?.role === "super_admin";
    isAdmin = isSuperAdmin || profile?.role === "class_admin";
    if (isSuperAdmin) {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      pendingCount = count ?? 0;
    }

    // Unread messages: anything newer than my last read in each of my chats.
    if (profile?.status === "approved") {
      const { data: memberships } = await supabase
        .from("chat_members")
        .select("chat_id, last_read_at")
        .eq("profile_id", user.id);
      const lastRead = new Map((memberships ?? []).map((m) => [m.chat_id, m.last_read_at as string]));
      const since = (memberships ?? []).map((m) => m.last_read_at as string).sort()[0];
      if (lastRead.size && since) {
        const { data: recent } = await supabase
          .from("messages")
          .select("chat_id, sender_id, created_at")
          .in("chat_id", Array.from(lastRead.keys()))
          .gt("created_at", since)
          .neq("sender_id", user.id)
          .limit(200);
        unread = (recent ?? []).filter((m) => m.created_at > (lastRead.get(m.chat_id) ?? "")).length;
      }
    }

    const name = profile?.full_name ?? user.email ?? "";
    const words = name.trim().split(/\s+/);
    initials = ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
  }

  return (
    <header className="m-head">
      <div className="m-wrap m-head-in" style={{ position: "relative" }}>
        <Link href={user ? "/home" : "/"} className="m-brand">
          <Crest size={42} />
          <span>DMGS Old Students</span>
        </Link>
        <HeaderNav
          signedIn={Boolean(user)}
          initials={initials}
          isSuperAdmin={isSuperAdmin}
          isAdmin={isAdmin}
          pendingCount={pendingCount}
          unread={unread}
        />
      </div>
    </header>
  );
}
