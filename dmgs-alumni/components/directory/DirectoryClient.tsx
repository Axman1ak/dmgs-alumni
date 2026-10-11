"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CONNECT, INDUSTRIES, INTERESTS, initials, safeUrl, type Person } from "@/lib/options";

type Tab = "all" | "members" | "class";
const PAGE = 50;

function nameExtra(p: Person) {
  const bits = [p.maiden_name ? `née ${p.maiden_name}` : "", p.former_name ? `formerly ${p.former_name}` : ""].filter(Boolean);
  return bits.length ? <small>{bits.join(" · ")}</small> : null;
}

function Avatar({ p, size }: { p: Person; size: number }) {
  return (
    <span className={`m-avatar ${p.profile_id ? "" : "off"}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.photo_url ? <img src={p.photo_url} alt="" /> : initials(p.full_name)}
    </span>
  );
}

function ConnectBadge({ p }: { p: Person }) {
  if (!p.profile_id)
    return (
      <span className="m-pill" style={{ color: "#7a7f83" }}>
        <span className="m-dot" />
        Not yet joined
      </span>
    );
  if (p.connect_pref === "mentor") return <span className="m-chip gold">Mentor</span>;
  if (p.connect_pref === "network") return <span className="m-chip">Networking</span>;
  return (
    <span className="m-pill" style={{ color: "#1f6a52" }}>
      <span className="m-dot" />
      Member
    </span>
  );
}

export function DirectoryClient({
  people,
  me,
  myClass,
  initialClass,
  initialPerson,
  initialQuery,
}: {
  people: Person[];
  me: string;
  myClass: number | null;
  initialClass: string;
  initialPerson: string | null;
  initialQuery: string;
}) {
  const [tab, setTab] = useState<Tab>(initialClass && String(myClass) === initialClass ? "class" : "all");
  const [q, setQ] = useState(initialQuery);
  const [fYear, setFYear] = useState(initialClass && String(myClass) !== initialClass ? initialClass : "");
  const [fCountry, setFCountry] = useState("");
  const [fIndustry, setFIndustry] = useState("");
  const [fInterest, setFInterest] = useState("");
  // Suggested interests plus any a member typed in themselves.
  const interestOptions = useMemo(() => {
    const extra = new Set<string>();
    people.forEach((p) => (p.interests ?? []).forEach((i) => { if (!(INTERESTS as readonly string[]).includes(i)) extra.add(i); }));
    return [...INTERESTS, ...Array.from(extra).sort((a, b) => a.localeCompare(b))];
  }, [people]);
  const [fMentor, setFMentor] = useState(false);
  const [selId, setSelId] = useState<string | null>(initialPerson);
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState("");

  const years = useMemo(() => Array.from(new Set(people.map((p) => p.class_year).filter(Boolean) as number[])).sort((a, b) => a - b), [people]);
  const countries = useMemo(() => Array.from(new Set(people.map((p) => p.country).filter(Boolean) as string[])).sort(), [people]);
  const memberCount = useMemo(() => people.filter((p) => p.profile_id).length, [people]);
  const classCount = useMemo(() => (myClass ? people.filter((p) => p.class_year === myClass).length : 0), [people, myClass]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return people.filter((p) => {
      if (tab === "members" && !p.profile_id) return false;
      if (tab === "class" && (!myClass || p.class_year !== myClass)) return false;
      if (fYear && String(p.class_year) !== fYear) return false;
      if (fCountry && p.country !== fCountry) return false;
      if (fIndustry && p.industry !== fIndustry) return false;
      if (fInterest && !(p.interests ?? []).includes(fInterest)) return false;
      if (fMentor && p.connect_pref !== "mentor") return false;
      if (!needle) return true;
      return [p.full_name, p.first_name, p.last_name, p.maiden_name, p.former_name, p.job_title, p.employer, p.industry, p.state, p.country, p.class_year ? String(p.class_year) : "", ...(p.interests ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [people, q, tab, myClass, fYear, fCountry, fIndustry, fInterest, fMentor]);

  useEffect(() => setPage(0), [q, tab, fYear, fCountry, fIndustry, fInterest, fMentor]);

  const sel = selId ? people.find((p) => p.id === selId) ?? null : null;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const anyFilter = q || fYear || fCountry || fIndustry || fInterest || fMentor || tab !== "all";

  function clearAll() {
    setQ("");
    setFYear("");
    setFCountry("");
    setFIndustry("");
    setFInterest("");
    setFMentor(false);
    setTab("all");
  }

  async function copyInvite() {
    const link = `${window.location.origin}/signup`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(`Link copied: ${link}`);
    } catch {
      setCopied(`Copy this link: ${link}`);
    }
  }

  function open(id: string) {
    setCopied("");
    setSelId((cur) => (cur === id ? null : id));
    if (window.innerWidth <= 1080) setTimeout(() => document.getElementById("person-panel")?.scrollIntoView({ block: "start" }), 30);
  }

  const tabs: [Tab, string, string][] = [
    ["all", "All old students", String(people.length)],
    ["members", "Members", String(memberCount)],
    ...(myClass ? ([["class", `My class · ${myClass}`, String(classCount)]] as [Tab, string, string][]) : []),
  ];

  return (
    <>
      <section className="m-page-head tabs">
        <div className="m-wrap">
          <h1>Directory</h1>
          <div className="m-tablist" role="tablist">
            {tabs.map(([k, label, c]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {label} <span className="c">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="m-wrap m-body">
        <div className={`m-dir ${sel ? "has-sel" : ""}`}>
          <section className="m-card">
            <div className="m-filters">
              <div className="search">
                <label className="m-sr" htmlFor="dir-q">Search</label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5b6166" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" />
                </svg>
                <input id="dir-q" className="m-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, maiden name, employer, job title…" autoComplete="off" />
              </div>
              <select className="m-input" aria-label="Class" value={fYear} onChange={(e) => setFYear(e.target.value)}>
                <option value="">All classes</option>
                {years.map((y) => (
                  <option key={y} value={y}>Class of {y}</option>
                ))}
              </select>
              <select className="m-input" aria-label="Country" value={fCountry} onChange={(e) => setFCountry(e.target.value)}>
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className="m-input" aria-label="Industry" value={fIndustry} onChange={(e) => setFIndustry(e.target.value)}>
                <option value="">All industries</option>
                {INDUSTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select className="m-input" aria-label="Area of interest" value={fInterest} onChange={(e) => setFInterest(e.target.value)}>
                <option value="">All interests</option>
                {interestOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button type="button" className="m-toggle" aria-pressed={fMentor} onClick={() => setFMentor((v) => !v)}>
                <span className="tr" />
                Open to mentoring
              </button>
            </div>

            <div className="m-trow m-thead">
              <span>Name</span>
              <span className="h1">Class</span>
              <span className="h2">Job title</span>
              <span className="h3">Location</span>
              <span>Connect</span>
            </div>

            {shown.length === 0 ? (
              <div className="m-empty">
                No old students match these filters.{" "}
                {anyFilter && (
                  <button type="button" className="m-link" onClick={clearAll}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              shown.map((p) => (
                <button key={p.id} type="button" className="m-trow" aria-current={selId === p.id} onClick={() => open(p.id)}>
                  <span className="m-who">
                    <Avatar p={p} size={36} />
                    <span style={{ minWidth: 0 }}>
                      {p.full_name}
                      {nameExtra(p)}
                    </span>
                  </span>
                  <span className="h1">{p.class_year ?? <span className="m-dim">–</span>}</span>
                  <span className={`h2 ${p.job_title ? "" : "m-dim"}`}>
                    {p.job_title ? (
                      <>
                        {p.job_title}
                        {p.employer && <small>{p.employer}</small>}
                      </>
                    ) : (
                      "Not added yet"
                    )}
                  </span>
                  <span className={`h3 ${p.country ? "" : "m-dim"}`}>{p.country ? [p.state, p.country].filter(Boolean).join(", ") : "Not added yet"}</span>
                  <span>
                    <ConnectBadge p={p} />
                  </span>
                </button>
              ))
            )}

            <div className="m-pager">
              <span>
                {filtered.length === 0 ? "0 results" : `${page * PAGE + 1}–${Math.min(filtered.length, (page + 1) * PAGE)} of ${filtered.length}`}
              </span>
              {pages > 1 && (
                <span style={{ display: "flex", gap: 8 }}>
                  <button type="button" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>Previous</button>
                  <button type="button" disabled={page >= pages - 1} onClick={() => setPage((n) => n + 1)}>Next</button>
                </span>
              )}
            </div>
          </section>

          {sel && (
            <aside className="m-card m-side" id="person-panel" aria-live="polite">
              <div className="head">
                <button type="button" className="close" aria-label="Close profile" onClick={() => setSelId(null)}>
                  ×
                </button>
                <Avatar p={sel} size={96} />
                <h2 style={{ fontSize: 24, color: "var(--m-emerald)" }}>{sel.full_name}</h2>
                {nameExtra(sel)}
                {sel.class_year && <span style={{ fontSize: 14, color: "var(--m-muted)" }}>Class of {sel.class_year}</span>}
                {sel.profile_id && sel.connect_pref && sel.connect_pref !== "none" && (
                  <span className={`m-chip ${sel.connect_pref === "mentor" ? "gold" : ""}`}>{CONNECT[sel.connect_pref].label}</span>
                )}
              </div>

              {sel.profile_id ? (
                <>
                  <dl>
                    {(sel.job_title || sel.industry) && (
                      <div>
                        <dt>Work</dt>
                        <dd>
                          {sel.job_title}
                          {sel.employer ? ` · ${sel.employer}` : ""}
                          {sel.industry && (
                            <>
                              <br />
                              <span style={{ color: "var(--m-muted)", fontSize: 14 }}>{sel.industry}</span>
                            </>
                          )}
                        </dd>
                      </div>
                    )}
                    {sel.country && (
                      <div>
                        <dt>Location</dt>
                        <dd>{[sel.state, sel.country].filter(Boolean).join(", ")}</dd>
                      </div>
                    )}
                    {(sel.interests ?? []).length > 0 && (
                      <div>
                        <dt>Areas of interest</dt>
                        <dd className="m-chips">
                          {(sel.interests ?? []).map((x) => (
                            <span key={x} className="m-chip">{x}</span>
                          ))}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Contact</dt>
                      <dd style={{ fontSize: 15 }}>
                        {safeUrl(sel.linkedin_url) && (
                          <>
                            <a href={safeUrl(sel.linkedin_url)!} target="_blank" rel="noopener noreferrer" style={{ color: "var(--m-green)", fontWeight: 600 }}>
                              LinkedIn profile
                            </a>
                            <br />
                          </>
                        )}
                        {safeUrl(sel.social_url) && (
                          <>
                            <a href={safeUrl(sel.social_url)!} target="_blank" rel="noopener noreferrer" style={{ color: "var(--m-green)", fontWeight: 600 }}>
                              Other social link
                            </a>
                            <br />
                          </>
                        )}
                        {sel.email ? (
                          <span style={{ userSelect: "all" }}>{sel.email}</span>
                        ) : (
                          <span style={{ color: "var(--m-muted)" }}>Email not shared. Send a message instead.</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                  {sel.profile_id !== me && (
                    <div style={{ padding: "0 30px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <Link className="m-btn m-btn-primary m-btn-block" href={`/messages?to=${sel.profile_id}`}>
                        Send a message
                      </Link>
                      {sel.connect_pref === "mentor" && (
                        <Link className="m-btn m-btn-line m-btn-block" href={`/messages?to=${sel.profile_id}&mentor=1`}>
                          Ask for mentoring
                        </Link>
                      )}
                    </div>
                  )}
                  {sel.profile_id === me && (
                    <div style={{ padding: "0 30px 30px" }}>
                      <Link className="m-btn m-btn-line m-btn-block" href="/account">
                        Edit my profile
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "24px 30px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ color: "#4d5358", lineHeight: 1.6 }}>
                    {sel.first_name || sel.full_name.split(" ")[0]} is on the OSA register but has not joined the site yet. Know how to reach them? Send them an invitation to request membership.
                  </p>
                  <button type="button" className="m-btn m-btn-line m-btn-block" onClick={copyInvite}>
                    Copy invitation link
                  </button>
                  {copied && <span style={{ fontSize: 13, color: "var(--m-green)", wordBreak: "break-all" }}>{copied}</span>}
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
