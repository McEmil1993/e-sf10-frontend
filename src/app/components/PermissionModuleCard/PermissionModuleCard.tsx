"use client";

import AppIcon from "@/app/components/Icon/AppIcon";
import type { PermissionModuleCardProps } from "@/app/types/components/permissionModuleCardTypes";

export default function PermissionModuleCard({
  assignedPermissionIds,
  headerAction,
  isExpanded,
  module,
  onDeleteModule,
  onDeletePermission,
  onEditModule,
  onEditPermission,
  onToggleAll,
  onToggleExpand,
  onTogglePermission,
  permissions,
  selectedRoleLabel,
}: PermissionModuleCardProps) {
  const checkedCount = permissions.filter((permission) => assignedPermissionIds.has(permission.id)).length;
  const allChecked = permissions.length > 0 && checkedCount === permissions.length;

  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={onToggleExpand}
          type="button"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[5px] bg-sky-50 text-primary">
            <AppIcon className="h-5 w-5" name={module.icon} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold text-slate-950">{module.name}</span>
            <span className="block text-sm text-muted">
              {permissions.length} permissions in this module
            </span>
          </span>
        </button>
        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-[5px] border border-border bg-background px-3 py-2 text-sm font-medium text-slate-700 sm:inline-flex">
            <input
              checked={allChecked}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              onChange={(event) => onToggleAll(permissions.map((permission) => permission.id), event.target.checked)}
              type="checkbox"
            />
            <span>Check All</span>
          </label>
          {headerAction}
          <button
            className="hidden rounded-[5px] border border-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary sm:inline-flex"
            onClick={onEditModule}
            type="button"
          >
            Edit
          </button>
          <button
            className="hidden rounded-[5px] border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 sm:inline-flex"
            onClick={onDeleteModule}
            type="button"
          >
            Delete
          </button>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-border bg-background text-slate-700 transition hover:border-primary/40 hover:text-primary"
            onClick={onToggleExpand}
            type="button"
          >
            <svg
              className={["h-4 w-4 transition-transform", isExpanded ? "rotate-180" : ""].join(" ")}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {permissions.map((permission) => {
            const assigned = assignedPermissionIds.has(permission.id);

            return (
              <div
                className={[
                  "rounded-[5px] border p-4 transition",
                  assigned
                    ? "border-primary bg-sky-50/60 shadow-sm"
                    : "border-border bg-background hover:border-primary/30",
                ].join(" ")}
                key={permission.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <label className="flex items-start gap-3">
                      <input
                        checked={assigned}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        onChange={() => onTogglePermission(permission.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold text-slate-950">
                          {permission.name}
                        </span>
                        <span className="mt-1 block text-xs font-medium tracking-wide text-primary">
                          {permission.slug}
                        </span>
                      </span>
                    </label>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <button
                      className="rounded-[5px] border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
                      onClick={() => onEditPermission(permission.id)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-[5px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                      onClick={() => onDeletePermission(permission.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted">{permission.description}</p>

                <div className="mt-4 inline-flex rounded-[5px] bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-border">
                  {assigned ? `Checked for ${selectedRoleLabel}` : `Unchecked for ${selectedRoleLabel}`}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
