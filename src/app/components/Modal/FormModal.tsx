"use client";

import Button from "@/app/components/Button/Button";
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

function renderField(
  field: ModalField,
  isViewMode: boolean,
  value: string,
  onChange: (name: string, fieldValue: string) => void,
) {
  const inputClassName = [
    "w-full rounded-md border border-border bg-white text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100",
    inputSizeClasses[field.inputSize ?? "md"],
    isViewMode || field.disabled ? "cursor-default bg-slate-50 text-slate-600" : "",
  ].join(" ");

  if (field.type === "textarea") {
    return (
      <textarea
        className={[
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-sky-100",
          isViewMode || field.disabled ? "cursor-default bg-slate-50 text-slate-600" : "",
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

    return (
      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((option) => {
            const isChecked = selectedValues.includes(option.value);
            const isOptionDisabled =
              isViewMode ||
              field.disabled ||
              (!isChecked && hasReachedMaxSelections);

            return (
              <label
                className={[
                  "flex items-center gap-3 rounded-[5px] border px-3 py-2 text-sm transition",
                  isChecked
                    ? "border-primary bg-sky-50 text-primary"
                    : "border-border bg-white text-slate-700",
                  isOptionDisabled
                    ? "cursor-default bg-slate-50 text-slate-400"
                    : "cursor-pointer hover:border-primary/40",
                ].join(" ")}
                key={option.value}
              >
                <input
                  checked={isChecked}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  disabled={isOptionDisabled}
                  onChange={(event) => {
                    const nextValues = event.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((selectedValue) => selectedValue !== option.value);

                    onChange(field.name, nextValues.join(","));
                  }}
                  type="checkbox"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
        {typeof maxSelections === "number" ? (
          <p className="text-xs text-muted">
            You can select up to {maxSelections} roles only.
          </p>
        ) : null}
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
  columns = 2,
  description,
  fields,
  isOpen,
  mode,
  onChange,
  onClose,
  onSubmit,
  size = "lg",
  submitLabel,
  title,
  values,
}: FormModalProps) {
  const isViewMode = mode === "view";

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
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={title}
    >
      <div
        className={[
          "grid gap-4",
          columns === 3 ? "md:grid-cols-2 xl:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : "grid-cols-1",
        ].join(" ")}
      >
        {fields.map((field) => (
          <div
            className={[
              "space-y-2",
              field.colSpan === 2 ? (columns === 3 ? "xl:col-span-2" : "md:col-span-2") : "",
            ].join(" ")}
            key={field.name}
          >
            <span className="text-sm font-semibold text-slate-700">{field.label}</span>
            {renderField(field, isViewMode, values[field.name] ?? "", onChange)}
          </div>
        ))}
      </div>
    </Modal>
  );
}
