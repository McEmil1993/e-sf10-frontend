"use client";

import { useEffect, useMemo, useState } from "react";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import { RefreshIcon } from "@/app/components/Icon/UserActionIcons";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";
import type { AcademicRecord, AcademicFieldConfig } from "@/app/types/academicTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import { log } from "console";

type TableRow = Record<string, string | number>;

// --- STATIC MOCK DATA ---
const MOCK_ARCHIVE_DATA: Record<string, AcademicRecord[]> = {

  
  "school-years": [
    { id: 101, name: "2023-2024", startDate: "2023-06-01", endDate: "2024-03-30", isActive: "false", deletedAt: "2024-04-01T10:00:00Z" },
    { id: 102, name: "2022-2023", startDate: "2022-06-01", endDate: "2023-03-30", isActive: "false", deletedAt: "2023-04-01T10:00:00Z"  },
  ],
  "teachers": [
    { id: 201, teacherName: "Juan Dela Cruz", position: "Teacher I", email: "juan@school.edu", deletedAt: "2024-01-15T08:30:00Z"  },
    { id: 202, teacherName: "Maria Clara", position: "Teacher III", email: "maria@school.edu", deletedAt: "2023-12-20T14:00:00Z"  },
  ],
  "sections": [
    { id: 301, sectionName: "Mabini", gradeLevel: 1, schoolYearName: "2023-2024", deletedAt: "2024-02-01T09:00:00Z"  },
    { id: 302, sectionName: "Rizal", gradeLevel: 2, schoolYearName: "2023-2024", deletedAt: "2024-02-01T09:00:00Z"  },
  ],
  "enrollments": [
    { id: 401, studentName: "Alice Wonderland", lrn: "123456789012", schoolYearName: "2023-2024", sectionName: "Mabini", status: "dropped", deletedAt: "2024-03-01T11:00:00Z"  },
    { id: 402, studentName: "Bob Builder", lrn: "234567890123", schoolYearName: "2023-2024", sectionName: "Rizal", status: "transferred_out", deletedAt: "2024-03-01T11:00:00Z"  },
  ],
  "sf10-records": [
    { id: 501, studentId: 10, status: "draft", remarks: "Incomplete documents", deletedAt: "2024-01-10T15:00:00Z"  },
  ],
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function RecordsArchivePage() {
  const entities = Object.entries(academicPageConfigs).map(([key, config]) => ({
    key,
    label: config.title,
    entity: config.entity,
  }));

  const [selectedEntityKey, setSelectedEntityKey] = useState(entities[0]?.key ?? "");
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreState, setRestoreState] = useState<{ recordId: number } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const selectedConfig = selectedEntityKey ? academicPageConfigs[selectedEntityKey as keyof typeof academicPageConfigs] : null;
  const selectedEntity = selectedConfig?.entity;

  useEffect(() => {
    if (!selectedEntity) return;

    setIsLoading(true);
    // Simulate network delay for a better feel
    const timer = setTimeout(() => {
      const mockData = MOCK_ARCHIVE_DATA[selectedEntity] ?? [];
      setRecords(mockData);
      setIsLoading(false);
    }, 400);

    console.log("RECORDS: ", records)

    return () => clearTimeout(timer);

  }, [selectedEntity]);

  function showToast({ description, duration, title, tone = "info" }: Omit<ToastItem, "id">) {
    setToasts((currentValue) => [
      ...currentValue.slice(-2),
      {
        id: createToastId(),
        title,
        description,
        tone,
        duration,
      },
    ]);
  }

  async function handleRestore() {
    if (!restoreState) return;

    // Simulate API call
    setTimeout(() => {
      setRecords((current) =>
        current.filter((r) => r.id !== restoreState.recordId)
      );
      setRestoreState(null);
      showToast({
        title: "Record restored.",
        description: "The academic record has been successfully restored to active status (Mock).",
        tone: "success",
      });
    }, 300);
  }

  const tableColumns: TableColumn<TableRow>[] = useMemo(() => {
    if (!selectedConfig) return [];

    const columns: TableColumn<TableRow>[] = [
      ...selectedConfig.fields
        .filter((f: AcademicFieldConfig) => f.table !== false)
        .map((f: AcademicFieldConfig, index: number) => ({
          key: f.name,
          header: f.label,
          valueClassName: index === 0 ? "text-sm font-semibold text-slate-950" : "text-sm text-slate-700",
        })),

      {
        key: "label",
        header: "Archived Date",
        valueClassName: "text-sm text-slate-600",
      },
      {
        key: "actions",
        header: "Actions",
        type: "actions" as const,
        className: "whitespace-nowrap",
        headerClassName: "w-[100px]",
        actions: [
          {
            label: "Restore",
            icon: <RefreshIcon />,
            onClick: (row) => setRestoreState({ recordId: Number(row.id) }),
            tone: "primary" as const,
          },
        ],
      },
    ];


    
    return columns;
  }, [selectedConfig]);

  const tableRows: TableRow[] = useMemo(() => {
    return records.map((record) => ({
      id: record.id,
      ...Object.fromEntries(
        selectedConfig?.fields
          .filter((f: AcademicFieldConfig) => f.table !== false)
          .map((f: AcademicFieldConfig) => [f.name, String(record[f.name] ?? "-")]) ?? []
      ),
      deletedAt: formatDate(record.deletedAt ?? record.deleted_at),
    }));
  }, [records, selectedConfig]);

  return (
    <PagePlaceholder
      breadcrumb="Home > Records > Archive"
      description="View and restore archived academic records across different entities."
      sectionLabel="Records Archive"
      title="Archive"
    >
      <ToastViewport
        onDismiss={(toastId) => setToasts((current) => current.filter((t) => t.id !== toastId))}
        toasts={toasts}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <label className="text-sm font-medium text-slate-700">View Archive for:</label>
          <select
            className="rounded-[5px] border border-border bg-card px-3 py-1.5 text-sm text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
            value={selectedEntityKey}
            onChange={(e) => setSelectedEntityKey(e.target.value)}
          >
            {entities.map((entity) => (
              <option key={entity.key} value={entity.key}>
                {entity.label}
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={tableColumns}
          data={tableRows}
          emptyMessage={isLoading ? "Loading archived records..." : "No archived records found for this entity."}
          searchPlaceholder={`Search archived ${selectedConfig?.title?.toLowerCase() ?? "records"}`}
        />
      </div>

      <ConfirmModal
        confirmClassName="border-sky-600 bg-sky-600 text-white hover:border-sky-700 hover:bg-sky-700"
        confirmLabel="Restore"
        description="Are you sure you want to restore"
        emphasisMessage="This will move the record back to the active records list."
        emphasisTone="primary"
        isOpen={Boolean(restoreState)}
        itemLabel={`record #${restoreState?.recordId}`}
        onClose={() => setRestoreState(null)}
        onConfirm={handleRestore}
        title="Restore Archived Record"
      />
    </PagePlaceholder>
  );
}
