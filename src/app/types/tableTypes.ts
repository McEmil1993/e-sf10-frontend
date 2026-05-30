import type { ReactNode } from "react";

export type TableActionTone = "default" | "primary" | "danger";

export type TableAction<T> = {
  label: string;
  icon: ReactNode;
  onClick: (row: T) => void;
  tone?: TableActionTone;
};

export type TableColumn<T> = {
  key: keyof T | string;
  header: string;
  type?: "text" | "stacked" | "badge" | "badges" | "actions";
  showAvatar?: boolean;
  avatarImageKey?: keyof T | string;
  avatarFallbackKey?: keyof T | string;
  avatarClassName?: string;
  avatarTextClassName?: string;
  secondaryKey?: keyof T | string;
  badgeClassName?: string;
  toneMap?: Record<string, string>;
  valueClassName?: string;
  secondaryValueClassName?: string;
  actions?: TableAction<T>[];
  className?: string;
  headerClassName?: string;
};

export type TableSearchControl = {
  value: string;
  onChange: (value: string) => void;
};

export type TablePaginationControl = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: (row: T) => string | number;
  emptyMessage?: string;
  showControls?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  search?: TableSearchControl;
  pagination?: TablePaginationControl;
};
