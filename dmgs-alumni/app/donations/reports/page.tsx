import { redirect } from "next/navigation";

/** Giving reports live in Manage → Giving reports now. */
export default function ReportsRedirect() {
  redirect("/admin?tab=giving");
}
