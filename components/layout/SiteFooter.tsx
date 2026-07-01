import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="texture-diagonal mt-20 bg-emerald-900 px-8 pb-6 pt-12 text-cream">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 border-b border-white/10 pb-8 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
            Old Students Association
          </h5>
          <p className="max-w-md text-[14px] leading-7 opacity-80">
            Connecting alumni of Doherty Memorial Grammar School, Ijero-Ekiti,
            across Nigeria and the diaspora. Founded 1955.
          </p>
        </div>
        <div>
          <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
            Community
          </h5>
          <ul className="list-none space-y-1 text-[14px]">
            <li>
              <Link href="/directory" className="text-cream/80 hover:text-gold-400">
                Alumni Directory
              </Link>
            </li>
            <li>
              <Link href="/events" className="text-cream/80 hover:text-gold-400">
                Events
              </Link>
            </li>
            <li>
              <Link href="/donations" className="text-cream/80 hover:text-gold-400">
                Giving
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-400">
            Account
          </h5>
          <ul className="list-none space-y-1 text-[14px]">
            <li>
              <Link href="/login" className="text-cream/80 hover:text-gold-400">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-cream/80 hover:text-gold-400">
                Request membership
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] justify-between pt-6 font-sans text-[12px] tracking-[0.04em] opacity-60">
        <span>© {new Date().getFullYear()} DMGS Old Students Association</span>
        <span>Ijero-Ekiti · Nigeria</span>
      </div>
    </footer>
  );
}
