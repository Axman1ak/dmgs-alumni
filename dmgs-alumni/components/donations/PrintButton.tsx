"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} type="button" className="m-btn m-btn-primary m-btn-sm print:hidden">
      Print / Save as PDF
    </button>
  );
}
