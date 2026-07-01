import Link from "next/link";
import { Crest } from "@/components/ui/Crest";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-cream">
        <div className="mx-auto flex max-w-[1280px] items-center px-8 py-5">
          <Link href="/" className="flex items-center gap-3.5 no-underline">
            <Crest size={44} />
            <span className="font-display text-[20px] font-semibold text-emerald-900">
              Old Students Association
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
