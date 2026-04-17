export type AppIconName =
  | "dashboard"
  | "administration"
  | "settings"
  | "users"
  | "products"
  | "orders"
  | "analytics"
  | "reports"
  | "images"
  | "chart"
  | "document"
  | "shield";

export type AppIconOption = {
  label: string;
  value: AppIconName;
};
