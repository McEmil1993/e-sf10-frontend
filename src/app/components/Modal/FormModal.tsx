"use client";

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

function renderField(
  field: ModalField,
  isViewMode: boolean,
  value: string,
  onChange: (name: string, fieldValue: string) => void,
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
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
}: FormModalProps) {
  const isViewMode = mode === "view";
  const resolvedGridClassName =
    gridClassName ??
    (columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "grid-cols-1");

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
        {fields.map((field) => (
          <div
            className={[
              fieldClassName ?? "space-y-1.5",
              field.layoutClassName ??
                (field.colSpan === 2 ? (columns === 3 ? "xl:col-span-2" : "md:col-span-2") : ""),
            ].join(" ")}
            key={field.name}
          >
            <span className={labelClassName ?? "text-[14px] font-semibold text-slate-700"}>{field.label}</span>
            {renderField(field, isViewMode, values[field.name] ?? "", onChange)}
            {field.helperText ? <p className="text-xs text-muted">{field.helperText}</p> : null}
          </div>
        ))}
      </div>
    </Modal>
  );
}
