"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button/Button";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import PupilGuardianCard from "@/app/components/Pupil/PupilGuardianCard";
import PupilSummaryCard from "@/app/components/Pupil/PupilSummaryCard";
import DetailItem from "@/app/components/RecordView/DetailItem";
import SectionCard from "@/app/components/RecordView/SectionCard";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import { formatDate } from "@/app/lib/display";
import type { ModalField, ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { GuardianRecord } from "@/app/types/guardianTypes";
import type {
  PupilGuardianFormValues,
  PupilGuardianRecord,
  PupilGuardianRelationFormValues,
} from "@/app/types/pupilGuardianTypes";
import type { PupilRecord } from "@/app/types/pupilTypes";
import {
  createPupilGuardian,
  deletePupilGuardian,
  getPupil,
  listGuardians,
  listPupilGuardians,
  updatePupilGuardian,
} from "@/app/utils/api";
import { normalizeGuardianRecord } from "@/app/utils/guardiansApi";
import { normalizePupilRecord } from "@/app/utils/pupilsApi";

type PupilDetailViewProps = {
  pupilId: number;
};

const suffixOptions: ModalFieldOption[] = (rawSuffixes as string[]).map((suffix) => ({
  label: suffix,
  value: suffix,
}));

const relationshipOptions: ModalFieldOption[] = [
  { label: "Mother", value: "Mother" },
  { label: "Father", value: "Father" },
  { label: "Guardian", value: "Guardian" },
  { label: "Grandmother", value: "Grandmother" },
  { label: "Grandfather", value: "Grandfather" },
  { label: "Aunt", value: "Aunt" },
  { label: "Uncle", value: "Uncle" },
  { label: "Sibling", value: "Sibling" },
];

const primaryOptions: ModalFieldOption[] = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const guardianSourceOptions: ModalFieldOption[] = [
  { label: "Existing Guardian", value: "existing" },
  { label: "New Guardian", value: "new" },
];

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

const emptyGuardianFormValues: PupilGuardianFormValues = {
  guardian_source: "new",
  guardian_id: "",
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
  relationship: "Guardian",
  is_primary: "true",
};

const emptyGuardianRelationFormValues: PupilGuardianRelationFormValues = {
  relationship: "Guardian",
  is_primary: "false",
};

const guardianRelationFields: ModalField[] = [
  {
    name: "relationship",
    label: "Relationship",
    type: "lookup",
    options: relationshipOptions,
    placeholder: "Guardian",
    required: true,
    layoutClassName: "md:col-span-3 xl:col-span-3",
  },
  {
    name: "is_primary",
    label: "Primary Contact",
    type: "select",
    options: primaryOptions,
    layoutClassName: "md:col-span-3 xl:col-span-3",
  },
];

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeContactNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 20);
}

function buildPupilAddress(pupil: PupilRecord) {
  const addressParts = [
    pupil.street_address,
    pupil.barangay,
    pupil.city_municipality,
    pupil.province,
  ]
    .map((value) => value?.trim())
    .filter(Boolean);

  return addressParts.join(", ") || "-";
}

function buildGuardianFields(
  guardianSource: string,
  guardianOptions: ModalFieldOption[],
  provinceOptions: ModalFieldOption[],
  cityMunicipalityOptions: ModalFieldOption[],
  barangayOptions: ModalFieldOption[],
): ModalField[] {
  const baseFields: ModalField[] = [
    {
      name: "guardian_source",
      label: "Guardian Source",
      type: "select",
      options: guardianSourceOptions,
      helperText: "Choose an existing guardian record or add a new one.",
      layoutClassName: "md:col-span-4 xl:col-span-4",
    },
    {
      name: "relationship",
      label: "Relationship",
      type: "lookup",
      options: relationshipOptions,
      placeholder: "Guardian",
      required: true,
      layoutClassName: "md:col-span-4 xl:col-span-4",
    },
    {
      name: "is_primary",
      label: "Primary Contact",
      type: "select",
      options: primaryOptions,
      layoutClassName: "md:col-span-4 xl:col-span-4",
    },
  ];

  if (guardianSource === "existing") {
    return [
      ...baseFields,
      {
        name: "guardian_id",
        label: "Existing Guardian",
        type: "select",
        options:
          guardianOptions.length > 0
            ? [{ label: "Select guardian", value: "" }, ...guardianOptions]
            : [{ label: "No available guardian", value: "" }],
        placeholder: guardianOptions.length > 0 ? "Select guardian" : "No available guardian",
        helperText:
          guardianOptions.length > 0
            ? "Select a guardian already saved in the guardians table."
            : "No unlinked guardian records are available.",
        disabled: guardianOptions.length === 0,
        layoutClassName: "md:col-span-6 xl:col-span-6",
      },
    ];
  }

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
    ...baseFields,
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

export default function PupilDetailView({ pupilId }: PupilDetailViewProps) {
  const router = useRouter();
  const [pupil, setPupil] = useState<PupilRecord | null>(null);
  const [guardianRelations, setGuardianRelations] = useState<PupilGuardianRecord[]>([]);
  const [availableGuardians, setAvailableGuardians] = useState<GuardianRecord[]>([]);
  const [guardianFormValues, setGuardianFormValues] = useState<PupilGuardianFormValues>(
    emptyGuardianFormValues,
  );
  const [guardianRelationFormValues, setGuardianRelationFormValues] =
    useState<PupilGuardianRelationFormValues>(emptyGuardianRelationFormValues);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [isGuardianRelationModalOpen, setIsGuardianRelationModalOpen] = useState(false);
  const [relationToEdit, setRelationToEdit] = useState<PupilGuardianRecord | null>(null);
  const [relationToDelete, setRelationToDelete] = useState<PupilGuardianRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionRelationId, setActionRelationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const loadGuardianDetails = useCallback(async () => {
    const [guardianData, guardiansData] = await Promise.all([
      listPupilGuardians(pupilId),
      listGuardians().catch(() => []),
    ]);

    setGuardianRelations(guardianData);
    setAvailableGuardians(guardiansData.map(normalizeGuardianRecord));
  }, [pupilId]);

  const loadPupilDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const pupilData = await getPupil(pupilId);

      setPupil(normalizePupilRecord(pupilData));
      await loadGuardianDetails();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load the pupil details.");
    } finally {
      setIsLoading(false);
    }
  }, [loadGuardianDetails, pupilId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPupilDetails();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPupilDetails]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.regionName === guardianFormValues.region || region.name === guardianFormValues.region) ?? null,
    [guardianFormValues.region],
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
          province.name === guardianFormValues.province &&
          (!selectedRegion || province.regionCode === selectedRegion.code),
      ) ?? null,
    [guardianFormValues.province, selectedRegion],
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
          cityMunicipality.name === guardianFormValues.municipality_city &&
          (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
      ) ?? null,
    [guardianFormValues.municipality_city, selectedProvince],
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

  const guardianOptions = useMemo(() => {
    const linkedGuardianIds = new Set(guardianRelations.map((relation) => relation.guardian_id));

    return availableGuardians
      .filter((guardian) => !linkedGuardianIds.has(guardian.id))
      .map((guardian) => ({
        label: `${guardian.full_name} (${guardian.contact_number})`,
        value: String(guardian.id),
      }));
  }, [availableGuardians, guardianRelations]);

  const guardianFields = useMemo(
    () =>
      buildGuardianFields(
        guardianFormValues.guardian_source,
        guardianOptions,
        provinceOptions,
        cityMunicipalityOptions,
        barangayOptions,
      ),
    [
      barangayOptions,
      cityMunicipalityOptions,
      guardianFormValues.guardian_source,
      guardianOptions,
      provinceOptions,
    ],
  );

  const sortedGuardianRelations = useMemo(
    () =>
      guardianRelations
        .slice()
        .sort((firstRelation, secondRelation) => {
          if (firstRelation.is_primary === secondRelation.is_primary) {
            return firstRelation.guardian.full_name.localeCompare(secondRelation.guardian.full_name);
          }

          return firstRelation.is_primary ? -1 : 1;
        }),
    [guardianRelations],
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

  function openGuardianModal() {
    const hasAvailableExistingGuardians =
      availableGuardians.some(
        (guardian) =>
          !guardianRelations.some((relation) => relation.guardian_id === guardian.id),
      );

    setGuardianFormValues({
      ...emptyGuardianFormValues,
      guardian_source: hasAvailableExistingGuardians ? "existing" : "new",
      is_primary: guardianRelations.length === 0 ? "true" : "false",
    });
    setIsGuardianModalOpen(true);
  }

  function closeGuardianModal() {
    setIsGuardianModalOpen(false);
    setGuardianFormValues(emptyGuardianFormValues);
  }

  function openGuardianRelationModal(relation: PupilGuardianRecord) {
    setRelationToEdit(relation);
    setGuardianRelationFormValues({
      relationship: relation.relationship,
      is_primary: relation.is_primary ? "true" : "false",
    });
    setIsGuardianRelationModalOpen(true);
  }

  function closeGuardianRelationModal() {
    setIsGuardianRelationModalOpen(false);
    setRelationToEdit(null);
    setGuardianRelationFormValues(emptyGuardianRelationFormValues);
  }

  function openDeleteGuardianModal(relation: PupilGuardianRecord) {
    setRelationToDelete(relation);
  }

  function closeDeleteGuardianModal() {
    setRelationToDelete(null);
  }

  function handleGuardianFieldChange(name: string, value: string) {
    if (name === "guardian_source") {
      setGuardianFormValues((currentValue) => ({
        ...currentValue,
        guardian_source: value,
        guardian_id: "",
        profile_picture: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        contact_number: "",
        address: "",
        barangay: "",
        municipality_city: "",
        province: value === "new" ? "Bohol" : "",
        region: value === "new" ? "Region VII" : "",
      }));
      return;
    }

    if (name === "contact_number") {
      setGuardianFormValues((currentValue) => ({
        ...currentValue,
        contact_number: normalizeContactNumberInput(value),
      }));
      return;
    }

    if (name === "region") {
      setGuardianFormValues((currentValue) => ({
        ...currentValue,
        region: value,
        province: value === "Region VII" ? "Bohol" : "",
        municipality_city: "",
        barangay: "",
      }));
      return;
    }

    if (name === "province") {
      setGuardianFormValues((currentValue) => ({
        ...currentValue,
        province: value,
        municipality_city: "",
        barangay: "",
      }));
      return;
    }

    if (name === "municipality_city") {
      setGuardianFormValues((currentValue) => ({
        ...currentValue,
        municipality_city: value,
        barangay: "",
      }));
      return;
    }

    setGuardianFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function handleGuardianRelationFieldChange(name: string, value: string) {
    setGuardianRelationFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function buildGuardianPayload() {
    if (guardianFormValues.guardian_source === "existing") {
      return {
        guardian_id: guardianFormValues.guardian_id.trim(),
        relationship: guardianFormValues.relationship.trim(),
        is_primary: guardianFormValues.is_primary,
      };
    }

    return {
      guardian_id: "",
      profile_picture: guardianFormValues.profile_picture.trim(),
      first_name: guardianFormValues.first_name.trim(),
      middle_name: guardianFormValues.middle_name.trim(),
      last_name: guardianFormValues.last_name.trim(),
      suffix: guardianFormValues.suffix.trim(),
      contact_number: guardianFormValues.contact_number.trim(),
      address: guardianFormValues.address.trim(),
      barangay: guardianFormValues.barangay.trim(),
      municipality_city: guardianFormValues.municipality_city.trim(),
      province: guardianFormValues.province.trim(),
      region: guardianFormValues.region.trim(),
      relationship: guardianFormValues.relationship.trim(),
      is_primary: guardianFormValues.is_primary,
    };
  }

  async function handleAddGuardian() {
    if (guardianFormValues.guardian_source === "existing") {
      if (!guardianFormValues.guardian_id.trim()) {
        showToast({
          tone: "error",
          title: "Select an existing guardian.",
          description: "Choose a guardian already saved in the guardians table.",
        });
        return;
      }
    } else {
      const normalizedContactNumber = normalizeContactNumberInput(guardianFormValues.contact_number);

      if (!/^\d{7,20}$/.test(normalizedContactNumber)) {
        showToast({
          tone: "error",
          title: "Invalid contact number.",
          description: "Contact number must contain 7 to 20 digits only.",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await createPupilGuardian(pupilId, buildGuardianPayload());
      await loadGuardianDetails();

      closeGuardianModal();
      showToast({
        tone: "success",
        title: "Guardian added successfully.",
      });
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

  async function handleUpdateGuardianRelation() {
    if (!relationToEdit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionRelationId(relationToEdit.id);

      await updatePupilGuardian(pupilId, relationToEdit.id, guardianRelationFormValues);
      await loadGuardianDetails();

      closeGuardianRelationModal();
      showToast({
        tone: "success",
        title: "Guardian relation updated successfully.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to update the guardian relation.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
      setActionRelationId(null);
    }
  }

  async function handleDeleteGuardianRelation() {
    if (!relationToDelete) {
      return;
    }

    try {
      setIsSubmitting(true);
      setActionRelationId(relationToDelete.id);

      await deletePupilGuardian(pupilId, relationToDelete.id);
      await loadGuardianDetails();

      closeDeleteGuardianModal();
      showToast({
        tone: "success",
        title: "Guardian removed successfully.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to remove the guardian.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
      setActionRelationId(null);
    }
  }

  return (
    <PagePlaceholder
      breadcrumb="Home > Pupils > Information > View"
      sectionLabel="Pupils panel"
      title="Pupil Information"
    >
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="flex justify-start">
        <Button onClick={() => router.push("/pupils/information")} size="sm" variant="secondary">
          Back to List
        </Button>
      </div>

      {isLoading ? (
        <section className="rounded-[5px] border border-border bg-card px-5 py-10 text-sm text-muted shadow-sm">
          Loading pupil information...
        </section>
      ) : errorMessage || !pupil ? (
        <section className="space-y-4 rounded-[5px] border border-rose-200 bg-rose-50 px-5 py-5 shadow-sm">
          <p className="text-sm text-rose-700">{errorMessage ?? "Pupil not found."}</p>
          <div className="flex gap-3">
            <Button onClick={() => void loadPupilDetails()} size="sm" variant="secondary">
              Retry
            </Button>
            <Button onClick={() => router.push("/pupils/information")} size="sm">
              Go to Pupil List
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <PupilSummaryCard pupil={pupil} />

          <div className="space-y-5">
            <SectionCard title="Pupil Information">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailItem label="Full Name" value={pupil.full_name} />
                <DetailItem label="LRN" value={pupil.lrn} />
                <DetailItem label="Sex" value={pupil.sex.charAt(0).toUpperCase() + pupil.sex.slice(1)} />
                <DetailItem label="Birthdate" value={formatDate(pupil.birthdate)} />
                <DetailItem label="Birthplace" value={pupil.birthplace || "-"} />
                <DetailItem label="Status" value={pupil.status.charAt(0).toUpperCase() + pupil.status.slice(1)} />
                <DetailItem
                  className="md:col-span-2 xl:col-span-3"
                  label="Address"
                  value={buildPupilAddress(pupil)}
                />
              </div>
            </SectionCard>

            <SectionCard
              action={
                <Button disabled={isSubmitting} onClick={openGuardianModal} size="xs">
                  Add Guardian
                </Button>
              }
              title="Guardian"
            >
              {sortedGuardianRelations.length === 0 ? (
                <div className="rounded-[5px] border border-dashed border-border bg-background px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">No guardian assigned yet.</p>
                  <p className="mt-1 text-xs text-muted">
                    Add the primary guardian to connect this pupil to the guardians table.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button disabled={isSubmitting} onClick={openGuardianModal} size="xs">
                      Add Guardian
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedGuardianRelations.map((relation) => (
                    <PupilGuardianCard
                      isBusy={isSubmitting && actionRelationId === relation.id}
                      key={relation.id}
                      onDelete={() => openDeleteGuardianModal(relation)}
                      onEdit={() => openGuardianRelationModal(relation)}
                      relation={relation}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

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
        isOpen={isGuardianModalOpen}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode="add"
        onChange={handleGuardianFieldChange}
        onClose={closeGuardianModal}
        onSubmit={handleAddGuardian}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={isSubmitting ? "Saving..." : "Save Guardian"}
        title="Add Guardian"
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={guardianFormValues}
      />

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        description="This updates the pupil_guardians relation only. Guardian profile details stay in the guardians table."
        fields={guardianRelationFields}
        fieldClassName="space-y-1"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-6"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={isGuardianRelationModalOpen}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode="edit"
        onChange={handleGuardianRelationFieldChange}
        onClose={closeGuardianRelationModal}
        onSubmit={handleUpdateGuardianRelation}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="md"
        submitLabel={isSubmitting ? "Saving..." : "Update Guardian"}
        title="Update Guardian Relation"
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={guardianRelationFormValues}
      />

      <ConfirmModal
        confirmClassName="border border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700 focus-visible:outline-rose-600"
        confirmLabel={isSubmitting ? "Removing..." : "Remove"}
        description="Remove this guardian link from the pupil"
        emphasisMessage="This will only unlink the guardian from this pupil. The guardian record will stay in the guardians table."
        emphasisTone="danger"
        isOpen={Boolean(relationToDelete)}
        itemLabel={relationToDelete?.guardian.full_name ?? "this guardian"}
        onClose={closeDeleteGuardianModal}
        onConfirm={handleDeleteGuardianRelation}
        title="Remove Guardian"
      />
    </PagePlaceholder>
  );
}
