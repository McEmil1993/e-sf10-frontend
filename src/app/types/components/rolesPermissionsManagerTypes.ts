import type {
  AppModule,
  AppPermission,
  AppRole,
  RolePermissionAssignment,
  UserPermissionAssignment,
  UserRoleAssignment,
} from "@/app/types/accessControlTypes";

export type RolesPermissionsManagerProps = {
  initialRoles: AppRole[];
  initialModules: AppModule[];
  initialPermissions: AppPermission[];
  initialRolePermissions: RolePermissionAssignment[];
  initialUserRoles: UserRoleAssignment[];
  initialUserPermissions: UserPermissionAssignment[];
};
