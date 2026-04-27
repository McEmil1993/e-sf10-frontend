import type { AdminUser, UserStatus } from "@/app/types/userTypes";

export function getDashboardStats(list: AdminUser[]) {
  const activeUsers = list.filter((user) => user.status === "active").length;
  const inactiveUsers = list.filter((user) => user.status === "inactive").length;

  return {
    totalUsers: list.length,
    activeUsers,
    inactiveUsers,
  };
}

export function getPrimaryUserRole(user: AdminUser) {
  return user.roles[0] ?? "user";
}

function normalizeRoleKey(role: string) {
  return role.trim().toLowerCase();
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function getStatusTone(status: UserStatus) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "inactive") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-rose-50 text-rose-700 ring-rose-100";
}

export function getRoleTone(role: string) {
  const normalizedRole = normalizeRoleKey(role);

  if (normalizedRole === "admin" || normalizedRole === "developer") {
    return "bg-slate-900 text-white";
  }

  if (normalizedRole === "editor" || normalizedRole === "staff") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function buildRoleToneMap(roles: string[]) {
  return Array.from(new Set(roles.map(normalizeRoleKey).filter(Boolean))).reduce<Record<string, string>>(
    (result, role) => {
      result[role] = getRoleTone(role);
      return result;
    },
    {},
  );
}
