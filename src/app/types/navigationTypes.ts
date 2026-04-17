import type { AppIconName } from "@/app/types/iconTypes";

export type IconName = AppIconName;

export type NavItem = {
  label: string;
  href?: string;
  icon?: IconName;
  children?: NavItem[];
  description?: string;
};
