"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DuesState = { error?: string; message?: string };

/**
 * Super-admin only: set the annual dues amount for a given year. RLS on
 * annual_dues also enforces this at the database, but we check in code too.
 */
export async function setDuesAmount(
  _prev: DuesState,
  formData: FormData,
): Promise<DuesState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "super_admin") return { error: "Not authorized." };

  const year = Number(formData.get("year"));
  const amount = Number(formData.get("amount"));
  if (!Number.isInteger(year) || year < 1955 || year > 2100) {
    return { error: "Enter a valid year." };
  }
  if (!(amount > 0) || amount > 100000000) {
    return { error: "Enter a valid amount." };
  }

  const { error } = await supabase.from("annual_dues").upsert(
    { year, amount, updated_at: new Date().toISOString(), updated_by: user.id },
    { onConflict: "year" },
  );
  if (error) return { error: error.message };

  revalidatePath("/donations/dues");
  return { message: `Dues for ${year} set to ${amount.toLocaleString()} NGN.` };
}
