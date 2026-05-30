"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/app/components/Button/Button";
import BackupControlsSection from "@/app/components/Backup/BackupControlsSection";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import type { BackupFileItem, BackupSummary } from "@/app/types/backupTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import {
  downloadBackup,
  exportBackup,
  importBackup,
  importStoredBackup,
  listBackups,
  prependBackupFile,
} from "@/app/utils/backupsApi";

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getBackupDateFromFilename(filename: string) {
  const match = filename.match(/^(?:backup|imported)-(\d{4})-(\d{1,2})-(\d{1,2})_(\d{2})-(\d{2})-(\d{2})\.sql$/i);

  if (!match) {
    return null;
  }

  const [, year, month, day, hours, minutes, seconds] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getBackupUpdatedLabel(backup: BackupFileItem) {
  const filenameDate = getBackupDateFromFilename(backup.filename);

  if (filenameDate) {
    return formatDateTime(filenameDate.toISOString());
  }

  return formatDateTime(backup.lastModifiedAt);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected backup request error.";
}

function formatSummary(summary: BackupSummary) {
  return `${summary.totalRecords} total records across ${Object.keys(summary.tableCounts).length} tables.`;
}

function FileActionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.29 1.4 1.41-4.7 4.7-4.7-4.7 1.4-1.41L11 12.59V4a1 1 0 0 1 1-1Zm-7 14h14v2H5v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RestoreActionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 21a8 8 0 1 1 7.75-10h-2.06A6 6 0 1 0 12 19a5.96 5.96 0 0 0 4.24-1.76l1.41 1.41A7.94 7.94 0 0 1 12 21Zm1-13V3l6 5-6 5V8H7V6h6Z"
        fill="currentColor"
      />
    </svg>
  );
}

type BackupTableRow = {
  id: string;
  display_name: string;
  filename: string;
  source_label: string;
  updated_at: string;
  size_label: string;
};

export default function BackupRecoveryPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backups, setBackups] = useState<BackupFileItem[]>([]);
  const [totalSizeInBytes, setTotalSizeInBytes] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImport, setPendingImport] = useState<
    | { type: "upload"; itemLabel: string }
    | { type: "stored"; itemLabel: string; filename: string }
    | null
  >(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const backupRows: BackupTableRow[] = backups.map((backup) => ({
    id: backup.filename,
    display_name: backup.displayName,
    filename: backup.filename,
    source_label: backup.source === "import" ? "Imported file" : "Generated export",
    updated_at: getBackupUpdatedLabel(backup),
    size_label: formatFileSize(backup.sizeInBytes),
  }));

  const backupSourceToneMap = {
    "Imported file": "bg-rose-100 text-rose-800",
    "Generated export": "bg-emerald-100 text-emerald-800",
  };

  const backupColumns: TableColumn<BackupTableRow>[] = [
    {
      key: "display_name",
      header: "File",
      type: "stacked",
      secondaryKey: "filename",
      valueClassName: "font-semibold text-slate-900",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "source_label",
      header: "Source",
      type: "badge",
      badgeClassName: "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
      toneMap: backupSourceToneMap,
    },
    {
      key: "updated_at",
      header: "Updated",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "size_label",
      header: "Size",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "actions",
      header: "Action",
      type: "actions",
      className: "whitespace-nowrap",
      headerClassName: "w-[90px]",
      actions: [
        {
          label: "Download",
          icon: <FileActionIcon />,
          onClick: (row) => {
            void triggerBackupDownload(row.filename);
          },
          tone: "primary",
        },
        {
          label: "Import",
          icon: <RestoreActionIcon />,
          onClick: (row) => {
            if (isImporting || isExporting) {
              return;
            }

            setPendingImport({
              type: "stored",
              filename: row.filename,
              itemLabel: row.display_name,
            });
          },
          tone: "danger",
        },
      ],
    },
  ];

  useEffect(() => {
    async function loadInitialBackups() {
      setIsLoadingBackups(true);

      try {
        const response = await listBackups();
        setBackups(response.files);
        setTotalSizeInBytes(response.totalSizeInBytes);
      } catch (error) {
        setToasts((currentValue) => [
          ...currentValue,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            duration: 4500,
            title: "Unable to load backups",
            description: getErrorMessage(error),
            tone: "error",
          },
        ]);
      } finally {
        setIsLoadingBackups(false);
      }
    }

    void loadInitialBackups();
  }, []);

  function showToast(toast: Omit<ToastItem, "id">) {
    setToasts((currentValue) => [
      ...currentValue,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        duration: 4500,
        ...toast,
      },
    ]);
  }

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  async function refreshBackups({ silent }: { silent: boolean }) {
    if (!silent) {
      setIsLoadingBackups(true);
    }

    try {
      const response = await listBackups();
      setBackups(response.files);
      setTotalSizeInBytes(response.totalSizeInBytes);
    } catch (error) {
      showToast({
        title: "Unable to load backups",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      if (!silent) {
        setIsLoadingBackups(false);
      }
    }
  }

  async function triggerBackupDownload(filename: string) {
    try {
      const backupBlob = await downloadBackup(filename);
      const downloadUrl = URL.createObjectURL(backupBlob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      showToast({
        title: "Download failed",
        description: getErrorMessage(error),
        tone: "error",
      });
    }
  }

  async function handleExport() {
    setIsExporting(true);

    try {
      const response = await exportBackup();
      setBackups((currentValue) => prependBackupFile(currentValue, response.file));
      setTotalSizeInBytes((currentValue) => currentValue + response.file.sizeInBytes);
      showToast({
        title: "Backup exported",
        description: `${formatSummary(response.summary)} The file was added to the backup list.`,
        tone: "success",
      });
      await refreshBackups({ silent: true });
    } catch (error) {
      showToast({
        title: "Export failed",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      showToast({
        title: "Choose a file first",
        description: "Select a backup SQL file before importing.",
        tone: "info",
      });
      return;
    }

    setPendingImport({
      type: "upload",
      itemLabel: selectedFile.name,
    });
  }

  async function confirmImport() {
    if (!pendingImport) {
      return;
    }

    setIsImporting(true);
    setPendingImport(null);

    try {
      const response =
        pendingImport.type === "stored"
          ? await importStoredBackup(pendingImport.filename)
          : selectedFile
            ? await importBackup(selectedFile)
            : null;

      if (!response) {
        throw new Error("No backup file selected.");
      }

      setBackups((currentValue) => prependBackupFile(currentValue, response.file));

      if (pendingImport.type === "upload") {
        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      showToast({
        title: "Backup imported",
        description: formatSummary(response.summary),
        tone: "success",
      });
      await refreshBackups({ silent: true });
    } catch (error) {
      showToast({
        title: "Import failed",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsImporting(false);
    }
  }

  const selectedFileSummary = selectedFile
    ? `${selectedFile.name} | ${formatFileSize(selectedFile.size)}`
    : "No backup file selected.";

  return (
    <>
      <PagePlaceholder
        breadcrumb="Home > Settings > Backup & Recovery"
        sectionLabel="Database maintenance"
        title="Backup & Recovery"
      >
        <BackupControlsSection
          backupsCount={backups.length}
          fileInputRef={fileInputRef}
          isExporting={isExporting}
          isImporting={isImporting}
          onExport={handleExport}
          onFileChange={setSelectedFile}
          onImport={handleImport}
          selectedFileSummary={selectedFileSummary}
          totalSizeLabel={formatFileSize(totalSizeInBytes)}
        />

        <section className="rounded-md border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Stored Backup Files</h2>
              <p className="text-sm text-muted">
                Download exported or imported snapshots kept in backend storage.
              </p>
            </div>
            <Button
              disabled={isLoadingBackups}
              onClick={() => void refreshBackups({ silent: false })}
              variant="secondary"
            >
              Refresh list
            </Button>
          </div>

          <div className="p-5">
            <Table
              columns={backupColumns}
              data={backupRows}
              emptyMessage={
                isLoadingBackups
                  ? "Loading backup files..."
                  : "No stored backups yet. Export a database backup to create the first file."
              }
              rowKey={(row) => row.id}
              searchPlaceholder="Search backup file, source, or timestamp"
            />
          </div>
        </section>
      </PagePlaceholder>

      <ConfirmModal
        cancelLabel="Cancel"
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700 focus-visible:outline-rose-600"
        confirmLabel={isImporting ? "Importing..." : "Proceed with Import"}
        description="This will replace the current database contents using"
        emphasisMessage="Continue only if this SQL backup file is verified and intended for this system."
        emphasisTone="danger"
        isOpen={pendingImport !== null}
        itemLabel={pendingImport?.itemLabel ?? "the selected backup file"}
        onClose={() => {
          if (isImporting) {
            return;
          }

          setPendingImport(null);
        }}
        onConfirm={() => void confirmImport()}
        title="Confirm Backup Import"
      />

      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </>
  );
}
