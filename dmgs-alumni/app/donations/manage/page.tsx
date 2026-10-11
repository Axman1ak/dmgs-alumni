import { redirect } from "next/navigation";

/** Projects are managed inside Manage → Projects now. */
export default function ManageProjectsRedirect() {
  redirect("/admin?tab=projects");
}
