"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/app/components/Button/Button";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import ImageCropField from "@/app/components/Image/ImageCropField";
import IconLookupField from "@/app/components/Modal/IconLookupField";
import LookupField from "@/app/components/Modal/LookupField";
import Modal from "@/app/components/Modal/Modal";
import type { AppIconOption } from "@/app/types/iconTypes";
import type { FormModalProps, ModalField } from "@/app/types/components/modalTypes";

const inputSizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-11 px-4 text-base",
};

const baseInputClassName =
  "w-full rounded-[6px] border border-border bg-card text-foreground shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] placeholder:text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
const disabledInputClassName = "cursor-default bg-background text-muted";

function isFieldVisible(field: ModalField, values: Record<string, string>) {
  if (!field.visibleWhen) {
    return true;
  }

  return values[field.visibleWhen.name] === field.visibleWhen.value;
}

function CheckChipIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M4 8.2 6.45 10.65 12 5.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PlusChipIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path d="M8 3.25v9.5M3.25 8h9.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function getSchoolYearStartYear(value: string) {
  const [startYear] = value.split("-");
  const parsedYear = Number(startYear);

  if (!Number.isInteger(parsedYear)) {
    return "";
  }

  return String(parsedYear);
}

function getSchoolYearBounds(value: string, yearStart?: number, yearEnd?: number) {
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(getSchoolYearStartYear(value));

  return {
    minYear: yearStart ?? Math.min(currentYear - 20, Number.isInteger(selectedYear) ? selectedYear : currentYear),
    maxYear: yearEnd ?? Math.max(currentYear + 20, Number.isInteger(selectedYear) ? selectedYear : currentYear),
  };
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SchoolYearRangeField({
  field,
  inputClassName,
  isViewMode,
  onChange,
  value,
}: {
  field: ModalField;
  inputClassName: string;
  isViewMode: boolean;
  onChange: (name: string, fieldValue: string) => void;
  value: string;
}) {
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(getSchoolYearStartYear(value));
  const safeSelectedYear = Number.isInteger(selectedYear) ? selectedYear : currentYear;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [visibleStartYear, setVisibleStartYear] = useState(Math.floor(safeSelectedYear / 12) * 12);
  const { minYear, maxYear } = getSchoolYearBounds(value, field.yearStart, field.yearEnd);
  const visibleYears = Array.from({ length: 12 }, (_item, index) => visibleStartYear + index).filter(
    (year) => year >= minYear && year <= maxYear,
  );
  const canGoPrevious = visibleStartYear > minYear;
  const canGoNext = visibleStartYear + 11 < maxYear;

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPickerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPickerOpen]);

  const pickerDialog =
    isPickerOpen && !isViewMode && !field.disabled
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/30 px-4 py-6">
            <button
              aria-label="Close school year picker"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setIsPickerOpen(false)}
              type="button"
            />
            <div className="relative z-[81] w-full max-w-sm rounded-[8px] border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Select School Year</h3>
                  <p className="text-xs text-muted">Pick one start year only.</p>
                </div>
                <span className="text-slate-500">
                  <CalendarIcon />
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-border text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canGoPrevious}
                    onClick={() => setVisibleStartYear((year) => Math.max(minYear, year - 12))}
                    type="button"
                  >
                    <ChevronIcon direction="left" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800">
                    {visibleStartYear} - {Math.min(visibleStartYear + 11, maxYear)}
                  </span>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-border text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canGoNext}
                    onClick={() => setVisibleStartYear((year) => Math.min(maxYear - 11, year + 12))}
                    type="button"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {visibleYears.map((year) => {
                    const isSelected = year === selectedYear;

                    return (
                      <button
                        className={[
                          "h-10 rounded-[5px] border text-sm font-semibold transition",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-card text-slate-700 hover:border-primary/40 hover:bg-sky-50 hover:text-primary",
                        ].join(" ")}
                        key={year}
                        onClick={() => {
                          onChange(field.name, `${year}-${year + 1}`);
                          setIsPickerOpen(false);
                        }}
                        type="button"
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border bg-background/35 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">
                  Result: {value || "None"}
                </span>
                <Button onClick={() => setIsPickerOpen(false)} size="sm" variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        className={[
          inputClassName,
          "flex h-10 items-center justify-between gap-3 text-left",
          !value ? "text-muted" : "",
        ].join(" ")}
        disabled={isViewMode || field.disabled}
        onClick={() => setIsPickerOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>{value || field.placeholder || "Select school year"}</span>
        <span className="shrink-0 text-muted">
          <CalendarIcon />
        </span>
      </button>

      {pickerDialog}
    </div>
  );
}

function renderField(
  field: ModalField,
  isViewMode: boolean,
  value: string,
  onChange: (name: string, fieldValue: string) => void,
  values: Record<string, string>,
) {
  const inputClassName = [
    baseInputClassName,
    inputSizeClasses[field.inputSize ?? "md"],
    isViewMode || field.disabled ? disabledInputClassName : "",
  ].join(" ");

  if (field.type === "textarea") {
    return (
      <textarea
        className={[
          `${baseInputClassName} min-h-[96px] px-3 py-2.5 text-sm`,
          isViewMode || field.disabled ? disabledInputClassName : "",
        ].join(" ")}
        disabled={isViewMode || field.disabled}
        name={field.name}
        onChange={(event) => onChange(field.name, event.target.value)}
        placeholder={field.placeholder}
        readOnly={isViewMode || field.readOnly}
        rows={field.rows ?? 4}
        value={value}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={inputClassName}
        disabled={isViewMode || field.disabled}
        name={field.name}
        onChange={(event) => onChange(field.name, event.target.value)}
        value={value}
      >
        {field.placeholder ? <option value="">{field.placeholder}</option> : null}
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "radio-group") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {(field.options ?? []).map((option) => {
          const isChecked = value === option.value;
          const isDisabled = isViewMode || field.disabled;

          return (
            <label
              className={[
                "flex min-h-10 items-center gap-3 rounded-[6px] border px-3 py-2 text-sm font-semibold transition",
                isChecked ? "border-primary bg-sky-50 text-primary" : "border-border bg-card text-slate-700",
                isDisabled ? "cursor-default opacity-75" : "cursor-pointer hover:border-primary/40",
              ].join(" ")}
              key={option.value}
            >
              <input
                checked={isChecked}
                className="h-4 w-4 border-border text-primary focus:ring-primary"
                disabled={isDisabled}
                name={field.name}
                onChange={() => onChange(field.name, option.value)}
                required={field.required}
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "school-year-range") {
    return (
      <SchoolYearRangeField
        field={field}
        inputClassName={inputClassName}
        isViewMode={isViewMode}
        onChange={onChange}
        value={value}
      />
    );
  }

  if (field.type === "date-range") {
    const endName = field.rangeEndName;
    const endValue = endName ? values[endName] ?? "" : "";

    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted">Start Date</span>
          <input
            className={inputClassName}
            disabled={isViewMode || field.disabled}
            max={endValue || undefined}
            name={field.name}
            onChange={(event) => {
              const nextStartDate = event.target.value;

              onChange(field.name, nextStartDate);

              if (endName && endValue && nextStartDate && nextStartDate > endValue) {
                onChange(endName, nextStartDate);
              }
            }}
            readOnly={isViewMode || field.readOnly}
            required={field.required}
            type="date"
            value={value}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-muted">End Date</span>
          <input
            className={inputClassName}
            disabled={isViewMode || field.disabled || !endName}
            min={value || undefined}
            name={endName}
            onChange={(event) => {
              if (endName) {
                onChange(endName, event.target.value);
              }
            }}
            readOnly={isViewMode || field.readOnly}
            type="date"
            value={endValue}
          />
        </label>
      </div>
    );
  }

  if (field.type === "checkbox-group") {
    const selectedValues = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const maxSelections = field.maxSelections;
    const hasReachedMaxSelections = typeof maxSelections === "number" && selectedValues.length >= maxSelections;
    const isPillStyle = field.checkboxStyle === "pill";

    return (
      <div className="space-y-2">
        <div className={isPillStyle ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}>
          {(field.options ?? []).map((option) => {
            const isChecked = selectedValues.includes(option.value);
            const isLocked = isViewMode || field.disabled;
            const isSelectionBlocked = !isChecked && hasReachedMaxSelections;
            const isOptionDisabled = isLocked || isSelectionBlocked;

            return (
              <label
                className={[
                  isPillStyle
                    ? "group inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold shadow-sm transition"
                    : "flex items-center gap-3 rounded-[5px] border px-3 py-2 text-sm transition",
                  isPillStyle
                    ? isChecked
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border bg-card text-foreground shadow-sm"
                    : isChecked
                      ? "border-primary bg-accent text-primary"
                      : "border-border bg-card text-foreground",
                  isOptionDisabled
                    ? isSelectionBlocked
                      ? "cursor-default opacity-50"
                      : "cursor-default opacity-75"
                    : isPillStyle
                      ? "cursor-pointer hover:border-primary/45 hover:text-primary"
                      : "cursor-pointer hover:border-primary/40",
                ].join(" ")}
                key={option.value}
              >
                <input
                  checked={isChecked}
                  className={isPillStyle ? "sr-only" : "h-4 w-4 rounded border-border text-primary focus:ring-primary"}
                  disabled={isOptionDisabled}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((selectedValue) => selectedValue !== option.value);

                    onChange(field.name, nextValues.join(","));
                  }}
                  type="checkbox"
                />
                {isPillStyle ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                      isChecked
                        ? "border-white/25 bg-white/15 text-white"
                        : "border-border bg-background text-muted group-hover:border-primary/35 group-hover:text-primary",
                    ].join(" ")}
                  >
                    {isChecked ? <CheckChipIcon /> : <PlusChipIcon />}
                  </span>
                ) : null}
                <span className="font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
       
      </div>
    );
  }

  if (field.type === "lookup") {
    return (
      <LookupField
        disabled={isViewMode || field.disabled}
        onChange={(fieldValue) => onChange(field.name, fieldValue)}
        options={field.options ?? []}
        placeholder={field.placeholder}
        value={value}
      />
    );
  }

  if (field.type === "icon-lookup") {
    return (
      <IconLookupField
        disabled={isViewMode || field.disabled}
        onChange={(fieldValue) => onChange(field.name, fieldValue)}
        options={(field.options ?? []) as AppIconOption[]}
        value={value}
      />
    );
  }

  if (field.type === "file") {
    if (field.enableImageCrop) {
      return (
        <ImageCropField
          field={field}
          isViewMode={isViewMode}
          onChange={onChange}
          value={value}
        />
      );
    }

    const inputId = `file-field-${field.name}`;
    const hasPreview = Boolean(value);

    return (
      <div className="space-y-3">
        {hasPreview ? (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-slate-50 p-3">
            <AuthenticatedImage
              alt={field.label}
              className="h-16 w-16 rounded-md border border-border object-cover"
              fallback={
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-slate-100 text-xs font-medium text-slate-500">
                  No image
                </div>
              }
              src={value}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">Selected profile image</p>
              <p className="truncate text-xs text-muted">
                {value.startsWith("data:") ? "Uploaded image preview" : value}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
            No profile image selected.
          </div>
        )}
        {!isViewMode && !field.disabled ? (
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="inline-flex cursor-pointer items-center rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              htmlFor={inputId}
            >
              Choose image
            </label>
            <input
              accept={field.accept}
              className="sr-only"
              disabled={field.disabled}
              id={inputId}
              name={field.name}
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                const reader = new FileReader();

                reader.onload = () => {
                  const result = typeof reader.result === "string" ? reader.result : "";
                  onChange(field.name, result);
                };

                reader.readAsDataURL(file);
                event.target.value = "";
              }}
              type="file"
            />
            <span className="text-xs text-muted">Image uploads automatically when you save.</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <input
      className={inputClassName}
      disabled={isViewMode || field.disabled}
      name={field.name}
      onChange={(event) => onChange(field.name, event.target.value)}
      placeholder={field.placeholder}
      readOnly={isViewMode || field.readOnly}
      required={field.required}
      type={field.type ?? "text"}
      value={value}
    />
  );
}

export default function FormModal({
  bodyClassName,
  columns = 2,
  description,
  fields,
  fieldClassName,
  footerClassName,
  gridClassName,
  headerClassName,
  isOpen,
  labelClassName,
  mode,
  onChange,
  onClose,
  onSubmit,
  panelClassName,
  size = "lg",
  submitLabel,
  title,
  titleClassName,
  values,
  showBodyDivider = false,
  dividerAfterIndex,
  
}: FormModalProps) {
  const isViewMode = mode === "view";
  const resolvedGridClassName =
    gridClassName ??
    (columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "grid-cols-1");
  const visibleFields = fields.filter((field) => isFieldVisible(field, values));

  return (
    <Modal
      description={description}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={onClose} variant="secondary">
            {isViewMode ? "Close" : "Cancel"}
          </Button>
          {!isViewMode && onSubmit ? <Button onClick={onSubmit}>{submitLabel ?? "Save"}</Button> : null}
        </div>
      }
      bodyClassName={bodyClassName}
      footerClassName={footerClassName}
      headerClassName={headerClassName}
      isOpen={isOpen}
      onClose={onClose}
      panelClassName={panelClassName}
      size={size}
      title={title}
      titleClassName={titleClassName}
    >
      <div className={["grid gap-x-4 gap-y-3.5", resolvedGridClassName].join(" ")}>
        {visibleFields.map((field, index) => (
          <div key={field.name} className="contents">
            
            {/* FIELD */}
            <div
              className={[
                fieldClassName ?? "space-y-1.5",
                field.layoutClassName ??
                  (field.colSpan === 2
                    ? columns === 3
                      ? "xl:col-span-2"
                      : "md:col-span-2"
                    : ""),
              ].join(" ")}
            >
              <span className={labelClassName ?? "text-[14px] font-semibold text-slate-700"}>
                {field.label}
              </span>

              {renderField(field, isViewMode, values[field.name] ?? "", onChange, values)}

              {field.helperText ? (
                <p className="text-xs text-muted">{field.helperText}</p>
              ) : null}
            </div>

            {/* DIVIDER */}
            {showBodyDivider && dividerAfterIndex === index && (
              <div className="col-span-full">
                <hr className="my-2 border-border opacity-60" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
