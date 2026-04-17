"use client";

import type { RoleCardProps } from "@/app/types/components/roleCardTypes";

function getRoleLabel(name: string) {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RoleCard({
  isActive,
  onDelete,
  onEdit,
  onSelect,
  permissionCount,
  role,
  userCount,
}: RoleCardProps) {
  return (
    <div
      className={[
        "group rounded-[5px] border p-5 text-left shadow-sm transition duration-150",
        isActive
          ? "border-primary bg-sky-50/70 ring-2 ring-sky-100"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <button className="flex-1 text-left" onClick={onSelect} type="button">
          <h3 className="text-lg font-semibold text-slate-950">{getRoleLabel(role.name)}</h3>
        </button>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-[5px] border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
          <button
            className="inline-flex items-center justify-center rounded-[5px] border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            onClick={onDelete}
            type="button"
          >
            Delete
          </button>
          <span
            className={[
              "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
              isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {permissionCount}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <button className="rounded-[5px] bg-background px-3 py-2 text-left" onClick={onSelect} type="button">
          <div className="text-xs uppercase tracking-wide text-muted">Users</div>
          <div className="mt-1 font-semibold text-slate-900">{userCount}</div>
        </button>
        <button className="rounded-[5px] bg-background px-3 py-2 text-left" onClick={onSelect} type="button">
          <div className="text-xs uppercase tracking-wide text-muted">Permissions</div>
          <div className="mt-1 font-semibold text-slate-900">{permissionCount}</div>
        </button>
      </div>
    </div>
  );
}
