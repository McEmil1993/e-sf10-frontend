"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import Button from "@/app/components/Button/Button";
import LookupField from "@/app/components/Modal/LookupField";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import type { ModalFieldOption } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { SchoolSettings, SchoolSettingsFormValues } from "@/app/types/systemTypes";
import { getSchoolSettings, updateSchoolSettings, uploadFile } from "@/app/utils/api";

const emptyFormValues: SchoolSettingsFormValues = {
  deped_school_id: "",
  school_name: "",
  district: "",
  division: "",
  region: "",
  province: "",
  municipality_city: "",
  barangay: "",
  sitio_purok: "",
  address: "",
  school_logo: "",
  deped_logo: "",
  other_logo: "",
};

type LogoField = "school_logo" | "deped_logo" | "other_logo";

type PendingLogoFiles = Partial<Record<LogoField, File>>;

const logoFields: Array<{
  field: LogoField;
  label: string;
  filename: string;
}> = [
  { field: "school_logo", label: "School Logo", filename: "school-logo" },
  { field: "deped_logo", label: "DepEd Logo", filename: "deped-logo" },
  { field: "other_logo", label: "Other Logo", filename: "other-logo" },
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected system settings request error.";
}

function createToast(toast: Omit<ToastItem, "id">): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    duration: 4500,
    ...toast,
  };
}

function findRegionByValue(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return (
    regions.find((region) => {
      const regionName = region.regionName.toLowerCase();
      const name = region.name.toLowerCase();
      const label = `${region.regionName} - ${region.name}`.toLowerCase();

      return normalizedValue === regionName || normalizedValue === name || normalizedValue === label;
    }) ?? null
  );
}

function parseSchoolAddress(address: string, region: string) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const selectedRegion = findRegionByValue(region);
  const provincePartIndex = parts.findIndex((part) =>
    provinces.some(
      (province) =>
        (!selectedRegion || province.regionCode === selectedRegion.code) &&
        part.toLowerCase().startsWith(province.name.toLowerCase()),
    ),
  );

  if (provincePartIndex < 0) {
    return {
      province: "",
      municipality_city: "",
      barangay: "",
      sitio_purok: address,
    };
  }

  const province =
    provinces.find(
      (currentProvince) =>
        (!selectedRegion || currentProvince.regionCode === selectedRegion.code) &&
        parts[provincePartIndex].toLowerCase().startsWith(currentProvince.name.toLowerCase()),
    )?.name ?? "";

  return {
    province,
    municipality_city: parts[provincePartIndex - 1] ?? "",
    barangay: parts[provincePartIndex - 2] ?? "",
    sitio_purok: parts.slice(0, Math.max(0, provincePartIndex - 2)).join(", "),
  };
}

function buildSchoolAddress(values: SchoolSettingsFormValues) {
  return [values.sitio_purok, values.barangay, values.municipality_city, values.province]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function toFormValues(school: SchoolSettings): SchoolSettingsFormValues {
  const addressValues = parseSchoolAddress(school.address, school.region);

  return {
    deped_school_id: school.deped_school_id,
    school_name: school.school_name,
    district: school.district,
    division: school.division,
    region: findRegionByValue(school.region)?.regionName ?? school.region,
    ...addressValues,
    address: school.address,
    school_logo: school.school_logo,
    deped_logo: school.deped_logo,
    other_logo: school.other_logo,
  };
}

function SaveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M5 3h12l2 2v16H5V3Zm2 2v5h9V5H7Zm1 9v5h8v-5H8Z" fill="currentColor" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M11 16V7.83L8.41 10.4 7 9l5-5 5 5-1.41 1.4L13 7.83V16h-2Zm-6 2h14v2H5v-2Z" fill="currentColor" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M6 7h12v2H6V7Zm2 4h8v2H8v-2Zm1 4h6v2H9v-2Z" fill="currentColor" />
    </svg>
  );
}

type LogoUploadSlotProps = {
  disabled: boolean;
  field: LogoField;
  label: string;
  previewUrl: string;
  value: string;
  onClear: (field: LogoField) => void;
  onSelect: (field: LogoField, file: File) => void;
};

function LogoUploadSlot({
  disabled,
  field,
  label,
  previewUrl,
  value,
  onClear,
  onSelect,
}: LogoUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const displaySrc = previewUrl || value;

  return (
    <section className="rounded-[5px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
          <p className="mt-1 break-all text-xs text-muted">{value || "No logo uploaded"}</p>
        </div>
      </div>

      <div className="mt-4 flex h-32 items-center justify-center rounded-[5px] border border-dashed border-border bg-white">
        {displaySrc ? (
          <AuthenticatedImage
            alt={label}
            className="max-h-24 max-w-[80%] object-contain"
            fallback={<span className="text-xs text-muted">Preview unavailable</span>}
            src={displaySrc}
          />
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted">Logo</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onSelect(field, file);
            }

            event.currentTarget.value = "";
          }}
          type="file"
        />
        <Button
          disabled={disabled}
          icon={<UploadIcon />}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          Upload
        </Button>
        <Button
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          disabled={disabled || (!value && !previewUrl)}
          icon={<RemoveIcon />}
          onClick={() => onClear(field)}
          size="sm"
          type="button"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
    </section>
  );
}

export default function SystemSettingsPage() {
  const [school, setSchool] = useState<SchoolSettings | null>(null);
  const [formValues, setFormValues] = useState<SchoolSettingsFormValues>(emptyFormValues);
  const [pendingLogoFiles, setPendingLogoFiles] = useState<PendingLogoFiles>({});
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<LogoField, string>>>({});
  const previewUrlsRef = useRef<Partial<Record<LogoField, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const lastUpdatedLabel = useMemo(() => {
    if (!school?.updated_at) {
      return "";
    }

    return new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(school.updated_at));
  }, [school?.updated_at]);

  const selectedRegion = useMemo(() => findRegionByValue(formValues.region), [formValues.region]);

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

  useEffect(() => {
    async function loadSchoolSettings() {
      setIsLoading(true);

      try {
        const response = await getSchoolSettings();
        setSchool(response);
        setFormValues(toFormValues(response));
      } catch (error) {
        showToast({
          title: "Unable to load system settings",
          description: getErrorMessage(error),
          tone: "error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadSchoolSettings();
  }, []);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  function showToast(toast: Omit<ToastItem, "id">) {
    setToasts((currentValue) => [...currentValue, createToast(toast)]);
  }

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  function updateField(field: keyof SchoolSettingsFormValues, value: string) {
    setFormValues((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function updateAddressField(field: "region" | "province" | "municipality_city" | "barangay" | "sitio_purok", value: string) {
    setFormValues((currentValue) => {
      const nextValue = {
        ...currentValue,
        [field]: value,
      };

      if (field === "region") {
        nextValue.province = value === "Region VII" ? "Bohol" : "";
        nextValue.municipality_city = "";
        nextValue.barangay = "";
      }

      if (field === "province") {
        nextValue.municipality_city = "";
        nextValue.barangay = "";
      }

      if (field === "municipality_city") {
        nextValue.barangay = "";
      }

      nextValue.address = buildSchoolAddress(nextValue);

      return nextValue;
    });
  }

  function handleLogoSelect(field: LogoField, file: File) {
    setPendingLogoFiles((currentValue) => ({
      ...currentValue,
      [field]: file,
    }));
    setPreviewUrls((currentValue) => {
      const previousUrl = currentValue[field];

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return {
        ...currentValue,
        [field]: URL.createObjectURL(file),
      };
    });
  }

  function handleLogoClear(field: LogoField) {
    setPendingLogoFiles((currentValue) => {
      const nextValue = { ...currentValue };
      delete nextValue[field];
      return nextValue;
    });
    setPreviewUrls((currentValue) => {
      const previousUrl = currentValue[field];

      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      const nextValue = { ...currentValue };
      delete nextValue[field];
      return nextValue;
    });
    updateField(field, "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const nextValues: SchoolSettingsFormValues = {
        ...formValues,
        address: buildSchoolAddress(formValues),
      };

      for (const logoField of logoFields) {
        const file = pendingLogoFiles[logoField.field];

        if (file) {
          const uploadedFile = await uploadFile(file);
          nextValues[logoField.field] = uploadedFile.relativeUrl;
        }
      }

      const updatedSchool = await updateSchoolSettings(nextValues);
      setSchool(updatedSchool);
      setFormValues(toFormValues(updatedSchool));
      setPendingLogoFiles({});
      setPreviewUrls((currentValue) => {
        Object.values(currentValue).forEach((url) => {
          if (url) {
            URL.revokeObjectURL(url);
          }
        });

        return {};
      });
      showToast({
        title: "System settings saved",
        description: "School profile and logos are now updated.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        title: "Unable to save system settings",
        description: getErrorMessage(error),
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isLoading || isSaving;

  return (
    <PagePlaceholder
      breadcrumb="Home > Settings > System"
      contentClassName="space-y-5"
      sectionLabel="School profile and official logos"
      title="System Settings"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">School Information</h2>
              {lastUpdatedLabel ? <p className="mt-1 text-sm text-muted">Last updated {lastUpdatedLabel}</p> : null}
            </div>
            <Button disabled={isBusy} icon={<SaveIcon />} type="submit">
              {isSaving ? "Saving" : "Save Changes"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">DepEd School ID</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("deped_school_id", event.target.value)}
                required
                value={formValues.deped_school_id}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">School Name</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("school_name", event.target.value)}
                required
                value={formValues.school_name}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">District</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("district", event.target.value)}
                required
                value={formValues.district}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Division</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateField("division", event.target.value)}
                required
                value={formValues.division}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Region</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("region", value)}
                options={regionOptions}
                placeholder="Region VII"
                value={formValues.region}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Province</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("province", value)}
                options={provinceOptions}
                placeholder="Bohol"
                value={formValues.province}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Municipality / City</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("municipality_city", value)}
                options={cityMunicipalityOptions}
                placeholder="Trinidad"
                value={formValues.municipality_city}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">Barangay</span>
              <LookupField
                disabled={isBusy}
                onChange={(value) => updateAddressField("barangay", value)}
                options={barangayOptions}
                placeholder="Poblacion"
                value={formValues.barangay}
              />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Sitio/Purok</span>
              <input
                className="h-10 w-full rounded-[5px] border border-border bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                disabled={isBusy}
                onChange={(event) => updateAddressField("sitio_purok", event.target.value)}
                placeholder="Purok 1"
                value={formValues.sitio_purok}
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Official Logos</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {logoFields.map((logoField) => (
              <LogoUploadSlot
                key={logoField.field}
                disabled={isBusy}
                field={logoField.field}
                label={logoField.label}
                onClear={handleLogoClear}
                onSelect={handleLogoSelect}
                previewUrl={previewUrls[logoField.field] ?? ""}
                value={formValues[logoField.field]}
              />
            ))}
          </div>
        </section>
      </form>

      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </PagePlaceholder>
  );
}
