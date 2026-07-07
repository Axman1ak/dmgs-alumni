import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MessagesClient } from "@/components/messages/MessagesClient";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, MemberName } from "@/components/messages/types";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const me = user.id;

  const [{ data: profile }, { data: memberships }, { data: broadcast }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", me).single(),
      supabase.from("chat_members").select("chat_id, last_read_at").eq("profile_id", me),
      supabase
        .from("chats")
        .select("id, type, title")
        .eq("type", "broadcast")
        .limit(1)
        .maybeSingle(),
    ]);

  const isSuperAdmin = profile?.role === "super_admin";
  const myChatIds = (memberships ?? []).map((m) => m.chat_id);
  const lastRead = new Map(
    (memberships ?? []).map((m) => [m.chat_id, m.last_read_at as string]),
  );

  // Chats I belong to.
  const { data: myChats } = myChatIds.length
    ? await supabase.from("chats").select("id, type, title").in("id", myChatIds)
    : { data: [] };

  // Members of those chats (to name DMs/groups).
  const { data: allMembers } = myChatIds.length
    ? await supabase.from("chat_members").select("chat_id, profile_id").in("chat_id", myChatIds)
    : { data: [] };

  const memberIds = Array.from(
    new Set([...(allMembers ?? []).map((m) => m.profile_id), me]),
  );
  const { data: names } = await supabase
    .from("member_names")
    .select("id, full_name")
    .in("id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
  const nameMap = new Map((names ?? []).map((n) => [n.id, n.full_name as string]));

  // All approved members (for starting new conversations), minus me.
  const { data: directory } = await supabase
    .from("member_names")
    .select("id, full_name")
    .neq("id", me)
    .order("full_name");

  // Messages across my chats + the broadcast channel (for previews + unread).
  const relevantIds = [...myChatIds, broadcast?.id].filter(Boolean) as string[];
  const { data: msgs } = relevantIds.length
    ? await supabase
        .from("messages")
        .select("chat_id, sender_id, body, created_at")
        .in("chat_id", relevantIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMsg = new Map<string, { body: string; created_at: string }>();
  const unread = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!lastMsg.has(m.chat_id)) {
      lastMsg.set(m.chat_id, { body: m.body, created_at: m.created_at });
    }
    const lr = lastRead.get(m.chat_id);
    if (lr && m.created_at > lr && m.sender_id !== me) {
      unread.set(m.chat_id, (unread.get(m.chat_id) ?? 0) + 1);
    }
  }

  const membersByChat = new Map<string, string[]>();
  for (const m of allMembers ?? []) {
    const arr = membersByChat.get(m.chat_id) ?? [];
    arr.push(m.profile_id);
    membersByChat.set(m.chat_id, arr);
  }

  function label(chat: { id: string; type: string; title: string | null }): string {
    if (chat.type === "broadcast") return "Announcements";
    if (chat.type === "group") return chat.title ?? "Group chat";
    const others = (membersByChat.get(chat.id) ?? []).filter((p) => p !== me);
    return others.map((p) => nameMap.get(p) ?? "Member").join(", ") || "Direct message";
  }

  const conversations: Conversation[] = [
    ...(myChats ?? []).map((c) => ({
      id: c.id,
      type: c.type as Conversation["type"],
      name: label(c),
      lastMessage: lastMsg.get(c.id)?.body ?? null,
      lastAt: lastMsg.get(c.id)?.created_at ?? null,
      unread: unread.get(c.id) ?? 0,
    })),
  ];

  if (broadcast) {
    conversations.unshift({
      id: broadcast.id,
      type: "broadcast",
      name: "Announcements",
      lastMessage: lastMsg.get(broadcast.id)?.body ?? null,
      lastAt: lastMsg.get(broadcast.id)?.created_at ?? null,
      unread: 0,
    });
  }

  conversations.sort((a, b) => {
    if (a.type === "broadcast") return -1;
    if (b.type === "broadcast") return 1;
    return (b.lastAt ?? "").localeCompare(a.lastAt ?? "");
  });

  return (
    <>
      <SiteHeader />
      <MessagesClient
        me={me}
        myName={nameMap.get(me) ?? "You"}
        isSuperAdmin={isSuperAdmin}
        conversations={conversations}
        directory={(directory ?? []) as MemberName[]}
      />
    </>
  );
}
