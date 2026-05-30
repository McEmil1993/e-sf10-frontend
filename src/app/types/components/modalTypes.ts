import type { ReactNode } from "react";
import type { AppIconName } from "@/app/types/iconTypes";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "modal-large";

export type ModalMode = "view" | "add" | "edit";

export type ModalFieldType =
  | "text"
  | "email"
  | "password"
  | "date"
  | "date-range"
  | "select"
  | "radio-group"
  | "textarea"
  | "icon-lookup"
  | "checkbox-group"
  | "lookup"
  | "file"
  | "school-year-range";

export type ModalInputSize = "sm" | "md" | "lg";
export type ModalImageCropShape = "circle" | "square";
export type ModalCheckboxStyle = "default" | "pill";

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
  accept?: string;
  helperText?: string;
  options?: ModalFieldOption[];
  maxSelections?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  colSpan?: 1 | 2;
  inputSize?: ModalInputSize;
  checkboxStyle?: ModalCheckboxStyle;
  layoutClassName?: string;
  enableImageCrop?: boolean;
  cropShape?: ModalImageCropShape;
  cropAspect?: number;
  rangeEndName?: string;
  yearStart?: number;
  yearEnd?: number;
};

export type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  size?: ModalSize;
  titleClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
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
  gridClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  titleClassName?: string;
  showBodyDivider?: boolean;
  dividerAfterIndex?: number;
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
