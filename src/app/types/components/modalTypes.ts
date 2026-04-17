import type { ReactNode } from "react";
import type { AppIconName } from "@/app/types/iconTypes";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "modal-large";

export type ModalMode = "view" | "add" | "edit";

export type ModalFieldType = "text" | "email" | "password" | "select" | "textarea" | "icon-lookup" | "checkbox-group" | "lookup";

export type ModalInputSize = "sm" | "md" | "lg";

export type ModalFieldOption = {
  label: string;
  value: string;
  icon?: AppIconName;
};

export type ModalField = {
  name: string;
  label: string;
  type?: ModalFieldType;
  placeholder?: string;
  options?: ModalFieldOption[];
  maxSelections?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  colSpan?: 1 | 2;
  inputSize?: ModalInputSize;
};

export type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  size?: ModalSize;
  footer?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
};

export type FormModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  mode: ModalMode;
  values: Record<string, string>;
  fields: ModalField[];
  submitLabel?: string;
  size?: ModalSize;
  columns?: 1 | 2 | 3;
  onChange: (name: string, value: string) => void;
  onClose: () => void;
  onSubmit?: () => void;
};

export type ConfirmModalTone = "default" | "primary" | "danger";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  itemLabel: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  emphasisMessage?: string;
  emphasisTone?: ConfirmModalTone;
  onClose: () => void;
  onConfirm: () => void;
};
