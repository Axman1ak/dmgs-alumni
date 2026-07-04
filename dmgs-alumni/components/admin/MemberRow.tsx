"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { setMemberRole, type AdminState } from "@/app/admin/actions";

const initial: AdminState = {};

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  class_year: number | null;
  admin_of_year: number | null;
};

export function MemberRow({ member }: { member: Member }) {
  const [state, action] = useFormState(setMemberRole, initial);
  const [role, setRole] = useState(member.role);

  return (
    <form
      action={action}
      className="grid grid-cols-1 items-center gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]"
    >
      <input type="hidden" name="id" value={member.id} />

      <div>
        <p className="font-display text-[17px] font-semibold text-emerald-900">
          {member.full_name}
        </p>
        <p className="font-sans text-[12px] text-ink-muted">{member.email ?? "—"}</p>
        {state.error && <p className="font-sans text-[11px] text-danger">{state.error}</p>}
        {state.message && <p className="font-sans text-[11px] text-success">{state.message}</p>}
      </div>

      <select
        name="role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-sm border border-border bg-paper px-2.5 py-2 font-sans text-[13px]"
      >
        <option value="member">Member</option>
        <option value="class_admin">Class admin</option>
        <option value="super_admin">Super admin</option>
      </select>

      <input
        name="class_year"
        type="number"
        placeholder="Class yr"
        defaultValue={member.class_year ?? ""}
        className="rounded-sm border border-border bg-paper px-2.5 py-2 font-sans text-[13px]"
      />

      <input
        name="admin_year"
        type="number"
        placeholder="Admin yr"
        defaultValue={member.admin_of_year ?? ""}
        disabled={role !== "class_admin"}
        className="rounded-sm border border-border bg-paper px-2.5 py-2 font-sans text-[13px] disabled:opacity-40"
      />

      <button type="submit" className="btn btn-primary px-4 py-2 text-[12px]">
        Save
      </button>
    </form>
  );
}
