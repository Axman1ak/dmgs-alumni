"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Alumni } from "@/lib/types";
import { initialsOf, classBadge, orPlaceholder } from "@/lib/types";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-6 border-b border-border py-4 last:border-b-0">
      <span className="pt-0.5 font-sans text-[11px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
      <span className="text-[16px] text-ink">{value}</span>
    </div>
  );
}

export function AlumniModal({
  person,
  onClose,
}: {
  person: Alumni;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const badge = classBadge(person.class_year);
  const location =
    [person.city, person.country].filter(Boolean).join(", ") || null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-emerald-900/60 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded border border-border bg-paper shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="texture-diagonal relative bg-emerald-900 px-10 pb-10 pt-12 text-cream">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cream transition-colors hover:bg-white/20"
          >
            ✕
          </button>
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            <div className="flex h-[180px] w-[140px] shrink-0 items-center justify-center border-[3px] border-gold-500 bg-cream-dark font-display text-6xl font-medium text-emerald-800">
              {person.photo_url ? (
                <Image
                  src={person.photo_url}
                  alt={person.full_name}
                  width={140}
                  height={180}
                  className="h-full w-full object-cover"
                />
              ) : (
                initialsOf(person.full_name)
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="mb-2.5 font-display text-[42px] font-medium leading-none">
                {person.full_name}
              </h2>
              <p className="mb-4 font-serif text-[18px] italic opacity-85">
                {orPlaceholder(person.occupation)}
              </p>
              {badge && (
                <span className="inline-block bg-gold-500 px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-900">
                  Class of {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-8">
          <DetailRow label="Occupation" value={orPlaceholder(person.occupation)} />
          <DetailRow
            label="Class year"
            value={person.class_year ?? "Not provided"}
          />
          <DetailRow label="Location" value={orPlaceholder(location)} />
          <DetailRow
            label="Phone"
            value={
              person.phone ? (
                <a
                  href={`tel:${person.phone}`}
                  className="border-b border-dotted border-emerald-700 text-emerald-700"
                >
                  {person.phone}
                </a>
              ) : (
                "Not provided"
              )
            }
          />
          <DetailRow
            label="Email"
            value={
              person.email ? (
                <a
                  href={`mailto:${person.email}`}
                  className="border-b border-dotted border-emerald-700 text-emerald-700"
                >
                  {person.email}
                </a>
              ) : (
                "Not provided"
              )
            }
          />
          <DetailRow label="About" value={orPlaceholder(person.bio)} />
        </div>
      </div>
    </div>
  );
}
