import rawUsers from "@/app/data/users.json";
import rawModules from "@/app/data/modules.json";
import rawPermissions from "@/app/data/permissions.json";
import rawRolePermissions from "@/app/data/role_permissions.json";
import rawRoles from "@/app/data/roles.json";
import rawUserPermissions from "@/app/data/user_permissions.json";
import rawUserRoles from "@/app/data/user_roles.json";
import type {
  AppModule,
  AppPermission,
  AppRole,
  RolePermissionAssignment,
  UserPermissionAssignment,
  UserRoleAssignment,
} from "@/app/types/accessControlTypes";
import type { AdminUser, UserRole, UserStatus } from "@/app/types/userTypes";

const markdownEmailPattern = /^\[[^[\]]+\]\(mailto:([^)]+)\)$/i;

function normalizeEmail(value: string) {
  const trimmedValue = value.trim().toLowerCase();
  const markdownMatch = trimmedValue.match(markdownEmailPattern);

  if (markdownMatch) {
    return markdownMatch[1].trim().toLowerCase();
  }

  return trimmedValue.replace(/^mailto:/i, "");
}

const users = (rawUsers as AdminUser[]).map((user) => ({
  ...user,
  email: normalizeEmail(user.email),
  avatar: user.profile_picture ?? user.avatar ?? "",
  roles: user.roles,
}));
const roles = rawRoles as AppRole[];
const modules = (rawModules as AppModule[]).slice().sort((firstValue, secondValue) => firstValue.sort_order - secondValue.sort_order);
const permissions = rawPermissions as AppPermission[];
const userRoles = rawUserRoles as UserRoleAssignment[];
const rolePermissions = rawRolePermissions as RolePermissionAssignment[];
const userPermissions = rawUserPermissions as UserPermissionAssignment[];

export async function getUsers(): Promise<AdminUser[]> {
  return users;
}

export async function getRoles(): Promise<AppRole[]> {
  return roles;
}

export async function getModules(): Promise<AppModule[]> {
  return modules;
}

export async function getPermissions(): Promise<AppPermission[]> {
  return permissions;
}

export async function getUserRoles(): Promise<UserRoleAssignment[]> {
  return userRoles;
}

export async function getRolePermissions(): Promise<RolePermissionAssignment[]> {
  return rolePermissions;
}

export async function getUserPermissions(): Promise<UserPermissionAssignment[]> {
  return userPermissions;
}

export async function getAccessControlData() {
  return {
    roles,
    modules,
    permissions,
    userRoles,
    rolePermissions,
    userPermissions,
  };
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => user.email === normalizedEmail);
}

export function getDashboardStats(list: AdminUser[]) {
  const activeUsers = list.filter((user) => user.status === "active").length;
  const inactiveUsers = list.filter((user) => user.status === "inactive").length;
  const bannedUsers = list.filter((user) => user.status === "banned").length;

  return {
    totalUsers: list.length,
    activeUsers,
    inactiveUsers,
    bannedUsers,
  };
}

export function getPrimaryUserRole(user: AdminUser) {
  return user.roles[0] ?? "user";
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

export function getRoleTone(role: UserRole) {
  if (role === "admin" || role === "developer") {
    return "bg-slate-900 text-white";
  }

  if (role === "editor" || role === "staff") {
    return "bg-sky-50 text-sky-700";
  }

  return "bg-slate-100 text-slate-700";
}
