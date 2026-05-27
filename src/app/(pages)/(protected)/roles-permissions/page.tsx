"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import AppIcon from "@/app/components/Icon/AppIcon";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import PermissionModuleCard from "@/app/components/PermissionModuleCard/PermissionModuleCard";
import RoleCard from "@/app/components/RoleCard/RoleCard";
import { moduleIconOptions } from "@/app/config/iconOptions";
import type {
  AppModule,
  AppPermission,
  AppRole,
  ModuleFormValues,
  PermissionFormValues,
  RoleFormValues,
} from "@/app/types/accessControlTypes";
import type { ModalField } from "@/app/types/components/modalTypes";
import type { DataTab, DeleteState, ModuleDialogState, PermissionDialogState, RoleDialogState } from "@/app/types/rolesPermissionsTypes";
import type { AdminUser } from "@/app/types/userTypes";
import {
  createModule,
  createPermission,
  createRole,
  deleteModule,
  deletePermission,
  deleteRole,
  getRolePermissions,
  listModules,
  listPermissions,
  listRoles,
  listUsers,
  replaceRolePermissions,
  updateModule,
  updatePermission,
  updateRole,
} from "@/app/utils/api";

type RolePermissionMap = Record<number, number[]>;

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function buildRolePermissionMap(entries: Array<readonly [number, number[]]>): RolePermissionMap {
  return entries.reduce<RolePermissionMap>((result, [roleId, permissionIds]) => {
    result[roleId] = Array.from(new Set(permissionIds));
    return result;
  }, {});
}

function removePermissionIdsFromRoleMap(
  currentValue: RolePermissionMap,
  permissionIds: number[],
) {
  const removedIds = new Set(permissionIds);

  return Object.keys(currentValue).reduce<RolePermissionMap>((result, roleId) => {
    const parsedRoleId = Number(roleId);
    result[parsedRoleId] = currentValue[parsedRoleId].filter(
      (permissionId) => !removedIds.has(permissionId),
    );
    return result;
  }, {});
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rolePermissionIdsByRole, setRolePermissionIdsByRole] = useState<RolePermissionMap>({});
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DataTab>("permissions");
  const [expandedModuleIds, setExpandedModuleIds] = useState<number[]>([]);
  const [roleDialogState, setRoleDialogState] = useState<RoleDialogState | null>(null);
  const [moduleDialogState, setModuleDialogState] = useState<ModuleDialogState | null>(null);
  const [permissionDialogState, setPermissionDialogState] = useState<PermissionDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [roleFormValues, setRoleFormValues] = useState<RoleFormValues>(emptyRoleFormValues);
  const [moduleFormValues, setModuleFormValues] = useState<ModuleFormValues>(emptyModuleFormValues);
  const [permissionFormValues, setPermissionFormValues] = useState<PermissionFormValues>(
    emptyPermissionFormValues,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAccessControlData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [roleData, moduleData, permissionData, userData] = await Promise.all([
          listRoles(),
          listModules(),
          listPermissions(),
          listUsers(),
        ]);

        const rolePermissionEntries = await Promise.all(
          roleData.map(async (role) => {
            const assignedPermissions = await getRolePermissions(role.id);

            return [role.id, assignedPermissions.map((permission) => permission.id)] as const;
          }),
        );

        if (!isMounted) {
          return;
        }

        setRoles(roleData);
        setModules(moduleData);
        setPermissions(permissionData);
        setUsers(userData);
        setRolePermissionIdsByRole(buildRolePermissionMap(rolePermissionEntries));
        setPermissionFormValues({
          ...emptyPermissionFormValues,
          module_id: String(moduleData[0]?.id ?? ""),
        });
        setSelectedRoleId((currentValue) =>
          currentValue && roleData.some((role) => role.id === currentValue)
            ? currentValue
            : roleData[0]?.id ?? null,
        );
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAccessControlData();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const rolePermissionIds = useMemo(
    () => new Set(rolePermissionIdsByRole[selectedRoleId ?? -1] ?? []),
    [rolePermissionIdsByRole, selectedRoleId],
  );

  const permissionCountByRole = useMemo(
    () =>
      Object.keys(rolePermissionIdsByRole).reduce<Record<number, number>>((result, roleId) => {
        const parsedRoleId = Number(roleId);
        result[parsedRoleId] = rolePermissionIdsByRole[parsedRoleId]?.length ?? 0;
        return result;
      }, {}),
    [rolePermissionIdsByRole],
  );

  const userCountByRole = useMemo(() => {
    const roleIdByName = new Map(roles.map((role) => [role.name.toLowerCase(), role.id]));

    return users.reduce<Record<number, number>>((result, user) => {
      user.roles.forEach((roleName) => {
        const roleId = roleIdByName.get(roleName.toLowerCase());

        if (!roleId) {
          return;
        }

        result[roleId] = (result[roleId] ?? 0) + 1;
      });

      return result;
    }, {});
  }, [roles, users]);

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
    setErrorMessage(null);
    setRoleFormValues(emptyRoleFormValues);
    setRoleDialogState({ mode: "add", roleId: null });
  }

  function openEditRoleModal(roleId: number) {
    const role = roles.find((item) => item.id === roleId);

    if (!role) {
      return;
    }

    setErrorMessage(null);
    setRoleFormValues({
      name: role.name,
      description: role.description,
    });
    setRoleDialogState({ mode: "edit", roleId });
  }

  function openModuleModal() {
    setErrorMessage(null);
    setModuleFormValues(emptyModuleFormValues);
    setModuleDialogState({ mode: "add", moduleId: null });
  }

  function openEditModuleModal(moduleId: number) {
    const selectedModule = modules.find((item) => item.id === moduleId);

    if (!selectedModule) {
      return;
    }

    setErrorMessage(null);
    setModuleFormValues({
      name: selectedModule.name,
      slug: selectedModule.slug,
      icon: selectedModule.icon,
    });
    setModuleDialogState({ mode: "edit", moduleId });
  }

  function openPermissionModal(moduleId?: number) {
    setErrorMessage(null);
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

    setErrorMessage(null);
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
    setErrorMessage(null);
    setDeleteState({ entity, id, label });
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  async function handleSaveRole() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (roleDialogState?.mode === "edit" && roleDialogState.roleId !== null) {
        const updatedRole = await updateRole(roleDialogState.roleId, {
          name: roleFormValues.name.trim().toLowerCase(),
          description: roleFormValues.description.trim(),
        });

        setRoles((currentValue) =>
          currentValue.map((role) =>
            role.id === roleDialogState.roleId ? updatedRole : role,
          ),
        );
        closeRoleModal();
        return;
      }

      const createdRole = await createRole({
        name: roleFormValues.name.trim().toLowerCase(),
        description: roleFormValues.description.trim(),
      });

      setRoles((currentValue) => [...currentValue, createdRole]);
      setRolePermissionIdsByRole((currentValue) => ({
        ...currentValue,
        [createdRole.id]: [],
      }));
      setSelectedRoleId(createdRole.id);
      closeRoleModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveModule() {
    const payload = {
      name: moduleFormValues.name.trim(),
      slug: moduleFormValues.slug.trim() || buildModuleSlug(moduleFormValues.name),
      icon: moduleFormValues.icon,
    };

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (moduleDialogState?.mode === "edit" && moduleDialogState.moduleId !== null) {
        const updatedModule = await updateModule(
          moduleDialogState.moduleId,
          payload,
          modules.find((module) => module.id === moduleDialogState.moduleId)?.sort_order ?? 0,
        );

        setModules((currentValue) =>
          currentValue.map((module) =>
            module.id === moduleDialogState.moduleId ? updatedModule : module,
          ),
        );
        closeModuleModal();
        return;
      }

      const createdModule = await createModule(payload, modules.length);

      setModules((currentValue) => [...currentValue, createdModule]);
      closeModuleModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePermission() {
    const moduleId = Number(permissionFormValues.module_id);
    const selectedModule = modules.find((module) => module.id === moduleId);

    if (!selectedModule) {
      setErrorMessage("Please select a valid module.");
      return;
    }

    const payload = {
      module_id: String(moduleId),
      name: permissionFormValues.name.trim(),
      slug:
        permissionFormValues.slug.trim() ||
        buildPermissionSlug(selectedModule.slug, permissionFormValues.name),
      description: permissionFormValues.description.trim(),
    };

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (
        permissionDialogState?.mode === "edit" &&
        permissionDialogState.permissionId !== null
      ) {
        const updatedPermission = await updatePermission(
          permissionDialogState.permissionId,
          payload,
        );

        setPermissions((currentValue) =>
          currentValue.map((permission) =>
            permission.id === permissionDialogState.permissionId
              ? updatedPermission
              : permission,
          ),
        );
        closePermissionModal();
        return;
      }

      const createdPermission = await createPermission(payload);

      setPermissions((currentValue) => [...currentValue, createdPermission]);
      setExpandedModuleIds((currentValue) =>
        currentValue.includes(moduleId) ? currentValue : [...currentValue, moduleId],
      );
      closePermissionModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function persistRolePermissions(
    roleId: number,
    nextPermissionIds: number[],
    previousPermissionIds: number[],
  ) {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      const updatedPermissions = await replaceRolePermissions(roleId, nextPermissionIds);

      setRolePermissionIdsByRole((currentValue) => ({
        ...currentValue,
        [roleId]: updatedPermissions.map((permission) => permission.id),
      }));
    } catch (error) {
      setRolePermissionIdsByRole((currentValue) => ({
        ...currentValue,
        [roleId]: previousPermissionIds,
      }));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function handleTogglePermission(permissionId: number) {
    if (!selectedRoleId) {
      return;
    }

    const previousPermissionIds = rolePermissionIdsByRole[selectedRoleId] ?? [];
    const nextPermissionIds = previousPermissionIds.includes(permissionId)
      ? previousPermissionIds.filter((currentPermissionId) => currentPermissionId !== permissionId)
      : [...previousPermissionIds, permissionId];

    setRolePermissionIdsByRole((currentValue) => ({
      ...currentValue,
      [selectedRoleId]: nextPermissionIds,
    }));

    void persistRolePermissions(selectedRoleId, nextPermissionIds, previousPermissionIds);
  }

  function handleToggleAllPermissions(permissionIds: number[], shouldAssign: boolean) {
    if (!selectedRoleId) {
      return;
    }

    const previousPermissionIds = rolePermissionIdsByRole[selectedRoleId] ?? [];
    const scopedPermissionIds = new Set(permissionIds);
    const keptPermissionIds = previousPermissionIds.filter(
      (permissionId) => !scopedPermissionIds.has(permissionId),
    );
    const nextPermissionIds = shouldAssign
      ? Array.from(new Set([...keptPermissionIds, ...permissionIds]))
      : keptPermissionIds;

    setRolePermissionIdsByRole((currentValue) => ({
      ...currentValue,
      [selectedRoleId]: nextPermissionIds,
    }));

    void persistRolePermissions(selectedRoleId, nextPermissionIds, previousPermissionIds);
  }

  async function handleDeleteItem() {
    if (!deleteState) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (deleteState.entity === "role") {
        await deleteRole(deleteState.id);

        const nextRoles = roles.filter((role) => role.id !== deleteState.id);
        setRoles(nextRoles);
        setRolePermissionIdsByRole((currentValue) => {
          const nextValue = { ...currentValue };
          delete nextValue[deleteState.id];
          return nextValue;
        });

        if (selectedRoleId === deleteState.id) {
          setSelectedRoleId(nextRoles[0]?.id ?? null);
        }

        closeDeleteDialog();
        return;
      }

      if (deleteState.entity === "module") {
        await deleteModule(deleteState.id);

        const removedPermissionIds = permissions
          .filter((permission) => permission.module_id === deleteState.id)
          .map((permission) => permission.id);

        setModules((currentValue) => currentValue.filter((module) => module.id !== deleteState.id));
        setPermissions((currentValue) =>
          currentValue.filter((permission) => permission.module_id !== deleteState.id),
        );
        setRolePermissionIdsByRole((currentValue) =>
          removePermissionIdsFromRoleMap(currentValue, removedPermissionIds),
        );
        setExpandedModuleIds((currentValue) =>
          currentValue.filter((moduleId) => moduleId !== deleteState.id),
        );
        closeDeleteDialog();
        return;
      }

      await deletePermission(deleteState.id);

      setPermissions((currentValue) =>
        currentValue.filter((permission) => permission.id !== deleteState.id),
      );
      setRolePermissionIdsByRole((currentValue) =>
        removePermissionIdsFromRoleMap(currentValue, [deleteState.id]),
      );
      closeDeleteDialog();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PagePlaceholder
      breadcrumb="Home > Settings > Roles & Permissions"
      contentClassName="space-y-6"
      title="Roles & Permissions"
    >
      {errorMessage ? (
        <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Roles</h2>
            </div>
            <Button disabled={isSaving} icon={<PlusIcon />} onClick={openRoleModal} size="sm">
              Add Role
            </Button>
          </div>

          <div className="grid gap-4">
            {isLoading && roles.length === 0 ? (
              <section className="rounded-[5px] border border-border bg-card p-5 text-sm text-muted shadow-sm">
                Loading roles and permission assignments...
              </section>
            ) : roles.length === 0 ? (
              <section className="rounded-[5px] border border-border bg-card p-5 text-sm text-muted shadow-sm">
                No roles found.
              </section>
            ) : (
              roles.map((role) => (
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
              ))
            )}
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
                {selectedRole?.description ||
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
                  : "Manage the RBAC modules coming from the backend service."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab === "permissions" ? (
                <Button
                  disabled={isSaving}
                  icon={<PlusIcon />}
                  onClick={() => openPermissionModal()}
                  size="sm"
                  variant="secondary"
                >
                  Add Permission
                </Button>
              ) : (
                <Button
                  disabled={isSaving}
                  icon={<PlusIcon />}
                  onClick={openModuleModal}
                  size="sm"
                  variant="secondary"
                >
                  Add Module
                </Button>
              )}
            </div>
          </div>

          {activeTab === "permissions" ? (
            <div className="space-y-4">
              {modulePermissions.length === 0 ? (
                <section className="rounded-[5px] border border-border bg-card p-5 text-sm text-muted shadow-sm">
                  {isLoading ? "Loading permissions..." : "No modules or permissions found."}
                </section>
              ) : (
                modulePermissions.map(({ module, permissions: modulePermissionItems }) => (
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
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {modulePermissions.length === 0 ? (
                <section className="rounded-[5px] border border-border bg-card p-5 text-sm text-muted shadow-sm">
                  {isLoading ? "Loading modules..." : "No modules found."}
                </section>
              ) : (
                modulePermissions.map(({ module, permissions: modulePermissionItems }) => (
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
                ))
              )}
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
        submitLabel={
          isSaving
            ? roleDialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : roleDialogState?.mode === "edit"
              ? "Save Role"
              : "Create Role"
        }
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
        submitLabel={
          isSaving
            ? moduleDialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : moduleDialogState?.mode === "edit"
              ? "Save Module"
              : "Create Module"
        }
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
        submitLabel={
          isSaving
            ? permissionDialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : permissionDialogState?.mode === "edit"
              ? "Save Permission"
              : "Create Permission"
        }
        title={permissionDialogState?.mode === "edit" ? "Edit Permission" : "Add Permission"}
        values={permissionFormValues}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel={isSaving ? "Working..." : "Delete"}
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
    </PagePlaceholder>
  );
}
