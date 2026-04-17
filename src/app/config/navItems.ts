import type { NavItem } from "@/app/types/navigationTypes";

export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    description: "Overview and summary",
  },
  {
    label: "Settings",
    icon: "settings",
    description: "System settings",
    children: [
      {
        label: "Users",
        href: "/users",
        description: "Manage user access",
      },
      {
        label: "Roles & Permissions",
        href: "/roles-permissions",
        description: "Manage access levels",
      },
      {
        label: "Audit Trail",
        href: "/audit-trail",
        description: "Review user activity",
      },
      {
        label: "Notifications",
        href: "/notifications",
        description: "Manage system notifications",
      },
      {
        label: "Import Data",
        href: "/import-data",
        description: "Upload and import records",
      },
      {
        label: "Backup & Recovery",
        href: "/backup-recovery",
        description: "Manage backups and recovery",
      },
    ],
  },
];
