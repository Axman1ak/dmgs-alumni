import { redirect } from "next/navigation";

// Dues now live as a section on the main Donations page.
export default function DuesRedirect() {
  redirect("/donations");
}
