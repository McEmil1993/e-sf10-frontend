import type { ReactNode } from "react";
import type { AppModule, AppPermission } from "@/app/types/accessControlTypes";

export type PermissionModuleCardProps = {
  module: AppModule;
  permissions: AppPermission[];
  assignedPermissionIds: Set<number>;
  selectedRoleLabel: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTogglePermission: (permissionId: number) => void;
  onToggleAll: (permissionIds: number[], shouldAssign: boolean) => void;
  onEditModule: () => void;
  onDeleteModule: () => void;
  onEditPermission: (permissionId: number) => void;
  onDeletePermission: (permissionId: number) => void;
  headerAction?: ReactNode;
};
