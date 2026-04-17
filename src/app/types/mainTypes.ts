import type { ReactNode } from "react";
import type { SessionShellUser } from "@/app/types/authTypes";

export type MainProps = {
  children: ReactNode;
  defaultSidebarCollapsed?: boolean;
  user: SessionShellUser;
};
