"use client";

import { useEffect, useMemo, useState } from "react";
import ViewDetailsModal, { type ViewDetailsSectionItem } from "@/app/components/Modal/ViewDetailsModal";
import UserAvatar from "@/app/components/User/UserAvatar";
import { formatDate } from "@/app/lib/display";
import type { AcademicRecord } from "@/app/types/academicTypes";
import type { StudentGuardianRecord } from "@/app/types/studentGuardianTypes";
import { listStudentGuardians } from "@/app/utils/api";

type EnrollmentViewModalProps = {
  enrollment: AcademicRecord | null;
  isOpen: boolean;
  onClose: () => void;
};

function displayValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || "-";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "-";
}

function displayDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDate(value);
}

function calculateAge(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }

  const birthdate = new Date(value);

  if (Number.isNaN(birthdate.getTime())) {
    return "-";
  }

  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? `${age} years old` : "-";
}

function humanizeStatus(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getGradeSection(enrollment: AcademicRecord) {
  if (typeof enrollment.gradeSection === "string" && enrollment.gradeSection.trim()) {
    return enrollment.gradeSection;
  }

  const gradeLevel = enrollment.gradeLevel ? `Grade ${enrollment.gradeLevel}` : "Grade -";
  const sectionName = displayValue(enrollment.sectionName);

  return `${gradeLevel} - ${sectionName}`;
}

function getGuardianAddress(relation: StudentGuardianRecord) {
  const { guardian } = relation;

  return [
    guardian.address,
    guardian.barangay,
    guardian.municipality_city,
    guardian.province,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function EnrollmentOverviewSidebar({ enrollment }: { enrollment: AcademicRecord }) {
  const studentName = displayValue(enrollment.studentName);
  const profilePicture = typeof enrollment.profilePicture === "string" ? enrollment.profilePicture : "";

  return (
    <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Enrollment Overview</p>

        <div className="mt-6 flex items-start gap-3">
          <UserAvatar
            className="h-14 w-14"
            imageClassName="ring-1 ring-border"
            name={studentName}
            src={profilePicture}
          />
          <div className="min-w-0">

            <p className="mt-2 text-lg font-semibold leading-snug text-slate-950">{studentName}</p>
            <p className="mt-1 text-sm text-muted">LRN {displayValue(enrollment.lrn)}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-slate-50 p-5">
        <div className="rounded-[5px] border border-border bg-slate-100 p-4">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Birthdate</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{displayDate(enrollment.birthdate)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Age</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{calculateAge(enrollment.birthdate)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuardianList({
  errorMessage,
  guardians,
  isLoading,
}: {
  errorMessage: string;
  guardians: StudentGuardianRecord[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[5px] border border-dashed border-border bg-background px-4 py-6 text-sm text-muted">
        Loading guardian details...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  if (guardians.length === 0) {
    return (
      <div className="rounded-[5px] border border-dashed border-border bg-background px-4 py-6 text-center">
        <p className="text-sm font-medium text-slate-700">No guardian assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {guardians.map((relation) => (
        <article className="rounded-[5px] border border-border bg-background p-4" key={relation.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-950">{relation.guardian.full_name}</h4>
              <div className="mt-2 flex flex-wrap gap-2">
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
            <div className="text-sm font-semibold text-slate-800">{relation.guardian.contact_number || "-"}</div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{getGuardianAddress(relation) || "-"}</p>
        </article>
      ))}
    </div>
  );
}

export default function EnrollmentViewModal({
  enrollment,
  isOpen,
  onClose,
}: EnrollmentViewModalProps) {
  const [guardians, setGuardians] = useState<StudentGuardianRecord[]>([]);
  const [guardianError, setGuardianError] = useState("");
  const [isLoadingGuardians, setIsLoadingGuardians] = useState(false);
  const studentId = typeof enrollment?.studentId === "number" ? enrollment.studentId : Number(enrollment?.studentId);

  useEffect(() => {
    if (!isOpen || !enrollment || !Number.isInteger(studentId) || studentId <= 0) {
      return undefined;
    }

    let isMounted = true;

    async function loadGuardians() {
      try {
        setIsLoadingGuardians(true);
        setGuardianError("");
        const relations = await listStudentGuardians(studentId);

        if (isMounted) {
          setGuardians(relations);
        }
      } catch (error) {
        if (isMounted) {
          setGuardianError(error instanceof Error ? error.message : "Unable to load guardian details.");
          setGuardians([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingGuardians(false);
        }
      }
    }

    void loadGuardians();

    return () => {
      isMounted = false;
    };
  }, [enrollment, isOpen, studentId]);

  const sortedGuardians = useMemo(
    () =>
      guardians
        .slice()
        .sort((firstRelation, secondRelation) => {
          if (firstRelation.is_primary !== secondRelation.is_primary) {
            return firstRelation.is_primary ? -1 : 1;
          }

          return firstRelation.guardian.full_name.localeCompare(secondRelation.guardian.full_name);
        }),
    [guardians],
  );

  if (!enrollment) {
    return null;
  }

  const sections: ViewDetailsSectionItem[] = [
    {
      title: "Enrollment Details",
      columns: 3,
      fields: [
        { label: "Grade & Section", value: getGradeSection(enrollment) },
        { label: "School Year", value: displayValue(enrollment.schoolYearName) },
        { label: "Adviser", value: displayValue(enrollment.adviserName) },
        { label: "Admission Type", value: humanizeStatus(enrollment.admissionType) },
        { label: "Enrollment Status", value: humanizeStatus(enrollment.status) },
        { label: "Completion", value: humanizeStatus(enrollment.completionStatus) },
        { label: "Enrollment Date", value: displayDate(enrollment.enrollmentDate) },
        { label: "Updated", value: displayDate(enrollment.updatedAt) },
      ],
    },
    ...(enrollment.admissionType === "transferee_in"
      ? [
          {
            title: "Transfer Details",
            columns: 2 as const,
            fields: [
              { label: "Previous School", value: displayValue(enrollment.previousSchoolName) },
              { label: "Previous School ID", value: displayValue(enrollment.previousSchoolIdText) },
              {
                label: "Previous Grade",
                value: enrollment.previousGradeLevel ? `Grade ${enrollment.previousGradeLevel}` : "-",
              },
              { label: "Transfer In Date", value: displayDate(enrollment.transferInDate) },
              { label: "Documents Submitted", value: displayValue(enrollment.documentsSubmitted), colSpan: "full" as const },
            ],
          },
        ]
      : []),
    {
      title: "Guardian",
      columns: 1,
      fields: [
        {
          label: "Assigned Guardian",
          value: (
            <GuardianList
              errorMessage={guardianError}
              guardians={sortedGuardians}
              isLoading={isLoadingGuardians}
            />
          ),
          valueClassName: "mt-3",
          colSpan: "full",
        },
      ],
    },
  ];

  return (
    <ViewDetailsModal
      isOpen={isOpen}
      onClose={onClose}
      sections={sections}
      sidebar={<EnrollmentOverviewSidebar enrollment={enrollment} />}
      title="View Enrollment"
    />
  );
}
