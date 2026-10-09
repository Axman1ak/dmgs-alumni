import { redirect } from "next/navigation";

export default function NewProjectRedirect() {
  redirect("/admin?tab=projects&edit=new");
}
