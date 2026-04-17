import type { AppIconName } from "@/app/types/iconTypes";

export type AppRole = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type AppModule = {
  id: number;
  name: string;
  slug: string;
  icon: AppIconName;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AppPermission = {
  id: number;
  module_id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type UserRoleAssignment = {
  user_id: number;
  role_id: number;
  assigned_at: string;
};

export type RolePermissionAssignment = {
  role_id: number;
  permission_id: number;
};

export type UserPermissionType = "allow" | "deny";

export type UserPermissionAssignment = {
  user_id: number;
  permission_id: number;
  type: UserPermissionType;
};

export type RoleFormValues = {
  name: string;
  description: string;
};

export type ModuleFormValues = {
  name: string;
  slug: string;
  icon: AppIconName;
};

export type PermissionFormValues = {
  module_id: string;
  name: string;
  slug: string;
  description: string;
};
