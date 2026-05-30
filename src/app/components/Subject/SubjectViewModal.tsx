"use client";

import { EditIcon } from "@/app/components/Icon/UserActionIcons";
import ViewDetailsModal, { type ViewDetailsSectionItem } from "@/app/components/Modal/ViewDetailsModal";
import { formatDate } from "@/app/lib/display";
import type { SubjectRecord } from "@/app/types/subjectTypes";
import { formatSubjectGradeLevels } from "@/app/utils/subjectsApi";

type SubjectViewModalProps = {
  isOpen: boolean;
  subject: SubjectRecord | null;
  onClose: () => void;
  onEdit?: (subjectId: number) => void;
};

function displayValue(value: string | null | undefined) {
  return value?.trim() || "-";
}

function safeFormatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatDate(value);
}

function EditSectionButton({ onClick }: { onClick?: () => void }) {
  if (!onClick) {
    return null;
  }

  return (
    <button
      className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
      onClick={onClick}
      title="Edit"
      type="button"
    >
      <EditIcon />
    </button>
  );
}

function SubjectOverviewSidebar({
  onEdit,
  subject,
}: {
  subject: SubjectRecord;
  onEdit?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Subject Overview</p>
            <h3 className="mt-3 text-base font-semibold text-slate-950">SF10 Subject Card</h3>
          </div>
          <button
            className="inline-flex h-8 items-center gap-2 rounded-[5px] border border-border bg-card px-3 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
            onClick={onEdit}
            type="button"
          >
            <EditIcon />
            Edit
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold leading-tight text-slate-950">{displayValue(subject.name)}</h2>
          <p className="mt-1 text-sm text-muted">{displayValue(subject.subject_group)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={[
              "inline-flex rounded px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              subject.is_optional
                ? "bg-amber-50 text-amber-700 ring-amber-100"
                : "bg-emerald-50 text-emerald-700 ring-emerald-100",
            ].join(" ")}
          >
            {subject.is_optional ? "Optional" : "Required"}
          </span>
          <span
            className={[
              "inline-flex rounded px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              subject.is_active
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-slate-100 text-slate-700 ring-slate-200",
            ].join(" ")}
          >
            {subject.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="border-t border-border bg-slate-50 p-5">
        <div className="rounded-[5px] border border-border bg-slate-100 p-4">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Grade Levels</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {formatSubjectGradeLevels(subject.grade_levels)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Sort Order</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{subject.sort_order}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Updated</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{safeFormatDate(subject.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SubjectViewModal({
  isOpen,
  onClose,
  onEdit,
  subject,
}: SubjectViewModalProps) {
  if (!subject) {
    return null;
  }

  const handleEdit = onEdit ? () => onEdit(subject.id) : undefined;

  const sections: ViewDetailsSectionItem[] = [
    {
      title: "Basic Information",
      action: <EditSectionButton onClick={handleEdit} />,
      columns: 2,
      fields: [
        { label: "Subject Name", value: displayValue(subject.name) },
        { label: "Subject Group", value: displayValue(subject.subject_group) },
        { label: "Grade Levels", value: formatSubjectGradeLevels(subject.grade_levels) },
        { label: "Type", value: subject.is_optional ? "Optional" : "Required" },
        { label: "Status", value: subject.is_active ? "Active" : "Inactive" },
        { label: "Sort Order", value: String(subject.sort_order) },
      ],
    },
    {
      title: "Record Details",
      action: <EditSectionButton onClick={handleEdit} />,
      columns: 2,
      fields: [
        { label: "Created", value: safeFormatDate(subject.created_at) },
        { label: "Updated", value: safeFormatDate(subject.updated_at) },
        { label: "Subject ID", value: String(subject.id) },
      ],
    },
  ];

  return (
    <ViewDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      sections={sections}
      sidebar={<SubjectOverviewSidebar onEdit={handleEdit} subject={subject} />}
      title="View Subject"
    />
  );
}
