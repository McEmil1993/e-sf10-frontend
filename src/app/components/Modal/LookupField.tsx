"use client";

import { useMemo, useState } from "react";
import type { LookupFieldProps } from "@/app/types/components/lookupFieldTypes";

export default function LookupField({
  disabled,
  onChange,
  options,
  placeholder,
  value,
}: LookupFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const filteredOptions = useMemo(() => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      return [];
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedValue));
  }, [options, value]);

  const shouldShowOptions = !disabled && isFocused && value.trim().length > 0 && filteredOptions.length > 0;

  return (
    <div className="relative">
      <input
        className={[
          "h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100",
          disabled ? "cursor-default bg-slate-50 text-slate-600" : "",
        ].join(" ")}
        disabled={disabled}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {shouldShowOptions ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-48 overflow-y-auto rounded-[5px] border border-border bg-white py-1 shadow-lg">
          {filteredOptions.map((option) => (
            <button
              className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-primary"
              key={option.value}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(option.value);
                setIsFocused(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
