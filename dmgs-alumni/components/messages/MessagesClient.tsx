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
  initialActiveId = null,
  initialDraft = "",
}: {
  initialActiveId?: string | null;
  initialDraft?: string;
  me: string;
  myName: string;
  isSuperAdmin: boolean;
  conversations: Conversation[];
  directory: MemberName[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState(initialDraft);
  const [showNew, setShowNew] = useState(false);
  const [sending, setSending] = useState(false);
  // Scroll the message list itself, never the page: scrollIntoView() would
  // also scroll the window down to the thread.
  const listRef = useRef<HTMLDivElement>(null);

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
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, activeId]);

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

  const KIND: Record<Conversation["type"], string> = {
    broadcast: "Association announcements",
    group: "Group",
    direct: "Direct message",
  };

  function when(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return timeOf(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <main className="m-app">
      <div className="m-wrap m-body">
        <div className={`m-card m-msgs ${activeId ? "open" : ""}`}>
          <aside className="m-convos">
            <div className="top">
              <h1>Messages</h1>
              <button type="button" onClick={() => setShowNew(true)} className="m-btn m-btn-line m-btn-sm">
                New
              </button>
            </div>
            <div className="list">
              {conversations.length === 0 ? (
                <p className="m-empty">No conversations yet. Start one with New, or from a profile in the directory.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="c"
                    aria-current={activeId === c.id}
                    onClick={() => openConversation(c.id)}
                  >
                    <span
                      className="m-avatar"
                      style={{
                        width: 40,
                        height: 40,
                        fontSize: 14,
                        flexShrink: 0,
                        borderRadius: c.type === "direct" ? "50%" : 2,
                        background: c.type === "broadcast" ? "#c9973f" : c.type === "group" ? "#1f6a52" : "#0e3b2e",
                        color: c.type === "broadcast" ? "#10231c" : "#fff",
                      }}
                    >
                      {c.type === "broadcast" ? "OSA" : initials(c.name)}
                    </span>
                    <span className="meta">
                      <span className="tp">
                        <b>{c.name}</b>
                        <small>{when(c.lastAt)}</small>
                      </span>
                      <i>{KIND[c.type]}</i>
                      <span className="tp">
                        <span className="pv">{c.lastMessage ?? "No messages yet"}</span>
                        {c.unread > 0 && <span className="unread">{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="m-thread">
            {active ? (
              <>
                <div className="top">
                  <button type="button" className="back" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                    ‹
                  </button>
                  <div>
                    <h2>{active.name}</h2>
                    <span style={{ fontSize: 13, color: "var(--m-muted)" }}>
                      {active.type === "broadcast" ? (isSuperAdmin ? "Announcements · you can post" : "Announcements") : KIND[active.type]}
                    </span>
                  </div>
                </div>

                <div className="list" ref={listRef}>
                  {messages.length === 0 && (
                    <p style={{ color: "var(--m-muted)" }}>
                      {active.type === "direct"
                        ? `Start your conversation with ${active.name.split(" ")[0]}. Messages stay on the site; your email is never shown.`
                        : "No messages yet."}
                    </p>
                  )}
                  {messages.map((m, i) => {
                    const mine = m.sender_id === me;
                    const showDay = i === 0 || dayOf(m.created_at) !== dayOf(messages[i - 1].created_at);
                    return (
                      <div key={m.id} style={{ display: "contents" }}>
                        {showDay && (
                          <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--m-faint)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                            {dayOf(m.created_at)}
                          </div>
                        )}
                        <div className={`m-bubble ${mine ? "me" : ""}`}>
                          <small>
                            {mine ? "You" : nameMap.get(m.sender_id ?? "") ?? "Member"} · {timeOf(m.created_at)}
                          </small>
                          <div>{m.body}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {readOnly ? (
                  <div className="m-readonly">Only association administrators can post announcements.</div>
                ) : (
                  <form onSubmit={send} className="m-compose">
                    <label className="m-sr" htmlFor="msg">Message</label>
                    <input
                      id="msg"
                      className="m-input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Write a message"
                      autoComplete="off"
                    />
                    <button type="submit" disabled={sending || !draft.trim()} className="m-btn m-btn-primary">
                      Send
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div className="m-empty" style={{ margin: "auto" }}>
                Select a conversation, or start a new one.
              </div>
            )}
          </section>
        </div>
      </div>

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
