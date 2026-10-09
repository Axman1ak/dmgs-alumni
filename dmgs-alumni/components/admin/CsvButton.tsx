"use client";

/** Client-side CSV download of rows already on the page. */
export function CsvButton({ filename, rows, label = "Download CSV" }: { filename: string; rows: (string | number | null)[][]; label?: string }) {
  function download() {
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" className="m-btn m-btn-line m-btn-sm" onClick={download}>
      {label}
    </button>
  );
}
