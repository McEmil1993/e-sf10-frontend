"use client";

import { useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import AppIcon from "@/app/components/Icon/AppIcon";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PermissionModuleCard from "@/app/components/PermissionModuleCard/PermissionModuleCard";
import RoleCard from "@/app/components/RoleCard/RoleCard";
import { moduleIconOptions } from "@/app/config/iconOptions";
import rawModules from "@/app/data/modules.json";
import rawPermissions from "@/app/data/permissions.json";
import rawRolePermissions from "@/app/data/role_permissions.json";
import rawRoles from "@/app/data/roles.json";
import rawUserRoles from "@/app/data/user_roles.json";
import type {
  AppModule,
  AppPermission,
  AppRole,
  ModuleFormValues,
  PermissionFormValues,
  RoleFormValues,
  RolePermissionAssignment,
  UserRoleAssignment,
} from "@/app/types/accessControlTypes";
import type { ModalField } from "@/app/types/components/modalTypes";
import type {
  DataTab,
  DeleteState,
  ModuleDialogState,
  PermissionDialogState,
  RoleDialogState,
} from "@/app/types/rolesPermissionsTypes";

const emptyRoleFormValues: RoleFormValues = {
  name: "",
  description: "",
};

const emptyModuleFormValues: ModuleFormValues = {
  name: "",
  slug: "",
  icon: "users",
};

const emptyPermissionFormValues: PermissionFormValues = {
  module_id: "",
  name: "",
  slug: "",
  description: "",
};

const accessControlData = {
  roles: rawRoles as AppRole[],
  modules: rawModules as AppModule[],
  permissions: rawPermissions as AppPermission[],
  userRoles: rawUserRoles as UserRoleAssignment[],
  rolePermissions: rawRolePermissions as RolePermissionAssignment[],
};

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" fill="currentColor" />
    </svg>
  );
}

function formatRoleLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^can\s+/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildPermissionSlug(moduleSlug: string, permissionName: string) {
  const actionSlug = slugifyValue(permissionName);
  return `${moduleSlug}.can_${actionSlug}`;
}

function buildModuleSlug(moduleName: string) {
  return moduleName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState(accessControlData.roles);
  const [modules, setModules] = useState(accessControlData.modules);
  const [permissions, setPermissions] = useState(accessControlData.permissions);
  const [rolePermissions, setRolePermissions] = useState(accessControlData.rolePermissions);
  const [userRoles, setUserRoles] = useState(accessControlData.userRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    accessControlData.roles[0]?.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<DataTab>("permissions");
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>([]);
  const [roleDialogState, setRoleDialogState] = useState<RoleDialogState | null>(null);
  const [moduleDialogState, setModuleDialogState] = useState<ModuleDialogState | null>(null);
  const [permissionDialogState, setPermissionDialogState] = useState<PermissionDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [roleFormValues, setRoleFormValues] = useState<RoleFormValues>(emptyRoleFormValues);
  const [moduleFormValues, setModuleFormValues] = useState<ModuleFormValues>(emptyModuleFormValues);
  const [permissionFormValues, setPermissionFormValues] = useState<PermissionFormValues>({
    ...emptyPermissionFormValues,
    module_id: String(accessControlData.modules[0]?.id ?? ""),
  });

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const rolePermissionIds = useMemo(
    () =>
      new Set(
        rolePermissions
          .filter((item) => item.role_id === selectedRoleId)
          .map((item) => item.permission_id),
      ),
    [rolePermissions, selectedRoleId],
  );

  const permissionCountByRole = useMemo(
    () =>
      rolePermissions.reduce<Record<number, number>>((result, item) => {
        result[item.role_id] = (result[item.role_id] ?? 0) + 1;
        return result;
      }, {}),
    [rolePermissions],
  );

  const userCountByRole = useMemo(
    () =>
      userRoles.reduce<Record<number, number>>((result, item) => {
        result[item.role_id] = (result[item.role_id] ?? 0) + 1;
        return result;
      }, {}),
    [userRoles],
  );

  const modulePermissions = useMemo(
    () =>
      modules
        .slice()
        .sort((firstValue, secondValue) => firstValue.sort_order - secondValue.sort_order)
        .map((module) => ({
          module,
          permissions: permissions.filter((permission) => permission.module_id === module.id),
        })),
    [modules, permissions],
  );

  const roleFields: ModalField[] = [
    {
      name: "name",
      label: "Role Name",
      placeholder: "staff",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe the role responsibility",
      colSpan: 2,
      required: true,
    },
  ];

  const moduleFields: ModalField[] = [
    {
      name: "name",
      label: "Module Name",
      placeholder: "Attendance",
      required: true,
    },
    {
      name: "slug",
      label: "Module Slug",
      placeholder: "attendance",
      required: true,
    },
    {
      name: "icon",
      label: "Icon",
      type: "icon-lookup",
      options: moduleIconOptions,
      colSpan: 2,
    },
  ];

  const permissionFields: ModalField[] = [
    {
      name: "module_id",
      label: "Module",
      type: "select",
      options: modules.map((module) => ({
        label: module.name,
        value: String(module.id),
      })),
    },
    {
      name: "name",
      label: "Permission Name",
      placeholder: "Can View",
      required: true,
    },
    {
      name: "slug",
      label: "Permission Slug",
      placeholder: "user.can_view",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Describe what this permission can do",
      colSpan: 2,
      required: true,
    },
  ];

  function toggleModule(moduleId: number) {
    setExpandedModuleIds((currentValue) =>
      currentValue.includes(moduleId)
        ? currentValue.filter((value) => value !== moduleId)
        : [...currentValue, moduleId],
    );
  }

  function handleRoleFieldChange(name: string, value: string) {
    setRoleFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function handleModuleFieldChange(name: string, value: string) {
    setModuleFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function handlePermissionFieldChange(name: string, value: string) {
    setPermissionFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function openRoleModal() {
    setRoleFormValues(emptyRoleFormValues);
    setRoleDialogState({ mode: "add", roleId: null });
  }

  function openEditRoleModal(roleId: number) {
    const role = roles.find((item) => item.id === roleId);

    if (!role) {
      return;
    }

    setRoleFormValues({
      name: role.name,
      description: role.description,
    });
    setRoleDialogState({ mode: "edit", roleId });
  }

  function openModuleModal() {
    setModuleFormValues(emptyModuleFormValues);
    setModuleDialogState({ mode: "add", moduleId: null });
  }

  function openEditModuleModal(moduleId: number) {
    const module = modules.find((item) => item.id === moduleId);

    if (!module) {
      return;
    }

    setModuleFormValues({
      name: module.name,
      slug: module.slug,
      icon: module.icon,
    });
    setModuleDialogState({ mode: "edit", moduleId });
  }

  function openPermissionModal(moduleId?: number) {
    setPermissionFormValues({
      ...emptyPermissionFormValues,
      module_id: String(moduleId ?? modules[0]?.id ?? ""),
    });
    setPermissionDialogState({ mode: "add", permissionId: null, moduleId });
  }

  function openEditPermissionModal(permissionId: number) {
    const permission = permissions.find((item) => item.id === permissionId);

    if (!permission) {
      return;
    }

    setPermissionFormValues({
      module_id: String(permission.module_id),
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
    });
    setPermissionDialogState({
      mode: "edit",
      permissionId,
      moduleId: permission.module_id,
    });
  }

  function closeRoleModal() {
    setRoleDialogState(null);
    setRoleFormValues(emptyRoleFormValues);
  }

  function closeModuleModal() {
    setModuleDialogState(null);
    setModuleFormValues(emptyModuleFormValues);
  }

  function closePermissionModal() {
    setPermissionDialogState(null);
    setPermissionFormValues({
      ...emptyPermissionFormValues,
      module_id: String(modules[0]?.id ?? ""),
    });
  }

  function openDeleteDialog(entity: DeleteState["entity"], id: number, label: string) {
    setDeleteState({ entity, id, label });
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function handleSaveRole() {
    if (roleDialogState?.mode === "edit" && roleDialogState.roleId !== null) {
      setRoles((currentValue) =>
        currentValue.map((role) =>
          role.id === roleDialogState.roleId
            ? {
                ...role,
                name: roleFormValues.name.trim().toLowerCase(),
                description: roleFormValues.description.trim(),
                updated_at: new Date().toISOString(),
              }
            : role,
        ),
      );
      closeRoleModal();
      return;
    }

    const nextId = roles.reduce((maxId, role) => Math.max(maxId, role.id), 0) + 1;
    const nextRole: AppRole = {
      id: nextId,
      name: roleFormValues.name.trim().toLowerCase(),
      description: roleFormValues.description.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRoles((currentValue) => [...currentValue, nextRole]);
    setSelectedRoleId(nextId);
    closeRoleModal();
  }

  function handleSaveModule() {
    if (moduleDialogState?.mode === "edit" && moduleDialogState.moduleId !== null) {
      setModules((currentValue) =>
        currentValue.map((module) =>
          module.id === moduleDialogState.moduleId
            ? {
                ...module,
                name: moduleFormValues.name.trim(),
                slug: moduleFormValues.slug.trim() || buildModuleSlug(moduleFormValues.name),
                icon: moduleFormValues.icon,
                updated_at: new Date().toISOString(),
              }
            : module,
        ),
      );
      closeModuleModal();
      return;
    }

    const nextId = modules.reduce((maxId, module) => Math.max(maxId, module.id), 0) + 1;
    const nextModule: AppModule = {
      id: nextId,
      name: moduleFormValues.name.trim(),
      slug: moduleFormValues.slug.trim() || buildModuleSlug(moduleFormValues.name),
      icon: moduleFormValues.icon,
      sort_order: modules.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setModules((currentValue) => [...currentValue, nextModule]);
    closeModuleModal();
  }

  function handleSavePermission() {
    const moduleId = Number(permissionFormValues.module_id);
    const selectedModule = modules.find((module) => module.id === moduleId);

    if (!selectedModule) {
      return;
    }

    if (permissionDialogState?.mode === "edit" && permissionDialogState.permissionId !== null) {
      setPermissions((currentValue) =>
        currentValue.map((permission) =>
          permission.id === permissionDialogState.permissionId
            ? {
                ...permission,
                module_id: moduleId,
                name: permissionFormValues.name.trim(),
                slug:
                  permissionFormValues.slug.trim() ||
                  buildPermissionSlug(selectedModule.slug, permissionFormValues.name),
                description: permissionFormValues.description.trim(),
                updated_at: new Date().toISOString(),
              }
            : permission,
        ),
      );
      closePermissionModal();
      return;
    }

    const nextId = permissions.reduce((maxId, permission) => Math.max(maxId, permission.id), 0) + 1;
    const nextPermission: AppPermission = {
      id: nextId,
      module_id: moduleId,
      name: permissionFormValues.name.trim(),
      slug:
        permissionFormValues.slug.trim() ||
        buildPermissionSlug(selectedModule.slug, permissionFormValues.name),
      description: permissionFormValues.description.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPermissions((currentValue) => [...currentValue, nextPermission]);
    setExpandedModuleIds((currentValue) =>
      currentValue.includes(moduleId) ? currentValue : [...currentValue, moduleId],
    );
    closePermissionModal();
  }

  function handleTogglePermission(permissionId: number) {
    if (!selectedRoleId) {
      return;
    }

    setRolePermissions((currentValue) => {
      const exists = currentValue.some(
        (item) => item.role_id === selectedRoleId && item.permission_id === permissionId,
      );

      if (exists) {
        return currentValue.filter(
          (item) => !(item.role_id === selectedRoleId && item.permission_id === permissionId),
        );
      }

      return [
        ...currentValue,
        {
          role_id: selectedRoleId,
          permission_id: permissionId,
        },
      ];
    });
  }

  function handleToggleAllPermissions(permissionIds: number[], shouldAssign: boolean) {
    if (!selectedRoleId) {
      return;
    }

    setRolePermissions((currentValue) => {
      const filteredItems = currentValue.filter(
        (item) =>
          item.role_id !== selectedRoleId || !permissionIds.includes(item.permission_id),
      );

      if (!shouldAssign) {
        return filteredItems;
      }

      return [
        ...filteredItems,
        ...permissionIds.map((permissionId) => ({
          role_id: selectedRoleId,
          permission_id: permissionId,
        })),
      ];
    });
  }

  function handleDeleteItem() {
    if (!deleteState) {
      return;
    }

    if (deleteState.entity === "role") {
      const nextRoles = roles.filter((role) => role.id !== deleteState.id);

      setRoles(nextRoles);
      setRolePermissions((currentValue) =>
        currentValue.filter((item) => item.role_id !== deleteState.id),
      );
      setUserRoles((currentValue) =>
        currentValue.filter((item) => item.role_id !== deleteState.id),
      );

      if (selectedRoleId === deleteState.id) {
        setSelectedRoleId(nextRoles[0]?.id ?? null);
      }

      closeDeleteDialog();
      return;
    }

    if (deleteState.entity === "module") {
      const removedPermissionIds = permissions
        .filter((permission) => permission.module_id === deleteState.id)
        .map((permission) => permission.id);

      setModules((currentValue) => currentValue.filter((module) => module.id !== deleteState.id));
      setPermissions((currentValue) =>
        currentValue.filter((permission) => permission.module_id !== deleteState.id),
      );
      setRolePermissions((currentValue) =>
        currentValue.filter((item) => !removedPermissionIds.includes(item.permission_id)),
      );
      setExpandedModuleIds((currentValue) =>
        currentValue.filter((moduleId) => moduleId !== deleteState.id),
      );
      closeDeleteDialog();
      return;
    }

    setPermissions((currentValue) =>
      currentValue.filter((permission) => permission.id !== deleteState.id),
    );
    setRolePermissions((currentValue) =>
      currentValue.filter((item) => item.permission_id !== deleteState.id),
    );
    closeDeleteDialog();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">Roles & Permissions</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Settings &gt; Roles & Permissions</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Roles</h2>
            </div>
            <Button icon={<PlusIcon />} onClick={openRoleModal} size="sm">
              Add Role
            </Button>
          </div>

          <div className="grid gap-4">
            {roles.map((role) => (
              <RoleCard
                isActive={role.id === selectedRoleId}
                key={role.id}
                onDelete={() => openDeleteDialog("role", role.id, formatRoleLabel(role.name))}
                onEdit={() => openEditRoleModal(role.id)}
                onSelect={() => setSelectedRoleId(role.id)}
                permissionCount={permissionCountByRole[role.id] ?? 0}
                role={role}
                userCount={userCountByRole[role.id] ?? 0}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[5px] border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Active Role
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {selectedRole ? formatRoleLabel(selectedRole.name) : "Select a role"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                {selectedRole?.description ??
                  "Choose a role card from the left side to configure module permissions."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-[5px] bg-background px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted">Modules</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{modules.length}</div>
              </div>
              <div className="rounded-[5px] bg-background px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted">Permissions</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{permissions.length}</div>
              </div>
              <div className="rounded-[5px] bg-background px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-muted">Assigned</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{rolePermissionIds.size}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex overflow-hidden rounded-[5px] border border-border bg-background p-1">
                <button
                  className={[
                    "rounded-[5px] px-4 py-2 text-sm font-semibold transition",
                    activeTab === "permissions"
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-white",
                  ].join(" ")}
                  onClick={() => setActiveTab("permissions")}
                  type="button"
                >
                  Permissions
                </button>
                <button
                  className={[
                    "rounded-[5px] px-4 py-2 text-sm font-semibold transition",
                    activeTab === "modules"
                      ? "bg-primary text-white"
                      : "text-slate-700 hover:bg-white",
                  ].join(" ")}
                  onClick={() => setActiveTab("modules")}
                  type="button"
                >
                  Modules
                </button>
              </div>
              <p className="mt-2 text-sm text-muted">
                {activeTab === "permissions"
                  ? "Check each permission card to allow access for the selected role."
                  : "Manage module records and keep module data ready for API integration."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab === "permissions" ? (
                <Button icon={<PlusIcon />} onClick={() => openPermissionModal()} size="sm" variant="secondary">
                  Add Permission
                </Button>
              ) : (
                <Button icon={<PlusIcon />} onClick={openModuleModal} size="sm" variant="secondary">
                  Add Module
                </Button>
              )}
            </div>
          </div>

          {activeTab === "permissions" ? (
            <div className="space-y-4">
              {modulePermissions.map(({ module, permissions: modulePermissionItems }) => (
                <PermissionModuleCard
                  assignedPermissionIds={rolePermissionIds}
                  headerAction={
                    <Button
                      className="hidden sm:inline-flex"
                      icon={<PlusIcon />}
                      onClick={() => openPermissionModal(module.id)}
                      size="sm"
                      variant="secondary"
                    >
                      Add
                    </Button>
                  }
                  isExpanded={expandedModuleIds.includes(module.id)}
                  key={module.id}
                  module={module}
                  onDeleteModule={() => openDeleteDialog("module", module.id, module.name)}
                  onDeletePermission={(permissionId) => {
                    const permission = permissions.find((item) => item.id === permissionId);
                    openDeleteDialog("permission", permissionId, permission?.name ?? "this permission");
                  }}
                  onEditModule={() => openEditModuleModal(module.id)}
                  onEditPermission={openEditPermissionModal}
                  onToggleAll={handleToggleAllPermissions}
                  onToggleExpand={() => toggleModule(module.id)}
                  onTogglePermission={handleTogglePermission}
                  permissions={modulePermissionItems}
                  selectedRoleLabel={selectedRole ? formatRoleLabel(selectedRole.name) : "role"}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {modulePermissions.map(({ module, permissions: modulePermissionItems }) => (
                <section
                  className="rounded-[5px] border border-border bg-card p-5 shadow-sm"
                  key={module.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{module.name}</h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary">
                        {module.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-white text-slate-600 transition hover:border-primary/40 hover:text-primary"
                        onClick={() => openEditModuleModal(module.id)}
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="m4 15.75 9.81-9.81 4.25 4.25L8.25 20H4v-4.25Zm12.95-10.7a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-.83.83-4.25-4.25.83-.83Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-white text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        onClick={() => openDeleteDialog("module", module.id, module.name)}
                        type="button"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" fill="currentColor" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[5px] bg-background px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-muted">Icon</div>
                      <div className="mt-2 flex items-center gap-2 font-semibold text-slate-900">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[5px] bg-white text-primary ring-1 ring-inset ring-border">
                          <AppIcon className="h-[18px] w-[18px]" name={module.icon} />
                        </span>
                        <span>{module.icon}</span>
                      </div>
                    </div>
                    <div className="rounded-[5px] bg-background px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-muted">Permissions</div>
                      <div className="mt-1 font-semibold text-slate-900">{modulePermissionItems.length}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      icon={<PlusIcon />}
                      onClick={() => openPermissionModal(module.id)}
                      size="sm"
                      variant="secondary"
                    >
                      Add Permission
                    </Button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <FormModal
        columns={2}
        fields={roleFields}
        isOpen={Boolean(roleDialogState)}
        mode={roleDialogState?.mode ?? "add"}
        onChange={handleRoleFieldChange}
        onClose={closeRoleModal}
        onSubmit={handleSaveRole}
        submitLabel={roleDialogState?.mode === "edit" ? "Save Role" : "Create Role"}
        title={roleDialogState?.mode === "edit" ? "Edit Role" : "Add Role"}
        values={roleFormValues}
      />

      <FormModal
        columns={2}
        fields={moduleFields}
        isOpen={Boolean(moduleDialogState)}
        mode={moduleDialogState?.mode ?? "add"}
        onChange={handleModuleFieldChange}
        onClose={closeModuleModal}
        onSubmit={handleSaveModule}
        submitLabel={moduleDialogState?.mode === "edit" ? "Save Module" : "Create Module"}
        title={moduleDialogState?.mode === "edit" ? "Edit Module" : "Add Module"}
        values={moduleFormValues}
      />

      <FormModal
        columns={2}
        fields={permissionFields}
        isOpen={Boolean(permissionDialogState)}
        mode={permissionDialogState?.mode ?? "add"}
        onChange={handlePermissionFieldChange}
        onClose={closePermissionModal}
        onSubmit={handleSavePermission}
        submitLabel={permissionDialogState?.mode === "edit" ? "Save Permission" : "Create Permission"}
        title={permissionDialogState?.mode === "edit" ? "Edit Permission" : "Add Permission"}
        values={permissionFormValues}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteState?.label ?? "this item"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteItem}
        title={
          deleteState?.entity === "role"
            ? "Delete Role"
            : deleteState?.entity === "module"
              ? "Delete Module"
              : "Delete Permission"
        }
      />
    </div>
  );
}
