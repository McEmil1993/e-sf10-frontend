import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import DetailItem from "@/app/components/RecordView/DetailItem";
import { formatDate, getAgeFromBirthdate, getInitials } from "@/app/lib/display";
import type { PupilRecord } from "@/app/types/pupilTypes";

type PupilSummaryCardProps = {
  pupil: PupilRecord;
};

const statusToneMap = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-amber-50 text-amber-700 ring-amber-100",
  transferred: "bg-sky-50 text-sky-700 ring-sky-100",
  graduated: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function PupilSummaryCard({ pupil }: PupilSummaryCardProps) {
  const initials = getInitials(pupil.full_name || pupil.lrn);
  const age = getAgeFromBirthdate(pupil.birthdate);

  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="bg-[linear-gradient(135deg,rgba(44,62,80,0.06),rgba(17,24,39,0.02))] px-5 py-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Pupil Overview
          </p>
          <h2 className="text-lg font-semibold text-slate-950">Learner Card</h2>
        </div>

        <div className="mt-6 space-y-4">
          <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[5px] bg-slate-100 text-3xl font-semibold text-slate-700 ring-1 ring-inset ring-border">
            <span>{initials}</span>
            <AuthenticatedImage
              alt={pupil.full_name}
              className="absolute inset-0 h-full w-full object-cover"
              src={pupil.avatar ?? ""}
            />
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">{pupil.full_name}</h3>
              <p className="text-sm text-muted">LRN: {pupil.lrn}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-[5px] bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                {pupil.sex}
              </span>
              <span
                className={[
                  "inline-flex rounded-[5px] px-3 py-1 text-xs font-semibold ring-1 ring-inset capitalize",
                  statusToneMap[pupil.status],
                ].join(" ")}
              >
                {pupil.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid gap-3 rounded-[5px] border border-border bg-background px-4 py-4">
          <DetailItem label="Age" value={age === null ? "-" : String(age)} />
          <DetailItem label="Birthdate" value={formatDate(pupil.birthdate)} />
          <DetailItem label="Birthplace" value={pupil.birthplace || "-"} />
          <DetailItem label="Created" value={formatDate(pupil.created_at)} />
        </div>
      </div>
    </section>
  );
}
