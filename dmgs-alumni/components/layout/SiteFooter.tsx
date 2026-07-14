export function SiteFooter() {
  return (
    <footer className="texture-diagonal mt-20 bg-emerald-900 px-5 sm:px-8 pb-6 pt-12 text-cream">
      <div className="mx-auto max-w-[1280px] border-b border-white/10 pb-8">
        <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
          Old Students Association
        </h5>
        <p className="max-w-md text-[14px] leading-7 opacity-80">
          Connecting old students of Doherty Memorial Grammar School,
          Ijero-Ekiti, across Nigeria and the diaspora. Founded 1955.
        </p>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-2 pt-6 font-sans text-[12px] tracking-[0.04em] opacity-60">
        <span>© {new Date().getFullYear()} DMGS Old Students Association</span>
        <span>Ijero-Ekiti · Nigeria</span>
      </div>
    </footer>
  );
}
