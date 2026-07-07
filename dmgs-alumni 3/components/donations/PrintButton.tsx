"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary print:hidden">
      Print / Save as PDF
    </button>
  );
}
