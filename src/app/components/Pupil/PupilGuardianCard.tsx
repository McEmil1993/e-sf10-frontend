import { DeleteIcon, EditIcon } from "@/app/components/Icon/UserActionIcons";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import DetailItem from "@/app/components/RecordView/DetailItem";
import { getInitials } from "@/app/lib/display";
import type { PupilGuardianRecord } from "@/app/types/pupilGuardianTypes";

type PupilGuardianCardProps = {
  isBusy?: boolean;
  onDelete: () => void;
  onEdit: () => void;
  relation: PupilGuardianRecord;
};

export default function PupilGuardianCard({
  isBusy = false,
  onDelete,
  onEdit,
  relation,
}: PupilGuardianCardProps) {
  const { guardian } = relation;
  const combinedAddress = [
    guardian.address,
    guardian.barangay,
    guardian.municipality_city,
    guardian.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-[5px] border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            <span>{getInitials(guardian.full_name)}</span>
            <AuthenticatedImage
              alt={guardian.full_name}
              className="absolute inset-0 h-full w-full object-cover"
              src={guardian.avatar ?? ""}
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-950">{guardian.full_name}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-[5px] bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                {relation.relationship}
              </span>
              {relation.is_primary ? (
                <span className="inline-flex rounded-[5px] bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Primary Guardian
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={`Edit ${guardian.full_name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-border bg-card text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={onEdit}
            title="Update guardian relation"
            type="button"
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            aria-label={`Remove ${guardian.full_name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={onDelete}
            title="Remove guardian relation"
            type="button"
          >
            <DeleteIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-6 xl:grid-cols-6">
        <DetailItem label="Contact Number" value={guardian.contact_number || "-"} />
        <DetailItem
          label="Address"
          value={combinedAddress || "-"}
          className="md:col-span-2 xl:col-span-3"
        />
      </div>
    </article>
  );
}
