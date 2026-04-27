"use client";

import { forwardRef } from "react";
import type { InputProps, InputSize } from "@/app/types/components/inputTypes";

const sizeClasses: Record<InputSize, string> = {
  xs: "h-8 px-2 text-xs",
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-11 px-4 text-base",
};

const fileInputClasses: Record<InputSize, string> = {
  xs: "py-1 file:px-2 file:py-1 file:text-xs",
  sm: "py-1.5 file:px-3 file:py-1.5 file:text-sm",
  md: "py-2 file:px-3 file:py-2 file:text-sm",
  lg: "py-2.5 file:px-4 file:py-2.5 file:text-base",
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    errorText,
    fullWidth = true,
    helperClassName,
    helperText,
    id,
    inputSize = "md",
    label,
    labelClassName,
    type = "text",
    wrapperClassName,
    ...props
  },
  ref,
) {
  const isFileInput = type === "file";
  const helperMessage = errorText ?? helperText;
  const inputClassNames = [
    "block rounded-md border border-border bg-white text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60",
    fullWidth ? "w-full" : "",
    isFileInput
      ? [
          "file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:font-semibold file:text-slate-700 hover:file:bg-slate-200",
          fileInputClasses[inputSize],
        ].join(" ")
      : sizeClasses[inputSize],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={[fullWidth ? "w-full" : "", wrapperClassName ?? ""].filter(Boolean).join(" ")}>
      {label ? (
        <label
          className={["mb-2 block text-sm font-medium text-slate-700", labelClassName ?? ""].join(" ")}
          htmlFor={id}
        >
          {label}
        </label>
      ) : null}
      <input
        {...props}
        ref={ref}
        className={inputClassNames}
        id={id}
        type={type}
      />
      {helperMessage ? (
        <p
          className={[
            "mt-2 text-xs",
            errorText ? "text-rose-600" : "text-muted",
            helperClassName ?? "",
          ].join(" ")}
        >
          {helperMessage}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
