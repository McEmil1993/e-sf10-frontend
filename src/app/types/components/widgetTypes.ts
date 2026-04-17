import type { ReactNode } from "react";

export type WidgetTone = "default" | "primary" | "success" | "warning";

export type WidgetProps = {
  title: string;
  value: number | string;
  description?: string;
  icon?: ReactNode;
  tone?: WidgetTone;
};
