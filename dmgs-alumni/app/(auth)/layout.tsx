import Link from "next/link";
import { Crest } from "@/components/ui/Crest";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="m-app" style={{ display: "flex", minHeight: "100vh", flexDirection: "column" }}>
      <header className="m-head" style={{ position: "static" }}>
        <div className="m-wrap m-head-in">
          <Link href="/" className="m-brand">
            <Crest size={42} />
            <span>DMGS Old Students</span>
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        {children}
      </main>
    </div>
  );
}
