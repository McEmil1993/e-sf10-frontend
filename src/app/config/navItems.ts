import type { NavItem } from "@/app/types/navigationTypes";

export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    description: "Overview and summary",
  },
  {
    label: "Pupil Information",
    href: "/pupils/information",
    icon: "users",
    description: "View pupil information",
  },
  {
    label: "Pupil Grades",
    href: "/pupils/grades",
    icon: "chart",
    description: "View pupil grades",
  },
  {
    label: "Pupil SF10 Records",
    href: "/pupils/sf10-records",
    icon: "document",
    description: "View SF10 records",
  },
  {
    label: "Records Search",
    href: "/records/search",
    icon: "document",
    description: "Search records",
  },
  {
    label: "Records Verification",
    href: "/records/verification",
    icon: "shield",
    description: "Verify records",
  },
  {
    label: "Records Archive",
    href: "/records/archive",
    icon: "document",
    description: "Archived records",
  },
  {
    label: "Reports Export / Print",
    href: "/reports/export-print",
    icon: "reports",
    description: "Export or print reports",
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
