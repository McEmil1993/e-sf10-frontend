export type RoleDialogState =
  | { mode: "add"; roleId: null }
  | { mode: "edit"; roleId: number };

export type ModuleDialogState =
  | { mode: "add"; moduleId: null }
  | { mode: "edit"; moduleId: number };

export type PermissionDialogState =
  | { mode: "add"; permissionId: null; moduleId?: number }
  | { mode: "edit"; permissionId: number; moduleId?: number };

export type DeleteState =
  | { entity: "role"; id: number; label: string }
  | { entity: "module"; id: number; label: string }
  | { entity: "permission"; id: number; label: string };

export type DataTab = "permissions" | "modules";
