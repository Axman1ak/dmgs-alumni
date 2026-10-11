"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";

const NAV = [
  { href: "/home", label: "Home" },
  { href: "/donations", label: "Give" },
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/messages", label: "Messages" },
];

export function HeaderNav({
  signedIn,
  initials,
  isSuperAdmin = false,
  isAdmin = false,
  pendingCount = 0,
  unread = 0,
}: {
  signedIn: boolean;
  initials: string;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  pendingCount?: number;
  unread?: number;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  if (!signedIn) {
    return (
      <nav style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <Link href="/login" className="m-btn m-btn-line m-btn-sm">Sign in</Link>
        <Link href="/signup" className="m-btn m-btn-primary m-btn-sm"><span className="m-join-long">Become a member</span><span className="m-join-short">Join</span></Link>
      </nav>
    );
  }

  // Super admins manage members; class admins only see giving reports.
  const manageHref = isSuperAdmin ? "/admin" : isAdmin ? "/admin?tab=giving" : null;
  const onManage = pathname.startsWith("/admin") || pathname.startsWith("/donations/reports") || pathname.startsWith("/donations/manage");

  const active = (href: string) => {
    if (href === "/donations") return pathname.startsWith("/donations") && !onManage;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const count = (href: string) =>
    href === "/messages" && unread > 0 ? (
      <span className="m-badge" aria-label={`${unread} unread`}>{unread > 99 ? "99+" : unread}</span>
    ) : null;

  return (
    <>
      <nav className="m-nav" aria-label="Member">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={active(item.href) ? "on" : ""} aria-current={active(item.href) ? "page" : undefined}>
            {item.label}
            {count(item.href)}
          </Link>
        ))}
      </nav>

      {manageHref && (
        <Link href={manageHref} className="m-manage" style={onManage ? { borderColor: "var(--m-emerald)", color: "var(--m-emerald)" } : undefined}>
          Manage
          {pendingCount > 0 && <span className="m-badge">{pendingCount}</span>}
        </Link>
      )}

      <div className="m-user" ref={menuRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Account menu"
          className="m-avatar"
          style={{ width: 40, height: 40, fontSize: 15, border: 0, cursor: "pointer" }}
        >
          {initials || "?"}
        </button>
        {menuOpen && (
          <div className="m-menu">
            <Link href="/account">My profile</Link>
            <form action={signOut} style={{ borderTop: "1px solid var(--m-line)" }}>
              <button type="submit" style={{ color: "#8a2a2a" }}>Sign out</button>
            </form>
          </div>
        )}
      </div>

      <button type="button" className="m-burger" onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen} aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d={mobileOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
        </svg>
      </button>

      {mobileOpen && (
        <div className="m-mobile" style={{ position: "absolute", left: 0, right: 0, top: "100%", boxShadow: "0 12px 30px rgba(16,35,28,.12)" }}>
          <div className="m-wrap" style={{ paddingBlock: 8 }}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} style={active(item.href) ? { color: "var(--m-emerald)" } : undefined}>
                {item.label}
                {count(item.href)}
              </Link>
            ))}
            {manageHref && (
              <Link href={manageHref}>
                Manage {pendingCount > 0 && <span className="m-badge">{pendingCount}</span>}
              </Link>
            )}
            <Link href="/account">My profile</Link>
            <form action={signOut}>
              <button type="submit" style={{ color: "#8a2a2a", borderBottom: 0 }}>Sign out</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
