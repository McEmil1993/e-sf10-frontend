"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import SubjectViewModal from "@/app/components/Subject/SubjectViewModal";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import type { ModalField, ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type {
  SubjectFormValues,
  SubjectRecord,
  SubjectTableRow,
} from "@/app/types/subjectTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import { createSubject, deleteSubject, listSubjects, updateSubject } from "@/app/utils/api";
import {
  createSubjectsResponse,
  toSubjectTableRow,
} from "@/app/utils/subjectsApi";

type DialogMode = "add" | "view" | "edit";

type SubjectDialogState = {
  mode: DialogMode;
  subjectId: number | null;
};

type SubjectDeleteState = {
  subjectId: number;
};

const gradeOptions: ModalFieldOption[] = [1, 2, 3, 4, 5, 6].map((gradeLevel) => ({
  label: `Grade ${gradeLevel}`,
  value: String(gradeLevel),
}));

const subjectGroupOptions: ModalFieldOption[] = [
  { label: "Core", value: "Core" },
  { label: "MAPEH", value: "MAPEH" },
  { label: "EPP / TLE", value: "EPP / TLE" },
  { label: "ALIVE Program", value: "ALIVE Program" },
];

const booleanOptions: ModalFieldOption[] = [
  { label: "No", value: "false" },
  { label: "Yes", value: "true" },
];

const statusOptions: ModalFieldOption[] = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const emptyFormValues: SubjectFormValues = {
  name: "",
  subject_group: "Core",
  grade_levels: "1,2,3,4,5,6",
  is_optional: "false",
  is_active: "true",
  sort_order: "0",
};

const requiredToneMap = {
  Required: "bg-emerald-50 text-emerald-700",
  Optional: "bg-amber-50 text-amber-700",
};

const statusToneMap = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Inactive: "bg-slate-100 text-slate-700 ring-slate-200",
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeGradeLevels(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 6),
    ),
  ).sort((firstValue, secondValue) => firstValue - secondValue);
}

function normalizeFormValues(subject: SubjectRecord | null): SubjectFormValues {
  if (!subject) {
    return emptyFormValues;
  }

  return {
    name: subject.name,
    subject_group: subject.subject_group || "Core",
    grade_levels: subject.grade_levels.join(","),
    is_optional: String(subject.is_optional),
    is_active: String(subject.is_active),
    sort_order: String(subject.sort_order),
  };
}

function buildSubjectFields(): ModalField[] {
  return [
    {
      name: "grade_levels",
      label: "Grade Levels",
      type: "checkbox-group",
      options: gradeOptions,
      checkboxStyle: "pill",
      layoutClassName: "md:col-span-6 xl:col-span-12",
    },
    {
      name: "name",
      label: "Subject Name",
      placeholder: "Mathematics",
      required: true,
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    {
      name: "subject_group",
      label: "Subject Group",
      type: "select",
      options: subjectGroupOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "sort_order",
      label: "Sort Order",
      placeholder: "1",
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "is_optional",
      label: "Optional Subject",
      type: "select",
      options: booleanOptions,
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    {
      name: "is_active",
      label: "Status",
      type: "select",
      options: statusOptions,
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
  ];
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<SubjectDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<SubjectDeleteState | null>(null);
  const [formValues, setFormValues] = useState<SubjectFormValues>(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectsResponse = useMemo(
    () =>
      createSubjectsResponse(subjects, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "sort_order",
        sortOrder: "asc",
        basePath: "/subjects",
      }),
    [currentPage, pageSize, searchTerm, subjects],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSubjects() {
      try {
        setIsLoading(true);
        const subjectData = await listSubjects();

        if (!isMounted) {
          return;
        }

        setSubjects(subjectData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "error",
          title: "Unable to load subjects.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectFields = useMemo(() => buildSubjectFields(), []);

  const deleteTargetSubject = useMemo(
    () => subjects.find((subject) => subject.id === deleteState?.subjectId) ?? null,
    [deleteState?.subjectId, subjects],
  );

  const viewSubject = useMemo(
    () => subjects.find((subject) => subject.id === dialogState?.subjectId) ?? null,
    [dialogState?.subjectId, subjects],
  );

  const tableSubjects: SubjectTableRow[] = useMemo(
    () => subjectsResponse.data.map(toSubjectTableRow),
    [subjectsResponse.data],
  );

  function showToast({
    description,
    duration,
    title,
    tone = "info",
  }: Omit<ToastItem, "id">) {
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
    setFormValues({
      ...emptyFormValues,
      sort_order: String(subjects.length + 1),
    });
    setDialogState({
      mode: "add",
      subjectId: null,
    });
  }

  function openViewModal(subjectId: number) {
    const subject = subjects.find((item) => item.id === subjectId) ?? null;
    setFormValues(normalizeFormValues(subject));
    setDialogState({
      mode: "view",
      subjectId,
    });
  }

  function openEditModal(subjectId: number) {
    const subject = subjects.find((item) => item.id === subjectId) ?? null;
    setFormValues(normalizeFormValues(subject));
    setDialogState({
      mode: "edit",
      subjectId,
    });
  }

  function openDeleteModal(subjectId: number) {
    setDeleteState({ subjectId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function handleFieldChange(name: string, value: string) {
    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function buildSubjectPayload() {
    const gradeLevels = normalizeGradeLevels(formValues.grade_levels);
    const sortOrder = Number(formValues.sort_order);

    if (gradeLevels.length === 0) {
      throw new Error("Select at least one grade level.");
    }

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new Error("Sort order must be a non-negative number.");
    }

    return {
      name: formValues.name.trim(),
      subjectGroup: formValues.subject_group.trim() || null,
      gradeLevels,
      isOptional: formValues.is_optional === "true",
      isActive: formValues.is_active === "true",
      sortOrder,
    };
  }

  async function handleSaveSubject() {
    if (!dialogState) {
      return;
    }

    let payload: ReturnType<typeof buildSubjectPayload>;

    try {
      payload = buildSubjectPayload();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Invalid subject details.",
        description: error instanceof Error ? error.message : "Please review the form values.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const createdSubject = await createSubject(payload);

        setSubjects((currentSubjects) => [createdSubject, ...currentSubjects]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "Subject created successfully.",
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.subjectId !== null) {
        const updatedSubject = await updateSubject(dialogState.subjectId, payload);

        setSubjects((currentSubjects) =>
          currentSubjects.map((currentSubject) =>
            currentSubject.id === dialogState.subjectId ? updatedSubject : currentSubject,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "Subject updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save the subject.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSubject() {
    if (!deleteState?.subjectId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteSubject(deleteState.subjectId);
      setSubjects((currentSubjects) =>
        currentSubjects.filter((subject) => subject.id !== deleteState.subjectId),
      );
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "Subject deleted successfully.",
        description: deleteTargetSubject?.name
          ? `${deleteTargetSubject.name} was removed from the list.`
          : undefined,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete the subject.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<SubjectTableRow>[] = [
    {
      key: "name",
      header: "Subject",
      type: "stacked",
      secondaryKey: "subject_group",
      valueClassName: "font-semibold text-slate-950",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "grade_levels",
      header: "Grade Levels",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "is_optional",
      header: "Type",
      type: "badge",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold",
      toneMap: requiredToneMap,
    },
    {
      key: "is_active",
      header: "Status",
      type: "badge",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset",
      toneMap: statusToneMap,
    },
    {
      key: "sort_order",
      header: "Order",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "updated_at",
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
          onClick: (row) => openDeleteModal(Number(row.id)),
          tone: "danger",
        },
      ],
    },
  ];

  return (
    <PagePlaceholder breadcrumb="Home > Settings > Subjects" title="Subjects">
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted">
            SF10 elementary subjects for Grade 1 to Grade 6.
          </div>
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add Subject
          </Button>
        </div>

        <Table
          columns={columns}
          data={tableSubjects}
          emptyMessage={isLoading ? "Loading subjects..." : "No subjects found."}
          pagination={{
            page: subjectsResponse.meta.page,
            perPage: subjectsResponse.meta.per_page,
            total: subjectsResponse.meta.total,
            totalPages: subjectsResponse.meta.total_pages,
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
          searchPlaceholder="Search subject, group, grade, or status"
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        fields={subjectFields}
        fieldClassName="space-y-1.5"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min gap-x-4 gap-y-4"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState) && dialogState?.mode !== "view"}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveSubject}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={
          isSubmitting
            ? dialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create Subject"
        }
        title={
          dialogState?.mode === "view"
            ? "View Subject"
            : dialogState?.mode === "edit"
              ? "Edit Subject"
              : "Add Subject"
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <SubjectViewModal
        isOpen={dialogState?.mode === "view"}
        onClose={closeDialog}
        onEdit={openEditModal}
        subject={viewSubject}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteTargetSubject?.name ?? "this subject"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
      />
    </PagePlaceholder>
  );
}
