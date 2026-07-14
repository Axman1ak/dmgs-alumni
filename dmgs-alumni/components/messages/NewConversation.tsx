"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, MemberName } from "./types";

export function NewConversation({
  me,
  directory,
  onClose,
  onOpen,
}: {
  me: string;
  directory: MemberName[];
  isSuperAdmin: boolean;
  onClose: () => void;
  onOpen: (id: string, convo: Conversation) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"direct" | "group">("direct");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MemberName[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory
      .filter((d) => (q ? d.full_name.toLowerCase().includes(q) : true))
      .slice(0, 30);
  }, [directory, query]);

  async function startDirect(member: MemberName) {
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("get_or_create_direct_chat", {
      p_other: member.id,
    });
    setBusy(false);
    if (error || !data) {
      setError(error?.message ?? "Could not start conversation.");
      return;
    }
    onOpen(data as string, {
      id: data as string,
      type: "direct",
      name: member.full_name,
      lastMessage: null,
      lastAt: null,
      unread: 0,
    });
  }

  function toggle(member: MemberName) {
    setSelected((prev) =>
      prev.some((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member],
    );
  }

  async function createGroup() {
    if (!title.trim() || selected.length === 0) {
      setError("Add a name and at least one member.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data: chat, error: chatErr } = await supabase
      .from("chats")
      .insert({ type: "group", title: title.trim(), created_by: me })
      .select("id")
      .single();
    if (chatErr || !chat) {
      setBusy(false);
      setError(chatErr?.message ?? "Could not create group.");
      return;
    }
    const rows = [
      { chat_id: chat.id, profile_id: me },
      ...selected.map((m) => ({ chat_id: chat.id, profile_id: m.id })),
    ];
    const { error: memErr } = await supabase.from("chat_members").insert(rows);
    setBusy(false);
    if (memErr) {
      setError(memErr.message);
      return;
    }
    onOpen(chat.id, {
      id: chat.id,
      type: "group",
      name: title.trim(),
      lastMessage: null,
      lastAt: null,
      unread: 0,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded border border-border bg-paper shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-[22px] font-semibold text-emerald-900">New conversation</h3>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted">✕</button>
        </div>

        <div className="flex gap-1 border-b border-border px-6">
          {(["direct", "group"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative px-4 py-3 font-sans text-[13px] uppercase tracking-[0.06em] ${
                mode === m ? "text-emerald-900" : "text-ink-muted"
              }`}
            >
              {m === "direct" ? "Direct" : "Group"}
              {mode === m && <span className="absolute inset-x-4 bottom-[-1px] h-0.5 bg-gold-500" />}
            </button>
          ))}
        </div>

        <div className="px-6 py-4">
          {error && <p className="mb-3 font-sans text-[12px] text-danger">{error}</p>}

          {mode === "group" && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Group name (e.g. Class of '82)"
              className="field-input mb-3"
            />
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className="field-input mb-3"
          />

          {mode === "group" && selected.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {selected.map((m) => (
                <span key={m.id} className="rounded-full bg-emerald-900 px-2.5 py-1 font-sans text-[11px] text-cream">
                  {m.full_name} ✕
                </span>
              ))}
            </div>
          )}

          <div className="max-h-[45vh] overflow-y-auto rounded border border-border sm:max-h-[280px]">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center font-sans text-[13px] text-ink-muted">No members found.</p>
            ) : (
              results.map((m) => {
                const isSel = selected.some((s) => s.id === m.id);
                return (
                  <button
                    key={m.id}
                    disabled={busy}
                    onClick={() => (mode === "direct" ? startDirect(m) : toggle(m))}
                    className={`flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left last:border-b-0 hover:bg-cream-dark ${
                      isSel ? "bg-emerald-900/5" : ""
                    }`}
                  >
                    <span className="font-display text-[16px] font-semibold text-emerald-900">
                      {m.full_name}
                    </span>
                    {mode === "group" && isSel && (
                      <span className="font-sans text-[11px] uppercase tracking-[0.1em] text-gold-500">Added</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {mode === "group" && (
            <button onClick={createGroup} disabled={busy} className="btn btn-primary mt-4 w-full justify-center disabled:opacity-60">
              {busy ? "Creating…" : "Create group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
