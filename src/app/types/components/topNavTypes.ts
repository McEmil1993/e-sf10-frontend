import type { SessionShellUser } from "@/app/types/authTypes";

export type TopNavProps = {
  isSidebarCollapsed: boolean;
  user: SessionShellUser;
  onMenuToggle: () => void;
};

export type NavUtilityIconType = "mail" | "bell" | "flag";

export type NavUtilityIconProps = {
  type: NavUtilityIconType;
};
