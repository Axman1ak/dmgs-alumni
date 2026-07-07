"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, MemberName, ChatMessage } from "./types";
import { NewConversation } from "./NewConversation";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function MessagesClient({
  me,
  myName,
  isSuperAdmin,
  conversations: initialConversations,
  directory,
}: {
  me: string;
  myName: string;
  isSuperAdmin: boolean;
  conversations: Conversation[];
  directory: MemberName[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>([[me, myName]]);
    directory.forEach((d) => m.set(d.id, d.full_name));
    return m;
  }, [directory, me, myName]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const readOnly = active?.type === "broadcast" && !isSuperAdmin;

  const markRead = useCallback(
    async (chatId: string) => {
      await supabase
        .from("chat_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("chat_id", chatId)
        .eq("profile_id", me);
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
      );
    },
    [supabase, me],
  );

  // Load messages + subscribe to realtime whenever the active chat changes.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, chat_id, sender_id, body, created_at")
        .eq("chat_id", activeId)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((data ?? []) as ChatMessage[]);
    })();

    markRead(activeId);

    const channel = supabase
      .channel(`chat:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
          if (msg.sender_id !== me) markRead(activeId);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [activeId, supabase, me, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId || readOnly) return;
    setSending(true);
    setDraft("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ chat_id: activeId, sender_id: me, body })
      .select("id, chat_id, sender_id, body, created_at")
      .single();
    if (!error && data) {
      const msg = data as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, lastMessage: body, lastAt: msg.created_at } : c,
        ),
      );
    } else if (error) {
      setDraft(body);
    }
    setSending(false);
  }

  function openConversation(id: string, injected?: Conversation) {
    if (injected && !conversations.some((c) => c.id === injected.id)) {
      setConversations((prev) => [...prev, injected]);
    }
    setActiveId(id);
  }

  return (
    <main className="mx-auto grid h-[calc(100vh-160px)] max-h-[820px] max-w-[1280px] grid-cols-1 overflow-hidden border border-border bg-cream md:mt-4 md:grid-cols-[320px_1fr]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-border bg-paper ${
          activeId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-[24px] font-semibold text-emerald-900">Messages</h2>
          <button onClick={() => setShowNew(true)} className="btn btn-gold px-3 py-2 text-[11px]">
            + New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-5 py-8 text-center font-sans text-[13px] text-ink-muted">
              No conversations yet. Start one with “+ New”.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`grid w-full grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-border/50 px-5 py-3.5 text-left transition-colors hover:bg-cream-dark ${
                  activeId === c.id ? "bg-cream-dark" : ""
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-[15px] font-semibold ${
                    c.type === "broadcast"
                      ? "bg-gold-500 text-emerald-900"
                      : c.type === "group"
                        ? "bg-gold-500 text-emerald-900"
                        : "bg-emerald-900 text-gold-400"
                  }`}
                >
                  {c.type === "broadcast" ? "📣" : initials(c.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[16px] font-semibold text-emerald-900">
                    {c.name}
                  </span>
                  <span className="block truncate font-sans text-[12px] text-ink-muted">
                    {c.lastMessage ?? "No messages yet"}
                  </span>
                </span>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 font-sans text-[11px] font-semibold text-emerald-900">
                    {c.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-border bg-cream px-5 py-4">
              <button
                onClick={() => setActiveId(null)}
                className="font-sans text-[20px] text-ink-muted md:hidden"
                aria-label="Back"
              >
                ‹
              </button>
              <h3 className="font-display text-[20px] font-semibold text-emerald-900">
                {active.name}
              </h3>
              {active.type === "broadcast" && (
                <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                  {isSuperAdmin ? "You can post" : "Read only"}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto bg-paper px-5 py-6">
              {messages.map((m, i) => {
                const mine = m.sender_id === me;
                const showDay =
                  i === 0 || dayOf(m.created_at) !== dayOf(messages[i - 1].created_at);
                return (
                  <div key={m.id}>
                    {showDay && (
                      <div className="my-4 text-center font-sans text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                        {dayOf(m.created_at)}
                      </div>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${mine ? "text-right" : "text-left"}`}>
                        {!mine && active.type !== "direct" && (
                          <span className="mb-0.5 block font-sans text-[11px] text-ink-muted">
                            {nameMap.get(m.sender_id ?? "") ?? "Member"}
                          </span>
                        )}
                        <span
                          className={`inline-block rounded-lg px-3.5 py-2 text-[15px] ${
                            mine
                              ? "bg-emerald-900 text-cream"
                              : "border border-border bg-cream text-ink"
                          }`}
                        >
                          {m.body}
                        </span>
                        <span className="mt-0.5 block font-sans text-[10px] text-ink-muted">
                          {timeOf(m.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {readOnly ? (
              <div className="border-t border-border bg-cream px-5 py-4 text-center font-sans text-[13px] text-ink-muted">
                Only administrators can post to the announcements channel.
              </div>
            ) : (
              <form onSubmit={send} className="flex gap-3 border-t border-border bg-cream px-5 py-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="field-input flex-1"
                />
                <button type="submit" disabled={sending} className="btn btn-primary disabled:opacity-60">
                  Send
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <p className="font-display text-[22px] text-ink-soft">
              Select a conversation, or start a new one.
            </p>
          </div>
        )}
      </section>

      {showNew && (
        <NewConversation
          me={me}
          directory={directory}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setShowNew(false)}
          onOpen={(id, convo) => {
            setShowNew(false);
            openConversation(id, convo);
          }}
        />
      )}
    </main>
  );
}
