import type { AppRole } from "@/app/types/accessControlTypes";

export type RoleCardProps = {
  role: AppRole;
  isActive: boolean;
  permissionCount: number;
  userCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
};
