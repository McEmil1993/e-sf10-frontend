"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import GuardianViewModal from "@/app/components/Guardian/GuardianViewModal";
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
import type {
  GuardianFormValues,
  GuardianRecord,
  GuardianTableRow,
} from "@/app/types/guardianTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import { createGuardian, deleteGuardian, listGuardians, updateGuardian } from "@/app/utils/api";
import {
  createGuardiansResponse,
  normalizeGuardianRecord,
  toGuardianTableRow,
} from "@/app/utils/guardiansApi";

type DialogMode = "add" | "view" | "edit";

type GuardianDialogState = {
  mode: DialogMode;
  guardianId: number | null;
};

type GuardianDeleteState = {
  guardianId: number;
};

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

const emptyFormValues: GuardianFormValues = {
  profile_picture: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  contact_number: "",
  address: "",
  barangay: "",
  municipality_city: "",
  province: "Bohol",
  region: "Region VII",
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeContactNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function buildGuardianFields(
  provinceOptions: ModalFieldOption[],
  cityMunicipalityOptions: ModalFieldOption[],
  barangayOptions: ModalFieldOption[],
): ModalField[] {
  return [
    {
      name: "profile_picture",
      label: "Profile Picture",
      type: "file",
      accept: "image/*",
      enableImageCrop: true,
      cropShape: "circle",
      cropAspect: 1,
      layoutClassName: "md:col-span-6 xl:col-span-6",
    },
    {
      name: "first_name",
      label: "First Name",
      placeholder: "Maria",
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
      placeholder: "Sr.",
      type: "lookup",
      options: suffixOptions,
      layoutClassName: "md:col-span-3 xl:col-span-2",
    },
    {
      name: "contact_number",
      label: "Contact Number",
      placeholder: "09171234567",
      required: true,
      helperText: "Enter 7 to 20 digits only.",
      layoutClassName: "md:col-span-3 xl:col-span-4",
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
      name: "municipality_city",
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
      name: "address",
      label: "Address",
      placeholder: "Street and house details",
      required: true,
      layoutClassName: "md:col-span-6 xl:col-span-4",
    },
  ];
}

function normalizeFormValues(guardian: GuardianRecord | null): GuardianFormValues {
  if (!guardian) {
    return emptyFormValues;
  }

  return {
    profile_picture: guardian.profile_picture ?? guardian.avatar ?? "",
    first_name: guardian.first_name,
    middle_name: guardian.middle_name ?? "",
    last_name: guardian.last_name,
    suffix: guardian.suffix ?? "",
    contact_number: guardian.contact_number,
    address: guardian.address,
    barangay: guardian.barangay,
    municipality_city: guardian.municipality_city,
    province: guardian.province,
    region: guardian.region,
  };
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<GuardianRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<GuardianDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<GuardianDeleteState | null>(null);
  const [formValues, setFormValues] = useState<GuardianFormValues>(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guardiansResponse = useMemo(
    () =>
      createGuardiansResponse(guardians, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "created_at",
        sortOrder: "desc",
        basePath: "/guardians",
      }),
    [currentPage, guardians, pageSize, searchTerm],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadGuardians() {
      try {
        setIsLoading(true);
        const guardianData = await listGuardians();

        if (!isMounted) {
          return;
        }

        setGuardians(guardianData.map(normalizeGuardianRecord));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        showToast({
          tone: "error",
          title: "Unable to load guardians.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGuardians();

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
          cityMunicipality.name === formValues.municipality_city &&
          (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
      ) ?? null,
    [formValues.municipality_city, selectedProvince],
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

  const guardianFields = useMemo(
    () => buildGuardianFields(provinceOptions, cityMunicipalityOptions, barangayOptions),
    [barangayOptions, cityMunicipalityOptions, provinceOptions],
  );

  const deleteTargetGuardian = useMemo(
    () => guardians.find((guardian) => guardian.id === deleteState?.guardianId) ?? null,
    [deleteState?.guardianId, guardians],
  );

  const viewGuardian = useMemo(
    () => guardians.find((guardian) => guardian.id === dialogState?.guardianId) ?? null,
    [dialogState?.guardianId, guardians],
  );

  const tableGuardians: GuardianTableRow[] = useMemo(
    () => guardiansResponse.data.map(toGuardianTableRow),
    [guardiansResponse.data],
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
    setFormValues(emptyFormValues);
    setDialogState({
      mode: "add",
      guardianId: null,
    });
  }

  function openViewModal(guardianId: number) {
    const guardian = guardians.find((item) => item.id === guardianId) ?? null;
    setFormValues(normalizeFormValues(guardian));
    setDialogState({
      mode: "view",
      guardianId,
    });
  }

  function openEditModal(guardianId: number) {
    const guardian = guardians.find((item) => item.id === guardianId) ?? null;
    setFormValues(normalizeFormValues(guardian));
    setDialogState({
      mode: "edit",
      guardianId,
    });
  }

  function openDeleteModal(guardianId: number) {
    setDeleteState({ guardianId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function handleFieldChange(name: string, value: string) {
    if (name === "contact_number") {
      setFormValues((currentValue) => ({
        ...currentValue,
        contact_number: normalizeContactNumberInput(value),
      }));
      return;
    }

    if (name === "region") {
      setFormValues((currentValue) => ({
        ...currentValue,
        region: value,
        province: value === "Region VII" ? "Bohol" : "",
        municipality_city: "",
        barangay: "",
      }));
      return;
    }

    if (name === "province") {
      setFormValues((currentValue) => ({
        ...currentValue,
        province: value,
        municipality_city: "",
        barangay: "",
      }));
      return;
    }

    if (name === "municipality_city") {
      setFormValues((currentValue) => ({
        ...currentValue,
        municipality_city: value,
        barangay: "",
      }));
      return;
    }

    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function buildGuardianPayload() {
    return {
      avatar: formValues.profile_picture.trim(),
      profile_picture: formValues.profile_picture.trim(),
      first_name: formValues.first_name.trim(),
      middle_name: formValues.middle_name.trim(),
      last_name: formValues.last_name.trim(),
      suffix: formValues.suffix.trim(),
      contact_number: formValues.contact_number.trim(),
      address: formValues.address.trim(),
      barangay: formValues.barangay.trim(),
      municipality_city: formValues.municipality_city.trim(),
      province: formValues.province.trim(),
      region: formValues.region.trim(),
    };
  }

  async function handleSaveGuardian() {
    if (!dialogState) {
      return;
    }

    const normalizedContactNumber = normalizeContactNumberInput(formValues.contact_number);

    if (!/^\d{7,20}$/.test(normalizedContactNumber)) {
      showToast({
        tone: "error",
        title: "Invalid contact number.",
        description: "Contact number must contain 7 to 20 digits only.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const createdGuardian = await createGuardian(buildGuardianPayload());

        setGuardians((currentGuardians) => [normalizeGuardianRecord(createdGuardian), ...currentGuardians]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "Guardian created successfully.",
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.guardianId !== null) {
        const updatedGuardian = await updateGuardian(dialogState.guardianId, buildGuardianPayload());

        setGuardians((currentGuardians) =>
          currentGuardians.map((currentGuardian) =>
            currentGuardian.id === dialogState.guardianId
              ? normalizeGuardianRecord(updatedGuardian)
              : currentGuardian,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "Guardian updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save the guardian.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGuardian() {
    if (!deleteState?.guardianId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteGuardian(deleteState.guardianId);
      setGuardians((currentGuardians) =>
        currentGuardians.filter((guardian) => guardian.id !== deleteState.guardianId),
      );
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "Guardian deleted successfully.",
        description: deleteTargetGuardian?.full_name
          ? `${deleteTargetGuardian.full_name} was removed from the list.`
          : undefined,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete the guardian.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<GuardianTableRow>[] = [
    {
      key: "name",
      header: "Name",
      type: "stacked",
      showAvatar: true,
      avatarImageKey: "avatar",
      avatarFallbackKey: "name",
      secondaryKey: "contact_number",
      valueClassName: "font-semibold text-slate-950",
      secondaryValueClassName: "text-xs text-muted",
    },
    {
      key: "address",
      header: "Address",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "created_at",
      header: "Created",
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
    <PagePlaceholder breadcrumb="Home > Guardians" title="Guardians">
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add Guardian
          </Button>
        </div>

        <Table
          columns={columns}
          data={tableGuardians}
          emptyMessage={isLoading ? "Loading guardians..." : "No guardians found."}
          pagination={{
            page: guardiansResponse.meta.page,
            perPage: guardiansResponse.meta.per_page,
            total: guardiansResponse.meta.total,
            totalPages: guardiansResponse.meta.total_pages,
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
          searchPlaceholder="Search name, contact number, or address"
        />
      </div>

      <FormModal
        showBodyDivider={true}
        dividerAfterIndex={0}
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        fields={guardianFields}
        fieldClassName="space-y-1"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState) && dialogState?.mode !== "view"}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveGuardian}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={
          isSubmitting
            ? dialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create Guardian"
        }
        title={
          dialogState?.mode === "view"
            ? "View Guardian"
            : dialogState?.mode === "edit"
              ? "Edit Guardian"
              : "Add Guardian"
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <GuardianViewModal
        guardian={viewGuardian}
        isOpen={dialogState?.mode === "view"}
        onClose={closeDialog}
        onEdit={openEditModal}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteTargetGuardian?.full_name ?? "this guardian"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteGuardian}
        title="Delete Guardian"
      />
    </PagePlaceholder>
  );
}
