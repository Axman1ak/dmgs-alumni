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
      await supabase.rpc("mark_chat_read", { p_chat: chatId });
      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)),
      );
    },
    [supabase],
  );

  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [activeId]);

  async function deleteConversation() {
    if (!active || active.type === "broadcast") return;
    const ok = window.confirm(
      `Delete this conversation with ${active.name}? It disappears from your messages. ` +
        "The other person keeps their copy, and a new message will bring it back.",
    );
    if (!ok) return;
    setMenuOpen(false);
    const { error } = await supabase.rpc("clear_chat", { p_chat: active.id });
    if (error) {
      window.alert("Could not delete the conversation. Please try again.");
      return;
    }
    setConversations((prev) => prev.filter((c) => c.id !== active.id));
    setActiveId(null);
    setMessages([]);
  }

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
      const cleared = conversations.find((c) => c.id === activeId)?.clearedAt ?? null;
      const rows = (data ?? []) as ChatMessage[];
      if (!cancelled) setMessages(cleared ? rows.filter((m) => m.created_at > cleared) : rows);
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
                  {active.type !== "broadcast" && (
                    <div className="m-thread-menu">
                      <button
                        type="button"
                        className="gear"
                        aria-label="Conversation settings"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </button>
                      {menuOpen && (
                        <div className="pop" role="menu">
                          <button type="button" role="menuitem" onClick={deleteConversation}>
                            Delete conversation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
