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
    label: "Grades",
    href: "/students/grades",
    icon: "chart",
    description: "View student grades",
  },
  {
    label: "SF10 Records",
    href: "/students/sf10-records",
    icon: "document",
    description: "View SF10 records",
  },
  {
    label: "Guardians",
    href: "/guardians",
    icon: "users",
    description: "Manage guardian records",
  },
  {
    label: "Subjects",
    href: "/subjects",
    icon: "document",
    description: "Manage SF10 subjects",
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
        label: "School Years",
        href: "/academic/school-years",
        description: "Manage school year periods",
      },
      {
        label: "Teachers / Advisers",
        href: "/academic/teachers",
        description: "Manage teachers and advisers",
      },
      {
        label: "Sections",
        href: "/academic/sections",
        description: "Manage grade sections",
      },
      {
        label: "Scholastic Records",
        href: "/academic/scholastic-records",
        description: "Manage SF10 scholastic records",
      },
      {
        label: "Remedial Classes",
        href: "/academic/remedial-classes",
        description: "Manage remedial records",
      },
      {
        label: "Eligibility Records",
        href: "/academic/eligibility-records",
        description: "Manage eligibility records",
      },
      {
        label: "Certifications",
        href: "/academic/certifications",
        description: "Manage SF10 certifications",
      },
      {
        label: "Records Archive",
        href: "/records/archive",
        description: "Archived records",
      },
      {
        label: "Reports Export / Print",
        href: "/reports/export-print",
        description: "Export or print reports",
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
        label: "Backup & Recovery",
        href: "/backup-recovery",
        description: "Manage backups and recovery",
      },
    ],
  },
];
