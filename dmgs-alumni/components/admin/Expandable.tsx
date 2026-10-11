"use client";

import { Children, useMemo, useState } from "react";

/**
 * Shows the first `initial` items of a long server-rendered list, with
 * "Show more" (adds `step` at a time) and an optional search box.
 *
 * - `labels`: one search string per child (same order); enables the search.
 * - `colSpan`: render inside a <tbody>; the controls become a table row.
 */
export function Expandable({
  children,
  initial = 10,
  step = 20,
  noun = "items",
  labels,
  colSpan,
  searchPlaceholder = "Search",
  wrap,
}: {
  children: React.ReactNode;
  initial?: number;
  step?: number;
  noun?: string;
  labels?: string[];
  colSpan?: number;
  searchPlaceholder?: string;
  /** Class for a box around the items (e.g. "m-card"). */
  wrap?: string;
}) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(initial);
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle || !labels) return items.map((node, i) => ({ node, i }));
    return items
      .map((node, i) => ({ node, i }))
      .filter(({ i }) => (labels[i] ?? "").toLowerCase().includes(needle));
  }, [items, labels, q]);

  const page = visible.slice(0, shown);
  const remaining = visible.length - page.length;

  const controls = (
    <div className="m-expand">
      <span>
        Showing {page.length} of {visible.length} {noun}
      </span>
      <span style={{ display: "flex", gap: 8 }}>
        {remaining > 0 && (
          <button type="button" className="m-btn m-btn-line m-btn-sm" onClick={() => setShown((n) => n + step)}>
            Show {Math.min(step, remaining)} more
          </button>
        )}
        {remaining > step && (
          <button type="button" className="m-btn m-btn-line m-btn-sm" onClick={() => setShown(visible.length)}>
            Show all
          </button>
        )}
        {shown > initial && visible.length > initial && (
          <button type="button" className="m-link" style={{ fontSize: 14 }} onClick={() => setShown(initial)}>
            Show fewer
          </button>
        )}
      </span>
    </div>
  );

  const search = labels && items.length > initial && (
    <input
      className="m-input m-expand-search"
      type="search"
      value={q}
      placeholder={searchPlaceholder}
      aria-label={searchPlaceholder}
      onChange={(e) => {
        setQ(e.target.value);
        setShown(initial);
      }}
    />
  );

  if (colSpan) {
    return (
      <>
        {search && (
          <tr className="m-expand-row">
            <td colSpan={colSpan}>{search}</td>
          </tr>
        )}
        {page.map(({ node }) => node)}
        {visible.length === 0 && (
          <tr>
            <td colSpan={colSpan} style={{ color: "var(--m-muted)" }}>No match.</td>
          </tr>
        )}
        {visible.length > initial && (
          <tr className="m-expand-row">
            <td colSpan={colSpan}>{controls}</td>
          </tr>
        )}
      </>
    );
  }

  return (
    <>
      {search}
      {wrap ? (
        page.length > 0 && <div className={wrap}>{page.map(({ node }) => node)}</div>
      ) : (
        page.map(({ node }) => node)
      )}
      {visible.length === 0 && <div className="m-card m-empty">No match.</div>}
      {visible.length > initial && controls}
    </>
  );
}
