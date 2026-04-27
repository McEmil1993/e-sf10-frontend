"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import type { ModalField, ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { PupilFormValues, PupilRecord, PupilStatus, PupilTableRow } from "@/app/types/pupilTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import { createPupil, deletePupil, listPupils, updatePupil } from "@/app/utils/api";
import { createPupilsResponse, normalizePupilRecord, toPupilTableRow } from "@/app/utils/pupilsApi";

type DialogMode = "add" | "view" | "edit";

type PupilDialogState = {
  mode: DialogMode;
  pupilId: number | null;
};

type PupilDeleteState = {
  pupilId: number;
};

const statusToneMap = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-amber-50 text-amber-700 ring-amber-100",
  transferred: "bg-sky-50 text-sky-700 ring-sky-100",
  graduated: "bg-slate-100 text-slate-700 ring-slate-200",
};

const sexOptions: ModalFieldOption[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const statusOptions: ModalFieldOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Transferred", value: "transferred" },
  { label: "Graduated", value: "graduated" },
];

const suffixOptions: ModalFieldOption[] = (rawSuffixes as string[]).map((suffix) => ({
  label: suffix,
  value: suffix,
}));

const regions = rawRegions as Array<{ code: string; name: string; regionName: string }>;
const provinces = rawProvinces as Array<{ code: string; name: string; regionCode: string }>;
const citiesMunicipalities = rawCitiesMunicipalities as Array<{
  code: string;
  name: string;
  provinceCode: string;
  isCity: boolean;
  isMunicipality: boolean;
}>;
const barangays = rawBarangays as Array<{
  code: string;
  name: string;
  cityCode: string | false;
  municipalityCode: string | false;
}>;

const regionOptions: ModalFieldOption[] = regions.map((region) => ({
  label: `${region.regionName} - ${region.name}`,
  value: region.regionName,
}));

const emptyFormValues: PupilFormValues = {
  lrn: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  sex: "male",
  birthdate: "",
  birthplace: "",
  street_address: "",
  barangay: "",
  city_municipality: "",
  province: "Bohol",
  region: "Region VII",
  status: "active",
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLrnInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function buildPupilFields(
  provinceOptions: ModalFieldOption[],
  cityMunicipalityOptions: ModalFieldOption[],
  barangayOptions: ModalFieldOption[],
): ModalField[] {
  return [
    {
      name: "lrn",
      label: "LRN",
      placeholder: "123456789012",
      required: true,
      helperText: "Enter digits only, up to 20 characters.",
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: statusOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "first_name",
      label: "First Name",
      placeholder: "Juan",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "middle_name",
      label: "Middle Name",
      placeholder: "Santos",
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "last_name",
      label: "Last Name",
      placeholder: "Dela Cruz",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "suffix",
      label: "Suffix",
      placeholder: "Jr.",
      type: "lookup",
      options: suffixOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "sex",
      label: "Sex",
      type: "select",
      options: sexOptions,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "birthdate",
      label: "Birthdate",
      type: "date",
      required: true,
      layoutClassName: "md:col-span-3 xl:col-span-3",
    },
    {
      name: "birthplace",
      label: "Birthplace",
      placeholder: "Talisay City",
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    {
      name: "region",
      label: "Region",
      type: "lookup",
      options: regionOptions,
      placeholder: "Region VII",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "province",
      label: "Province",
      type: "lookup",
      options: provinceOptions,
      placeholder: "Cebu",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "city_municipality",
      label: "Municipality / City",
      type: "lookup",
      options: cityMunicipalityOptions,
      placeholder: "Talisay City",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "barangay",
      label: "Barangay",
      type: "lookup",
      options: barangayOptions,
      placeholder: "San Isidro",
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
    {
      name: "street_address",
      label: "Street Address",
      placeholder: "Purok 1, San Isidro",
      layoutClassName: "md:col-span-6 xl:col-span-8",
    },
  ];
}

function normalizeFormValues(pupil: PupilRecord | null): PupilFormValues {
  if (!pupil) {
    return emptyFormValues;
  }

  return {
    lrn: pupil.lrn,
    first_name: pupil.first_name,
    middle_name: pupil.middle_name ?? "",
    last_name: pupil.last_name,
    suffix: pupil.suffix ?? "",
    sex: pupil.sex,
    birthdate: pupil.birthdate,
    birthplace: pupil.birthplace ?? "",
    street_address: pupil.street_address ?? "",
    barangay: pupil.barangay,
    city_municipality: pupil.city_municipality,
    province: pupil.province,
    region: pupil.region,
    status: pupil.status,
  };
}

export default function PupilsInformationPage() {
  const [pupils, setPupils] = useState<PupilRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<PupilDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<PupilDeleteState | null>(null);
  const [formValues, setFormValues] = useState<PupilFormValues>(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pupilsResponse = useMemo(
    () =>
      createPupilsResponse(pupils, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "created_at",
        sortOrder: "desc",
        basePath: "/pupils/information",
      }),
    [currentPage, pageSize, pupils, searchTerm],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPupils() {
      try {
        setIsLoading(true);
        const pupilData = await listPupils();

        if (!isMounted) {
          return;
        }

        setPupils(pupilData.map(normalizePupilRecord));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "error",
          title: "Unable to load pupils.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPupils();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.regionName === formValues.region || region.name === formValues.region) ?? null,
    [formValues.region],
  );

  const provinceOptions = useMemo(
    () =>
      provinces
        .filter((province) => !selectedRegion || province.regionCode === selectedRegion.code)
        .map((province) => ({
          label: province.name,
          value: province.name,
        })),
    [selectedRegion],
  );

  const selectedProvince = useMemo(
    () =>
      provinces.find(
        (province) =>
          province.name === formValues.province &&
          (!selectedRegion || province.regionCode === selectedRegion.code),
      ) ?? null,
    [formValues.province, selectedRegion],
  );

  const cityMunicipalityOptions = useMemo(
    () =>
      citiesMunicipalities
        .filter((cityMunicipality) => !selectedProvince || cityMunicipality.provinceCode === selectedProvince.code)
        .map((cityMunicipality) => ({
          label: cityMunicipality.name,
          value: cityMunicipality.name,
        })),
    [selectedProvince],
  );

  const selectedCityMunicipality = useMemo(
    () =>
      citiesMunicipalities.find(
        (cityMunicipality) =>
          cityMunicipality.name === formValues.city_municipality &&
          (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
      ) ?? null,
    [formValues.city_municipality, selectedProvince],
  );

  const barangayOptions = useMemo(
    () =>
      barangays
        .filter((barangay) => {
          if (!selectedCityMunicipality) {
            return false;
          }

          return (
            barangay.cityCode === selectedCityMunicipality.code ||
            barangay.municipalityCode === selectedCityMunicipality.code
          );
        })
        .map((barangay) => ({
          label: barangay.name,
          value: barangay.name,
        })),
    [selectedCityMunicipality],
  );

  const pupilFields = useMemo(
    () => buildPupilFields(provinceOptions, cityMunicipalityOptions, barangayOptions),
    [barangayOptions, cityMunicipalityOptions, provinceOptions],
  );

  const deleteTargetPupil = useMemo(
    () => pupils.find((pupil) => pupil.id === deleteState?.pupilId) ?? null,
    [deleteState?.pupilId, pupils],
  );

  const tablePupils: PupilTableRow[] = useMemo(
    () => pupilsResponse.data.map(toPupilTableRow),
    [pupilsResponse.data],
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
    setToasts((currentValue) =>
      currentValue.filter((toast) => toast.id !== toastId),
    );
  }

  function openAddModal() {
    setFormValues(emptyFormValues);
    setDialogState({
      mode: "add",
      pupilId: null,
    });
  }

  function openViewModal(pupilId: number) {
    const pupil = pupils.find((item) => item.id === pupilId) ?? null;
    setFormValues(normalizeFormValues(pupil));
    setDialogState({
      mode: "view",
      pupilId,
    });
  }

  function openEditModal(pupilId: number) {
    const pupil = pupils.find((item) => item.id === pupilId) ?? null;
    setFormValues(normalizeFormValues(pupil));
    setDialogState({
      mode: "edit",
      pupilId,
    });
  }

  function openDeleteModal(pupilId: number) {
    setDeleteState({ pupilId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function handleFieldChange(name: string, value: string) {
    if (name === "lrn") {
      setFormValues((currentValue) => ({
        ...currentValue,
        lrn: normalizeLrnInput(value),
      }));
      return;
    }

    if (name === "region") {
      setFormValues((currentValue) => ({
        ...currentValue,
        region: value,
        province: value === "Region VII" ? "Bohol" : "",
        city_municipality: "",
        barangay: "",
      }));
      return;
    }

    if (name === "province") {
      setFormValues((currentValue) => ({
        ...currentValue,
        province: value,
        city_municipality: "",
        barangay: "",
      }));
      return;
    }

    if (name === "city_municipality") {
      setFormValues((currentValue) => ({
        ...currentValue,
        city_municipality: value,
        barangay: "",
      }));
      return;
    }

    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function buildPupilPayload() {
    return {
      lrn: formValues.lrn.trim(),
      first_name: formValues.first_name.trim(),
      middle_name: formValues.middle_name.trim(),
      last_name: formValues.last_name.trim(),
      suffix: formValues.suffix.trim(),
      sex: formValues.sex,
      birthdate: formValues.birthdate,
      birthplace: formValues.birthplace.trim(),
      street_address: formValues.street_address.trim(),
      barangay: formValues.barangay.trim(),
      city_municipality: formValues.city_municipality.trim(),
      province: formValues.province.trim(),
      region: formValues.region.trim(),
      status: formValues.status as PupilStatus,
    };
  }

  async function handleSavePupil() {
    if (!dialogState) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const createdPupil = await createPupil(buildPupilPayload());

        setPupils((currentPupils) => [normalizePupilRecord(createdPupil), ...currentPupils]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "Pupil created successfully.",
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.pupilId !== null) {
        const updatedPupil = await updatePupil(dialogState.pupilId, buildPupilPayload());

        setPupils((currentPupils) =>
          currentPupils.map((currentPupil) =>
            currentPupil.id === dialogState.pupilId
              ? normalizePupilRecord(updatedPupil)
              : currentPupil,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "Pupil updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save the pupil.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePupil() {
    if (!deleteState?.pupilId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deletePupil(deleteState.pupilId);
      setPupils((currentPupils) => currentPupils.filter((pupil) => pupil.id !== deleteState.pupilId));
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "Pupil deleted successfully.",
        description: deleteTargetPupil?.full_name
          ? `${deleteTargetPupil.full_name} was removed from the list.`
          : undefined,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete the pupil.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<PupilTableRow>[] = [
    {
      key: "full_name",
      header: "Pupil",
      type: "stacked",
      secondaryKey: "lrn",
      valueClassName: "font-semibold text-slate-950",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "sex",
      header: "Sex",
      valueClassName: "text-sm capitalize text-slate-700",
    },
    {
      key: "birthdate",
      header: "Birthdate",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "location",
      header: "Location",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "status",
      header: "Status",
      type: "badge",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset capitalize",
      toneMap: statusToneMap,
    },
    {
      key: "created_at",
      header: "Created",
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
    <PagePlaceholder
      breadcrumb="Home > Pupils > Information"
      sectionLabel="Pupils panel"
      title="Information"
    >
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add Pupil
          </Button>
        </div>

        <Table
          columns={columns}
          data={tablePupils}
          emptyMessage={isLoading ? "Loading pupils..." : "No pupils found."}
          pagination={{
            page: pupilsResponse.meta.page,
            perPage: pupilsResponse.meta.per_page,
            total: pupilsResponse.meta.total,
            totalPages: pupilsResponse.meta.total_pages,
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
          searchPlaceholder="Search name, LRN, sex, status, or address"
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        fields={pupilFields}
        fieldClassName="space-y-1"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState)}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSavePupil}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={
          isSubmitting
            ? dialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create Pupil"
        }
        title={
          dialogState?.mode === "view"
            ? "View Pupil"
            : dialogState?.mode === "edit"
              ? "Edit Pupil"
              : "Add Pupil"
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
        itemLabel={deleteTargetPupil?.full_name ?? "this pupil"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePupil}
        title="Delete Pupil"
      />
    </PagePlaceholder>
  );
}
