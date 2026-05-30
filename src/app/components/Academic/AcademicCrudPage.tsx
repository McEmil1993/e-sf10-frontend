"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import type { ModalField } from "@/app/types/components/modalTypes";
import type { ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import type {
  AcademicCrudConfig,
  AcademicFieldConfig,
  AcademicLookupSource,
  AcademicRecord,
} from "@/app/types/academicTypes";
import {
  createAcademicRecord,
  deleteAcademicRecord,
  listAcademicRecords,
  updateAcademicRecord,
} from "@/app/utils/academicApi";
import { listPositions, listUsers } from "@/app/utils/api";

type DialogState = {
  mode: "add" | "view" | "edit";
  recordId: number | null;
};

type TableRow = Record<string, string | number>;

const booleanOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

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

function formatValue(value: unknown, field?: AcademicFieldConfig) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (field?.valueType === "boolean") {
    const optionValue = value === true || value === 1 || value === "true" ? "true" : "false";
    return field.options?.find((option) => option.value === optionValue)?.label ?? (optionValue === "true" ? "Yes" : "No");
  }

  if (field?.valueType === "date" || field?.valueType === "datetime") {
    return formatDate(value);
  }

  return String(value);
}

function toFormValue(record: AcademicRecord | null, field: AcademicFieldConfig) {
  if (!record) {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    if (field.inputType === "school-year-range") {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }

    if (field.valueType === "boolean") {
      return "false";
    }

    return "";
  }

  const value = record[field.name];

  if (value === null || value === undefined) {
    return "";
  }

  if (field.valueType === "boolean") {
    return value === true || value === 1 || value === "true" ? "true" : "false";
  }

  if (field.valueType === "date" && typeof value === "string") {
    return value.slice(0, 10);
  }

  return String(value);
}

function parsePayloadValue(value: string, field: AcademicFieldConfig) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (field.valueType === "number") {
    return Number(trimmedValue);
  }

  if (field.valueType === "boolean") {
    return trimmedValue === "true";
  }

  return trimmedValue;
}

function normalizeLookupText(value: string) {
  return value.trim().toLowerCase();
}

function buildTeachingUserOptions(
  users: Awaited<ReturnType<typeof listUsers>>,
  positions: Awaited<ReturnType<typeof listPositions>>,
): ModalFieldOption[] {
  const eligiblePositions = new Set(
    positions
      .filter((position) => {
        const category = normalizeLookupText(position.category);
        return category === "teaching" || category === "school administration";
      })
      .flatMap((position) => [
        normalizeLookupText(position.acronym),
        normalizeLookupText(position.fullPosition),
      ])
      .filter(Boolean),
  );

  return users
    .filter((user) => user.status === "active" && eligiblePositions.has(normalizeLookupText(user.position ?? "")))
    .map((user) => ({
      label: [user.name, user.position, user.email].filter(Boolean).join(" - "),
      value: String(user.id),
    }));
}

function buildModalFields(
  fields: AcademicFieldConfig[],
  lookupOptions: Record<AcademicLookupSource, ModalFieldOption[]>,
): ModalField[] {
  return fields.filter((field) => field.form !== false).map((field) => ({
    name: field.name,
    label: field.label,
    type: field.valueType === "boolean" ? field.inputType ?? "select" : field.inputType,
    options: field.lookupSource
      ? lookupOptions[field.lookupSource] ?? []
      : field.valueType === "boolean"
        ? field.options ?? booleanOptions
        : field.options,
    required: field.required,
    placeholder: field.placeholder,
    colSpan: field.colSpan,
    layoutClassName: field.layoutClassName,
    rangeEndName: field.rangeEndName,
    yearStart: field.yearStart,
    yearEnd: field.yearEnd,
  }));
}

export default function AcademicCrudPage({ config }: { config: AcademicCrudConfig }) {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteState, setDeleteState] = useState<{ recordId: number } | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [lookupOptions, setLookupOptions] = useState<Record<AcademicLookupSource, ModalFieldOption[]>>({
    "teaching-users": [],
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalFields = useMemo(() => buildModalFields(config.fields, lookupOptions), [config.fields, lookupOptions]);
  const tableFields = useMemo(() => config.fields.filter((field) => field.table !== false), [config.fields]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return records;
    }

    return records.filter((record) =>
      config.fields
        .map((field) => formatValue(record[field.name], field))
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [config.fields, records, searchTerm]);

  const tableRows: TableRow[] = useMemo(
    () =>
      filteredRecords.map((record) => ({
        id: Number(record.id),
        ...Object.fromEntries(tableFields.map((field) => [field.name, formatValue(record[field.name], field)])),
        updatedAt: formatDate(record.updatedAt),
      })),
    [filteredRecords, tableFields],
  );

  const deleteRecord = useMemo(
    () => records.find((record) => record.id === deleteState?.recordId) ?? null,
    [deleteState?.recordId, records],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
      try {
        setIsLoading(true);
        const data = await listAcademicRecords(config.entity);

        if (isMounted) {
          setRecords(data);
        }
      } catch (error) {
        if (isMounted) {
          showToast({
            title: `Unable to load ${config.title.toLowerCase()}.`,
            description: error instanceof Error ? error.message : "Please try again in a moment.",
            tone: "error",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      isMounted = false;
    };
  }, [config.entity, config.title]);

  useEffect(() => {
    const needsTeachingUsers = config.fields.some((field) => field.lookupSource === "teaching-users");

    if (!needsTeachingUsers) {
      return;
    }

    let isMounted = true;

    async function loadLookupOptions() {
      try {
        const [users, positions] = await Promise.all([listUsers(), listPositions()]);

        if (!isMounted) {
          return;
        }

        setLookupOptions((currentValue) => ({
          ...currentValue,
          "teaching-users": buildTeachingUserOptions(users, positions),
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          title: "Unable to load teacher lookup.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
          tone: "error",
        });
      }
    }

    void loadLookupOptions();

    return () => {
      isMounted = false;
    };
  }, [config.fields]);

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

  function openDialog(mode: DialogState["mode"], record?: AcademicRecord) {
    const nextValues = Object.fromEntries(config.fields.map((field) => [field.name, toFormValue(record ?? null, field)]));
    setFormValues(nextValues);
    setDialogState({
      mode,
      recordId: record?.id ?? null,
    });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues({});
  }

  function buildPayload() {
    for (const field of config.fields) {
      if (field.inputType !== "date-range" || !field.rangeEndName) {
        continue;
      }

      const startDate = formValues[field.name] ?? "";
      const endDate = formValues[field.rangeEndName] ?? "";

      if (startDate && endDate && startDate > endDate) {
        throw new Error(`${field.label} end date must be after the start date.`);
      }
    }

    return Object.fromEntries(
      config.fields.map((field) => [field.name, parsePayloadValue(formValues[field.name] ?? "", field)]),
    );
  }

  async function handleSave() {
    if (!dialogState) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildPayload();

      if (dialogState.mode === "add") {
        const createdRecord = await createAcademicRecord(config.entity, payload);
        setRecords((currentRecords) => [createdRecord, ...currentRecords]);
        closeDialog();
        showToast({ title: `${config.title} record created.`, tone: "success" });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.recordId !== null) {
        const updatedRecord = await updateAcademicRecord(config.entity, dialogState.recordId, payload);
        setRecords((currentRecords) =>
          currentRecords.map((record) => (record.id === dialogState.recordId ? updatedRecord : record)),
        );
        closeDialog();
        showToast({ title: `${config.title} record updated.`, tone: "success" });
      }
    } catch (error) {
      showToast({
        title: `Unable to save ${config.title.toLowerCase()}.`,
        description: error instanceof Error ? error.message : "Please review the form values.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteState) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteAcademicRecord(config.entity, deleteState.recordId);
      setRecords((currentRecords) => currentRecords.filter((record) => record.id !== deleteState.recordId));
      setDeleteState(null);
      showToast({ title: `${config.title} record deleted.`, tone: "success" });
    } catch (error) {
      showToast({
        title: `Unable to delete ${config.title.toLowerCase()}.`,
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<TableRow>[] = [
    ...tableFields.map((field, index) => ({
      key: field.name,
      header: field.label,
      valueClassName: index === 0 ? "text-sm font-semibold text-slate-950" : "text-sm text-slate-700",
    })),
    {
      key: "updatedAt",
      header: "Updated",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "actions",
      header: "Actions",
      type: "actions" as const,
      className: "whitespace-nowrap",
      headerClassName: "w-[140px]",
      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row) => openDialog("view", records.find((record) => record.id === Number(row.id))),
          tone: "primary" as const,
        },
        {
          label: "Edit",
          icon: <EditIcon />,
          onClick: (row) => openDialog("edit", records.find((record) => record.id === Number(row.id))),
        },
        {
          label: "Delete",
          icon: <DeleteIcon />,
          onClick: (row) => setDeleteState({ recordId: Number(row.id) }),
          tone: "danger" as const,
        },
      ],
    },
  ];

  const itemLabel =
    deleteRecord && tableFields[0]
      ? formatValue(deleteRecord[tableFields[0].name], tableFields[0])
      : "this record";
  const recordLabel = config.recordLabel ?? config.title;
  const modalSize = config.modalSize ?? "modal-large";
  const modalColumns = config.modalColumns ?? 3;
  const modalGridClassName =
    config.modalGridClassName ?? "grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min gap-x-4 gap-y-4";

  return (
    <PagePlaceholder
      breadcrumb={config.breadcrumb}
      description={config.description}
      sectionLabel="SF10 academic records"
      title={config.title}
    >
      <ToastViewport onDismiss={(toastId) => setToasts((current) => current.filter((toast) => toast.id !== toastId))} toasts={toasts} />
      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={() => openDialog("add")} size="sm">
            {config.addLabel}
          </Button>
        </div>
        <Table
          columns={columns}
          data={tableRows}
          emptyMessage={isLoading ? `Loading ${config.title.toLowerCase()}...` : "No records found."}
          search={{
            value: searchTerm,
            onChange: setSearchTerm,
          }}
          searchPlaceholder={`Search ${config.title.toLowerCase()}`}
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={modalColumns}
        fields={modalFields}
        fieldClassName="space-y-1.5"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName={modalGridClassName}
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState)}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={(name, value) => setFormValues((current) => ({ ...current, [name]: value }))}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSave}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size={modalSize}
        submitLabel={
          isSubmitting
            ? "Saving..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : `Create ${recordLabel}`
        }
        title={
          dialogState?.mode === "view"
            ? `View ${recordLabel}`
            : dialogState?.mode === "edit"
              ? `Edit ${recordLabel}`
              : `Add ${recordLabel}`
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={String(itemLabel)}
        onClose={() => setDeleteState(null)}
        onConfirm={handleDelete}
        title={`Delete ${config.title}`}
      />
    </PagePlaceholder>
  );
}
