import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
  duration?: number;
};

export type ToastViewportProps = {
  toasts: ToastItem[];
  onDismiss: (toastId: string) => void;
};
