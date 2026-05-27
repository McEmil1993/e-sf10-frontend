import type { NavItem } from "@/app/types/navigationTypes";

export const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    description: "Overview and summary",
  },
  {
    label: "Student Information",
    href: "/students/information",
    icon: "users",
    description: "View student information",
  },
  {
    label: "Student Grades",
    href: "/students/grades",
    icon: "chart",
    description: "View student grades",
  },
  {
    label: "Student SF10 Records",
    href: "/students/sf10-records",
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
        label: "System",
        href: "/settings/system",
        description: "Manage school profile and logos",
      },
      {
        label: "Guardians",
        href: "/guardians",
        description: "Manage guardian records",
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
