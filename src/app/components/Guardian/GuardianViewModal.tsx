"use client";

import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import { EditIcon } from "@/app/components/Icon/UserActionIcons";
import ViewDetailsModal, { type ViewDetailsSectionItem } from "@/app/components/Modal/ViewDetailsModal";
import { formatDate } from "@/app/lib/display";
import type { GuardianRecord } from "@/app/types/guardianTypes";

type GuardianViewModalProps = {
  isOpen: boolean;
  guardian: GuardianRecord | null;
  onClose: () => void;
  onEdit?: (guardianId: number) => void;
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

function getLocation(guardian: GuardianRecord) {
  return [guardian.barangay, guardian.municipality_city, guardian.province]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
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

function GuardianAvatarPreview({ guardian }: { guardian: GuardianRecord }) {
  const imagePath = guardian.avatar ?? guardian.profile_picture ?? "";

  return (
    <AuthenticatedImage
      alt={guardian.full_name}
      className="h-[102px] w-[102px] rounded-[4px] object-cover"
      fallback={
        <div className="flex h-[102px] w-[102px] items-center justify-center rounded-[4px] bg-slate-200 text-3xl font-semibold text-slate-600">
          {guardian.full_name.trim().charAt(0).toUpperCase() || "?"}
        </div>
      }
      src={imagePath}
    />
  );
}

function GuardianProfileSidebar({
  guardian,
  onEdit,
}: {
  guardian: GuardianRecord;
  onEdit?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Profile Overview</p>
            <h3 className="mt-3 text-base font-semibold text-slate-950">Guardian Card</h3>
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
          <GuardianAvatarPreview guardian={guardian} />
        </div>

        <div className="mt-5">
          <h2 className="text-xl font-semibold leading-tight text-slate-950">{displayValue(guardian.full_name)}</h2>
          <p className="mt-1 text-sm text-muted">Guardian</p>
        </div>

        <div className="mt-4">
          <span className="inline-flex rounded bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-100">
            Contact Profile
          </span>
        </div>
      </div>

      <div className="border-t border-border bg-slate-50 p-5">
        <div className="rounded-[5px] border border-border bg-slate-100 p-4">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Contact Number</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{displayValue(guardian.contact_number)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Location</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{displayValue(getLocation(guardian))}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Created</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{safeFormatDate(guardian.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GuardianViewModal({
  guardian,
  isOpen,
  onClose,
  onEdit,
}: GuardianViewModalProps) {
  if (!guardian) {
    return null;
  }

  const handleEdit = onEdit ? () => onEdit(guardian.id) : undefined;

  const sections: ViewDetailsSectionItem[] = [
    {
      title: "Basic Information",
      action: <EditSectionButton onClick={handleEdit} />,
      columns: 2,
      fields: [
        { label: "Full Name", value: displayValue(guardian.full_name) },
        { label: "Contact Number", value: displayValue(guardian.contact_number) },
        { label: "First Name", value: displayValue(guardian.first_name) },
        { label: "Middle Name", value: displayValue(guardian.middle_name) },
        { label: "Last Name", value: displayValue(guardian.last_name) },
        { label: "Suffix", value: displayValue(guardian.suffix) },
        { label: "Created", value: safeFormatDate(guardian.created_at) },
        { label: "Updated", value: safeFormatDate(guardian.updated_at) },
      ],
    },
    {
      title: "Address",
      action: <EditSectionButton onClick={handleEdit} />,
      columns: 4,
      fields: [
        { label: "Region", value: displayValue(guardian.region) },
        { label: "Province", value: displayValue(guardian.province) },
        { label: "Municipality / City", value: displayValue(guardian.municipality_city) },
        { label: "Barangay", value: displayValue(guardian.barangay) },
        { label: "Address", value: displayValue(guardian.address), colSpan: "full" },
      ],
    },
  ];

  return (
    <ViewDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      sections={sections}
      sidebar={<GuardianProfileSidebar guardian={guardian} onEdit={handleEdit} />}
      title="View Guardian"
    />
  );
}
