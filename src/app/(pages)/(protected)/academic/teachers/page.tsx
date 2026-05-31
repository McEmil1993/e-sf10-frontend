"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import UserViewModal from "@/app/components/User/UserViewModal";
import { formatDate } from "@/app/lib/display";
import type { AcademicRecord } from "@/app/types/academicTypes";
import type { ModalField, ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import type { AdminUser } from "@/app/types/userTypes";
import {
  createAcademicRecord,
  deleteAcademicRecord,
  listAcademicRecords,
  updateAcademicRecord,
} from "@/app/utils/academicApi";
import { listPositions, listUsers } from "@/app/utils/api";
import { normalizeUserRecord } from "@/app/utils/usersApi";

type TeacherRecord = AcademicRecord & {
  userId: number;
  teacherName?: string;
  email?: string;
  username?: string;
  position?: string;
};

type TeacherTableRow = {
  id: number;
  userId: number;
  name: string;
  email: string;
  position: string;
  avatar?: string;
  updatedAt: string;
};

type DialogState = {
  mode: "add" | "view" | "edit";
  teacherId: number | null;
};

const emptyFormValues = {
  userId: "",
};
const capacityCountedEnrollmentStatuses = new Set(["enrolled", "transferred_in"]);

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLookupText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isActiveAcademicRecord(record: AcademicRecord) {
  const deletedAt = record.deletedAt ?? record.deleted_at;
  return deletedAt === null || deletedAt === undefined || deletedAt === "";
}

function isRecordLinkedToCurrentSchoolYear(record: AcademicRecord) {
  return record.schoolYearIsActive === true || record.schoolYearIsActive === 1 || record.schoolYearIsActive === "true";
}

function getRecordNumber(record: AcademicRecord, key: string) {
  const value = record[key];
  const parsedValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isEligiblePositionCategory(category: string) {
  const normalizedCategory = normalizeLookupText(category);
  return normalizedCategory === "teaching" || normalizedCategory === "school administration";
}

function buildTeachingUserOptions(users: AdminUser[], positions: Awaited<ReturnType<typeof listPositions>>) {
  const eligiblePositions = new Set(
    positions
      .filter((position) => isEligiblePositionCategory(position.category))
      .flatMap((position) => [
        normalizeLookupText(position.acronym),
        normalizeLookupText(position.fullPosition),
      ])
      .filter(Boolean),
  );

  return users
    .filter((user) => user.status === "active" && eligiblePositions.has(normalizeLookupText(user.position)))
    .map((user) => ({
      label: [user.name, user.position, user.email].filter(Boolean).join(" - "),
      value: String(user.id),
    }))
    .sort((firstOption, secondOption) => firstOption.label.localeCompare(secondOption.label));
}

function normalizeTeacherRecord(record: AcademicRecord): TeacherRecord {
  return {
    ...record,
    userId: Number(record.userId),
    teacherName: typeof record.teacherName === "string" ? record.teacherName : "",
    email: typeof record.email === "string" ? record.email : "",
    username: typeof record.username === "string" ? record.username : "",
    position: typeof record.position === "string" ? record.position : "",
  };
}

function safeFormatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatDate(value);
}

function buildTeacherFields(userOptions: ModalFieldOption[]): ModalField[] {
  return [
    {
      name: "userId",
      label: "Teacher / Adviser User",
      type: "lookup",
      options: userOptions,
      placeholder: "Search user by name, position, or email",
      required: true,
    },
  ];
}

function matchesSearch(row: TeacherTableRow, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [row.name, row.email, row.position, row.updatedAt]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

export default function AcademicTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sections, setSections] = useState<AcademicRecord[]>([]);
  const [enrollments, setEnrollments] = useState<AcademicRecord[]>([]);
  const [userOptions, setUserOptions] = useState<ModalFieldOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteState, setDeleteState] = useState<{ teacherId: number } | null>(null);
  const [formValues, setFormValues] = useState(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTeachers() {
      try {
        setIsLoading(true);
        const [teacherData, userData, positionData, sectionData, enrollmentData] = await Promise.all([
          listAcademicRecords("teachers"),
          listUsers(),
          listPositions(),
          listAcademicRecords("sections"),
          listAcademicRecords("enrollments"),
        ]);

        if (!isMounted) {
          return;
        }

        const normalizedUsers = userData.map(normalizeUserRecord);
        setTeachers(teacherData.filter(isActiveAcademicRecord).map(normalizeTeacherRecord));
        setUsers(normalizedUsers);
        setSections(sectionData.filter(isActiveAcademicRecord));
        setEnrollments(enrollmentData.filter(isActiveAcademicRecord));
        setUserOptions(buildTeachingUserOptions(normalizedUsers, positionData));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "error",
          title: "Unable to load teachers / advisers.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === dialogState?.teacherId) ?? null,
    [dialogState?.teacherId, teachers],
  );

  const deleteTargetTeacher = useMemo(
    () => teachers.find((teacher) => teacher.id === deleteState?.teacherId) ?? null,
    [deleteState?.teacherId, teachers],
  );

  const viewUser = useMemo(
    () => users.find((user) => user.id === selectedTeacher?.userId) ?? null,
    [selectedTeacher?.userId, users],
  );

  const teacherHandledFields = useMemo(() => {
    const handledSection = sections.find(
      (section) =>
        selectedTeacher &&
        isRecordLinkedToCurrentSchoolYear(section) &&
        getRecordNumber(section, "adviserId") === Number(selectedTeacher.id),
    );

    if (!handledSection) {
      return [
        { label: "Handled Section", value: "-" },
        { label: "Students", value: "-" },
      ];
    }

    const schoolYearName = typeof handledSection.schoolYearName === "string" ? handledSection.schoolYearName : "";
    const gradeLevel = handledSection.gradeLevel ? `Grade ${handledSection.gradeLevel}` : "";
    const sectionName = typeof handledSection.sectionName === "string" ? handledSection.sectionName : "";
    const handledSectionLabel = [schoolYearName, gradeLevel, sectionName].filter(Boolean).join(" - ") || "-";
    const sectionId = Number(handledSection.id);
    const studentCount = enrollments.filter((enrollment) => {
      const enrollmentStatus = typeof enrollment.status === "string" ? enrollment.status : "";

      return (
        getRecordNumber(enrollment, "sectionId") === sectionId &&
        capacityCountedEnrollmentStatuses.has(enrollmentStatus)
      );
    }).length;
    const capacityLimit = getRecordNumber(handledSection, "capacityLimit");
    const studentCountLabel =
      capacityLimit === null ? `${studentCount} students` : `${studentCount} of ${capacityLimit} students`;

    return [
      { label: "Handled Section", value: handledSectionLabel },
      { label: "Students", value: studentCountLabel },
    ];
  }, [enrollments, sections, selectedTeacher]);

  const teacherBasicInformationFields = useMemo(
    () => [
      { label: "Username", value: viewUser?.username?.trim() || "-" },
      { label: "Joined", value: safeFormatDate(viewUser?.created_at) },
    ],
    [viewUser?.created_at, viewUser?.username],
  );

  const teacherSectionDetails = useMemo(
    () => [
      {
        title: "Section",
        columns: 2 as const,
        fields: teacherHandledFields,
      },
    ],
    [teacherHandledFields],
  );

  const activeTeacherUserIds = useMemo(
    () => new Set(teachers.map((teacher) => teacher.userId)),
    [teachers],
  );

  const availableUserOptions = useMemo(
    () =>
      userOptions.filter((option) => {
        const userId = Number(option.value);
        return userId === selectedTeacher?.userId || !activeTeacherUserIds.has(userId);
      }),
    [activeTeacherUserIds, selectedTeacher?.userId, userOptions],
  );

  const teacherFields = useMemo(() => buildTeacherFields(availableUserOptions), [availableUserOptions]);

  const tableRows = useMemo<TeacherTableRow[]>(() => {
    const userById = new Map(users.map((user) => [user.id, user]));

    return teachers.map((teacher) => {
      const linkedUser = userById.get(teacher.userId);

      return {
        id: Number(teacher.id),
        userId: teacher.userId,
        name: linkedUser?.name ?? teacher.teacherName ?? "-",
        email: linkedUser?.email ?? teacher.email ?? "-",
        position: linkedUser?.position ?? teacher.position ?? "-",
        avatar: linkedUser?.avatar ?? linkedUser?.profile_picture ?? "",
        updatedAt: safeFormatDate(teacher.updatedAt),
      };
    });
  }, [teachers, users]);

  const filteredRows = useMemo(
    () => tableRows.filter((row) => matchesSearch(row, searchTerm)),
    [searchTerm, tableRows],
  );

  const totalEntries = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

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

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  function openAddModal() {
    setFormValues(emptyFormValues);
    setDialogState({ mode: "add", teacherId: null });
  }

  function openViewModal(teacherId: number) {
    const teacher = teachers.find((item) => item.id === teacherId) ?? null;
    setFormValues({ userId: teacher ? String(teacher.userId) : "" });
    setDialogState({ mode: "view", teacherId });
  }

  function openEditModal(teacherId: number) {
    const teacher = teachers.find((item) => item.id === teacherId) ?? null;
    setFormValues({ userId: teacher ? String(teacher.userId) : "" });
    setDialogState({ mode: "edit", teacherId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  async function handleSaveTeacher() {
    if (!dialogState) {
      return;
    }

    const userId = Number(formValues.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      showToast({
        tone: "error",
        title: "Select a teacher / adviser user.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const createdTeacher = await createAcademicRecord("teachers", { userId });

        setTeachers((currentTeachers) => [normalizeTeacherRecord(createdTeacher), ...currentTeachers]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "Teacher / adviser added successfully.",
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.teacherId !== null) {
        const updatedTeacher = await updateAcademicRecord("teachers", dialogState.teacherId, { userId });

        setTeachers((currentTeachers) =>
          currentTeachers.map((teacher) =>
            teacher.id === dialogState.teacherId ? normalizeTeacherRecord(updatedTeacher) : teacher,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "Teacher / adviser updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save teacher / adviser.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTeacher() {
    if (!deleteState?.teacherId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteAcademicRecord("teachers", deleteState.teacherId);
      setTeachers((currentTeachers) =>
        currentTeachers.filter((teacher) => teacher.id !== deleteState.teacherId),
      );
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "Teacher / adviser deleted successfully.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete teacher / adviser.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<TeacherTableRow>[] = [
    {
      key: "name",
      header: "Name",
      type: "stacked",
      showAvatar: true,
      avatarImageKey: "avatar",
      avatarFallbackKey: "name",
      secondaryKey: "email",
      valueClassName: "font-semibold text-slate-950",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "position",
      header: "Position",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "email",
      header: "Email",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "updatedAt",
      header: "Updated",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "actions",
      header: "Actions",
      type: "actions",
      className: "whitespace-nowrap",
      headerClassName: "w-[140px]",
      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row) => openViewModal(Number(row.id)),
          tone: "primary",
        },
        {
          label: "Edit",
          icon: <EditIcon />,
          onClick: (row) => openEditModal(Number(row.id)),
        },
        {
          label: "Delete",
          icon: <DeleteIcon />,
          onClick: (row) => setDeleteState({ teacherId: Number(row.id) }),
          tone: "danger",
        },
      ],
    },
  ];

  return (
    <PagePlaceholder
      breadcrumb="Home > Settings > Teachers"
      sectionLabel="SF10 academic records"
      title="Teachers / Advisers"
    >
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add Teacher / Adviser
          </Button>
        </div>
        <Table
          columns={columns}
          data={paginatedRows}
          emptyMessage={isLoading ? "Loading teachers / advisers..." : "No teachers / advisers found."}
          pagination={{
            page: safeCurrentPage,
            perPage: pageSize,
            total: totalEntries,
            totalPages,
            onPageChange: setCurrentPage,
            onPageSizeChange: (value) => {
              setPageSize(value);
              setCurrentPage(1);
            },
          }}
          search={{
            value: searchTerm,
            onChange: (value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            },
          }}
          searchPlaceholder="Search teachers / advisers"
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={1}
        fields={teacherFields}
        fieldClassName="space-y-1.5"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 gap-y-4"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState) && dialogState?.mode !== "view"}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={(name, value) => setFormValues((currentValue) => ({ ...currentValue, [name]: value }))}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveTeacher}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="md"
        submitLabel={
          isSubmitting
            ? "Saving..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create Teacher / Adviser"
        }
        title={
          dialogState?.mode === "edit"
            ? "Edit Teacher / Adviser"
            : "Add Teacher / Adviser"
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <UserViewModal
        basicInformationExtraFields={teacherBasicInformationFields}
        detailSectionsAfterBasic={teacherSectionDetails}
        isOpen={dialogState?.mode === "view"}
        onClose={closeDialog}
        sidebarInfoItems={null}
        title="View Teacher / Adviser"
        user={viewUser}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteTargetTeacher?.teacherName ?? "this teacher / adviser"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher / Adviser"
      />
    </PagePlaceholder>
  );
}
