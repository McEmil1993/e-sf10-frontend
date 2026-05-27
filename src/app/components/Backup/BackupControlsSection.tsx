"use client";

import type { RefObject } from "react";
import BackupPanelCard from "@/app/components/Backup/BackupPanelCard";
import Button from "@/app/components/Button/Button";
import Input from "@/app/components/Input/Input";

type BackupControlsSectionProps = {
  backupsCount: number;
  totalSizeLabel: string;
  selectedFileSummary: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isExporting: boolean;
  isImporting: boolean;
  onExport: () => void;
  onImport: () => void;
  onFileChange: (file: File | null) => void;
};

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function BackupControlsSection({
  backupsCount,
  fileInputRef,
  isExporting,
  isImporting,
  onExport,
  onFileChange,
  onImport,
  selectedFileSummary,
  totalSizeLabel,
}: BackupControlsSectionProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <BackupPanelCard
        badgeClassName="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800"
        badgeLabel="Export"
        description="Generate a fresh export of users, students, positions, and RBAC data."
        footer={
          <Button disabled={isExporting || isImporting} onClick={onExport}>
            {isExporting ? "Exporting database..." : "Export Database Backup"}
          </Button>
        }
        title="Create Backup"
      >
        <div className="grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2">
          <SummaryStat label="Stored backups" value={backupsCount} />
          <SummaryStat label="Total storage" value={totalSizeLabel} />
        </div>
      </BackupPanelCard>

      <BackupPanelCard
        badgeClassName="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800"
        badgeLabel="Import"
        description="Upload a previously exported MySQL `.sql` backup file to restore the database."
        footer={
          <Button disabled={isExporting || isImporting} onClick={onImport}>
            {isImporting ? "Importing backup..." : "Import and Restore Backup"}
          </Button>
        }
        title="Restore Backup"
      >
        <div className="space-y-3">
          <Input
            ref={fileInputRef}
            accept=".sql,text/plain,application/sql"
            helperText={selectedFileSummary}
            id="backup-file"
            inputSize="xs"
            label="Backup file"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>
      </BackupPanelCard>
    </section>
  );
}
