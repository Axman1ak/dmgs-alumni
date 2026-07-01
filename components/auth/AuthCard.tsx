import { Crest } from "@/components/ui/Crest";

/** Centered auth card with the gold/emerald top rule, matching the prototype. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full max-w-[460px] border border-border bg-cream px-12 py-14 shadow-soft">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-900 to-gold-500" />
      <div className="mx-auto mb-6 flex justify-center">
        <Crest size={72} />
      </div>
      <h2 className="mb-2 text-center font-display text-[34px] font-medium tracking-[-0.01em] text-emerald-900">
        {title}
      </h2>
      <p className="mb-9 text-center font-sans text-[14px] text-ink-muted">
        {subtitle}
      </p>
      {children}
    </div>
  );
}

export function FormNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-danger/60 bg-danger/5 text-danger"
      : "border-emerald-700 bg-emerald-700/5 text-ink-soft";
  return (
    <div
      className={`mb-6 rounded-sm border-l-[3px] px-3.5 py-3 text-[13px] ${styles}`}
    >
      {children}
    </div>
  );
}
