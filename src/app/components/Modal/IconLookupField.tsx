"use client";

import { useMemo, useState } from "react";
import AppIcon from "@/app/components/Icon/AppIcon";
import type { IconLookupFieldProps } from "@/app/types/components/iconLookupTypes";

export default function IconLookupField({ disabled, onChange, options, value }: IconLookupFieldProps) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className="space-y-3">
      <input
        className={[
          "h-9 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100",
          disabled ? "cursor-default bg-slate-50 text-slate-600" : "",
        ].join(" ")}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search icon"
        type="text"
        value={query}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {filteredOptions.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              className={[
                "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[5px] border px-2 py-3 text-center transition",
                isSelected
                  ? "border-primary bg-sky-50 text-primary shadow-sm"
                  : "border-border bg-white text-slate-700 hover:border-primary/40 hover:text-primary",
                disabled ? "pointer-events-none bg-slate-50 text-slate-500" : "",
              ].join(" ")}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] bg-background">
                <AppIcon className="h-4 w-4" name={option.value} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide">{option.label}</span>
            </button>
          );
        })}
      </div>
      {!filteredOptions.length ? (
        <div className="rounded-[5px] border border-dashed border-border px-3 py-4 text-sm text-muted">
          No icons matched your search.
        </div>
      ) : null}
    </div>
  );
}
