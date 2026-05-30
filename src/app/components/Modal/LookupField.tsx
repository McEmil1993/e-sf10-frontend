"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LookupFieldProps } from "@/app/types/components/lookupFieldTypes";

type DropdownPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

export default function LookupField({
  disabled,
  onChange,
  options,
  placeholder,
  value,
}: LookupFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const displayValue = selectedOption?.label ?? value;

  const filteredOptions = useMemo(() => {
    const normalizedValue = displayValue.trim().toLowerCase();

    if (!normalizedValue) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedValue));
  }, [displayValue, options]);

  const shouldShowOptions = !disabled && isFocused && filteredOptions.length > 0;

  const updateDropdownPosition = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const viewportMargin = 12;
    const dropdownGap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - viewportMargin;
    const spaceAbove = rect.top - viewportMargin;
    const openBelow = spaceBelow >= 96 || spaceBelow >= spaceAbove;
    const availableSpace = Math.max(80, openBelow ? spaceBelow : spaceAbove);
    const maxHeight = Math.min(240, availableSpace - dropdownGap);

    setDropdownPosition({
      left: rect.left,
      maxHeight,
      top: openBelow ? rect.bottom + dropdownGap : rect.top - maxHeight - dropdownGap,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!shouldShowOptions) {
      return undefined;
    }

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [shouldShowOptions, updateDropdownPosition]);

  const dropdown =
    shouldShowOptions && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-[80] overflow-y-auto rounded-[5px] border border-border bg-card py-1 shadow-xl"
            style={{
              left: dropdownPosition.left,
              maxHeight: dropdownPosition.maxHeight,
              top: dropdownPosition.top,
              width: dropdownPosition.width,
            }}
          >
            {filteredOptions.map((option) => (
              <button
                className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground transition hover:bg-background hover:text-primary"
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
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        className={[
          "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15",
          disabled ? "cursor-default bg-background text-muted" : "",
        ].join(" ")}
        disabled={disabled}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        type="text"
        value={displayValue}
      />
      {dropdown}
    </div>
  );
}
