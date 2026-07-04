"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";

const NAV = [
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/messages", label: "Messages" },
  { href: "/donations", label: "Giving" },
];

export function HeaderNav({
  signedIn,
  initials,
  isSuperAdmin = false,
}: {
  signedIn: boolean;
  initials: string;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navItems = isSuperAdmin
    ? [...NAV, { href: "/admin", label: "Admin" }]
    : NAV;
  const [menuOpen, setMenuOpen] = useState(false); // user dropdown
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close menus on navigation.
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  if (!signedIn) {
    return (
      <nav className="ml-auto flex items-center">
        <Link href="/login" className="btn btn-primary">
          Member sign in
        </Link>
      </nav>
    );
  }

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Desktop nav */}
      <nav className="ml-auto hidden items-center gap-1 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-4 py-2.5 font-sans text-[13px] font-medium uppercase tracking-[0.04em] transition-colors ${
              active(item.href) ? "text-emerald-900" : "text-ink-soft hover:text-emerald-900"
            }`}
          >
            {item.label}
          </Link>
        ))}

        {/* User dropdown */}
        <div className="relative ml-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-full bg-emerald-900 py-1.5 pl-3.5 pr-1.5 font-sans text-[13px] text-cream"
          >
            {initials || "—"}
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-gold-500 text-[12px] font-semibold text-emerald-900">
              {initials || "?"}
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded border border-border bg-cream shadow-lg">
              <Link
                href="/account"
                className="block px-4 py-3 font-sans text-[13px] text-ink-soft hover:bg-cream-dark hover:text-emerald-900"
              >
                My profile
              </Link>
              <form action={signOut} className="border-t border-border">
                <button
                  type="submit"
                  className="block w-full px-4 py-3 text-left font-sans text-[13px] text-danger hover:bg-cream-dark"
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
        className="ml-auto flex h-10 w-10 items-center justify-center md:hidden"
      >
        <div className="space-y-1.5">
          <span className={`block h-0.5 w-6 bg-emerald-900 transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-emerald-900 transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-emerald-900 transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </div>
      </button>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-cream shadow-lg md:hidden">
          <nav className="flex flex-col px-6 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b border-border/60 py-3.5 font-sans text-[14px] uppercase tracking-[0.04em] ${
                  active(item.href) ? "text-emerald-900" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/account" className="border-b border-border/60 py-3.5 font-sans text-[14px] uppercase tracking-[0.04em] text-ink-soft">
              My profile
            </Link>
            <form action={signOut}>
              <button type="submit" className="w-full py-3.5 text-left font-sans text-[14px] uppercase tracking-[0.04em] text-danger">
                Sign out
              </button>
            </form>
          </nav>
        </div>
      )}
    </>
  );
}
