import { redirect } from "next/navigation";

export default function EditProjectRedirect({ params }: { params: { slug: string } }) {
  redirect(`/admin?tab=projects&edit=${encodeURIComponent(params.slug)}`);
}
