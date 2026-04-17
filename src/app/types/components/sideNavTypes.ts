import type { SessionShellUser } from "@/app/types/authTypes";
import type { NavItem } from "@/app/types/navigationTypes";

export type SideNavProps = {
  items: NavItem[];
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  user: SessionShellUser;
};
