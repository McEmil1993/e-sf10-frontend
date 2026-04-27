import type { InputHTMLAttributes, ReactNode } from "react";

export type InputSize = "xs" | "sm" | "md" | "lg";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: InputSize;
  fullWidth?: boolean;
  label?: ReactNode;
  helperText?: ReactNode;
  errorText?: ReactNode;
  wrapperClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
};
