"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button/Button";
import AuthenticatedImage from "@/app/components/Image/AuthenticatedImage";
import ImageCropField from "@/app/components/Image/ImageCropField";
import LookupField from "@/app/components/Modal/LookupField";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import { formatDate, getInitials, getRoleTone, getStatusTone } from "@/app/lib/display";
import type { ModalField } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type { ModalFieldOption } from "@/app/types/components/modalTypes";
import type { AdminUser } from "@/app/types/userTypes";
import { ApiError, listPositions, updateCurrentUserProfile } from "@/app/utils/api";

type ProfileEditorProps = {
  initialUser: AdminUser;
};

type ProfileFormValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  email: string;
  contact_number: string;
  address: string;
  barangay: string;
  municipality_city: string;
  province: string;
  region: string;
  username: string;
  position: string;
  profile_picture: string;
};

const profilePictureField: ModalField = {
  name: "profile_picture",
  label: "Profile Picture",
  type: "file",
  accept: "image/*",
  enableImageCrop: true,
  cropShape: "circle",
  cropAspect: 1,
};

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

const regionOptions = regions.map((region) => ({
  label: `${region.regionName} - ${region.name}`,
  value: region.regionName,
}));

const suffixOptions = (rawSuffixes as string[]).map((suffix) => ({
  label: suffix,
  value: suffix,
}));

const profileUpdateToastStorageKey = "profile-update-toast";

function readStoredProfileUpdateToast(): ToastItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedToast = window.sessionStorage.getItem(profileUpdateToastStorageKey);

  if (!storedToast) {
    return [];
  }

  window.sessionStorage.removeItem(profileUpdateToastStorageKey);

  try {
    const parsedToast = JSON.parse(storedToast) as {
      title?: string;
      description?: string;
      tone?: ToastItem["tone"];
    };

    if (!parsedToast.title || !parsedToast.description) {
      return [];
    }

    return [
      buildToast(
        parsedToast.title,
        parsedToast.description,
        parsedToast.tone ?? "success",
      ),
    ];
  } catch {
    return [];
  }
}

function createProfileFormValues(user: AdminUser): ProfileFormValues {
  return {
    first_name: user.first_name ?? "",
    middle_name: user.middle_name ?? "",
    last_name: user.last_name ?? "",
    suffix: user.suffix ?? "",
    sex: user.sex ?? "",
    email: user.email ?? "",
    contact_number: user.contact_number ?? "",
    address: user.address ?? "",
    barangay: user.barangay ?? "",
    municipality_city: user.municipality_city ?? "",
    province: user.province ?? "",
    region: user.region ?? "",
    username: user.username ?? "",
    position: user.position ?? "",
    profile_picture: user.profile_picture ?? user.avatar ?? "",
  };
}

function buildToast(title: string, description: string, tone: ToastItem["tone"]): ToastItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    tone,
  };
}

function formatRoleLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SectionIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m7 17 9.59-9.59a2 2 0 1 1 2.82 2.82L9.83 19H7v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[5px] border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {action ?? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] bg-slate-100 text-slate-400">
            <SectionIcon />
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function FormField({
  label,
  name,
  onChange,
  type = "text",
  value,
  disabled = false,
}: {
  label: string;
  name: keyof ProfileFormValues;
  onChange: (name: keyof ProfileFormValues, value: string) => void;
  type?: "text" | "email";
  value: string;
  disabled?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="h-11 w-full rounded-[5px] border border-border bg-background px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary"
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function LookupFieldWrap({
  label,
  options,
  placeholder,
  value,
  disabled,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <LookupField
        disabled={disabled}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export default function ProfileEditor({ initialUser }: ProfileEditorProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    createProfileFormValues(initialUser),
  );
  const [isEditEnabled, setIsEditEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>(() => readStoredProfileUpdateToast());
  const [positionOptions, setPositionOptions] = useState<ModalFieldOption[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadPositionOptions() {
      try {
        const positionData = await listPositions();

        if (!isMounted) {
          return;
        }

        setPositionOptions(
          positionData
            .map((position) => ({
              label: `${position.fullPosition} (${position.acronym}) - ${position.category}`,
              value: position.fullPosition,
            }))
            .sort((firstOption, secondOption) => firstOption.value.localeCompare(secondOption.value)),
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Please try again in a moment.";

        setToasts((currentValue) => [
          buildToast("Unable to load positions.", message, "error"),
          ...currentValue,
        ]);
      }
    }

    void loadPositionOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedRegion =
    regions.find(
      (region) => region.regionName === formValues.region || region.name === formValues.region,
    ) ?? null;

  const provinceOptions = provinces
    .filter((province) => !selectedRegion || province.regionCode === selectedRegion.code)
    .map((province) => ({
      label: province.name,
      value: province.name,
    }));

  const selectedProvince =
    provinces.find(
      (province) =>
        province.name === formValues.province &&
        (!selectedRegion || province.regionCode === selectedRegion.code),
    ) ?? null;

  const cityMunicipalityOptions = citiesMunicipalities
    .filter(
      (cityMunicipality) =>
        !selectedProvince || cityMunicipality.provinceCode === selectedProvince.code,
    )
    .map((cityMunicipality) => ({
      label: cityMunicipality.name,
      value: cityMunicipality.name,
    }));

  const selectedCityMunicipality =
    citiesMunicipalities.find(
      (cityMunicipality) =>
        cityMunicipality.name === formValues.municipality_city &&
        (!selectedProvince || cityMunicipality.provinceCode === selectedProvince.code),
    ) ?? null;

  const barangayOptions = barangays
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
    }));

  function dismissToast(toastId: string) {
    setToasts((currentValue) => currentValue.filter((toast) => toast.id !== toastId));
  }

  function updateValue<Key extends keyof ProfileFormValues>(
    name: Key,
    value: ProfileFormValues[Key],
  ) {
    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  function updateLookupValue(
    name: "region" | "province" | "municipality_city" | "barangay",
    value: string,
  ) {
    setFormValues((currentValue) => {
      if (name === "region") {
        return {
          ...currentValue,
          region: value,
          province: "",
          municipality_city: "",
          barangay: "",
        };
      }

      if (name === "province") {
        return {
          ...currentValue,
          province: value,
          municipality_city: "",
          barangay: "",
        };
      }

      if (name === "municipality_city") {
        return {
          ...currentValue,
          municipality_city: value,
          barangay: "",
        };
      }

      return {
        ...currentValue,
        barangay: value,
      };
    });
  }

  function handleEditToggle(event: ChangeEvent<HTMLInputElement>) {
    const isChecked = event.target.checked;
    setIsEditEnabled(isChecked);
    setErrorMessage(null);

    if (!isChecked) {
      setFormValues(createProfileFormValues(currentUser));
    }
  }

  function handleCancel() {
    setFormValues(createProfileFormValues(currentUser));
    setErrorMessage(null);
    setIsEditEnabled(false);
  }

  async function handleSave() {
    setErrorMessage(null);

    try {
      setIsSubmitting(true);

      const updatedUser = await updateCurrentUserProfile(formValues);
      setCurrentUser(updatedUser);
      setFormValues(createProfileFormValues(updatedUser));
      setIsEditEnabled(false);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          profileUpdateToastStorageKey,
          JSON.stringify({
            title: "Profile updated",
            description: "Your profile information was saved successfully.",
            tone: "success",
          }),
        );
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unable to update your profile right now.";

      setErrorMessage(message);
      setToasts((currentValue) => [
        buildToast("Profile update failed", message, "error"),
        ...currentValue,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  const initials = getInitials(currentUser.name);
  const fullName = [currentUser.first_name, currentUser.middle_name, currentUser.last_name, currentUser.suffix]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <>
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[5px] border border-border bg-card shadow-sm">
          <div className="bg-[linear-gradient(135deg,rgba(44,62,80,0.06),rgba(17,24,39,0.02))] px-5 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Profile Overview
                </p>
                <h2 className="text-lg font-semibold text-slate-950">Personal Card</h2>
              </div>
              <label className="inline-flex items-center gap-2 rounded-[5px] bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-border">
                <input
                  checked={isEditEnabled}
                  className="h-4 w-4 accent-primary"
                  onChange={handleEditToggle}
                  type="checkbox"
                />
                <span>Edit</span>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {isEditEnabled ? (
                <ImageCropField
                  field={profilePictureField}
                  isViewMode={false}
                  onChange={(name, value) => updateValue(name as keyof ProfileFormValues, value)}
                  value={formValues.profile_picture}
                />
              ) : (
                <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[5px] bg-slate-100 text-3xl font-semibold text-slate-700 ring-1 ring-inset ring-border">
                  <span>{initials}</span>
                  <AuthenticatedImage
                    alt={currentUser.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={currentUser.avatar ?? ""}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{currentUser.name}</h3>
                  <p className="text-sm text-muted">
                    {currentUser.position || "No position assigned"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentUser.roles.length > 0 ? (
                    currentUser.roles.map((role) => (
                      <span
                        className={[
                          "inline-flex rounded-[5px] px-3 py-1 text-xs font-semibold",
                          getRoleTone(role),
                        ].join(" ")}
                        key={role}
                      >
                        {formatRoleLabel(role)}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-[5px] bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      User
                    </span>
                  )}
                </div>

                <div
                  className={[
                    "inline-flex rounded-[5px] px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                    getStatusTone(currentUser.status),
                  ].join(" ")}
                >
                  {currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div className="grid gap-3 rounded-[5px] border border-border bg-background px-4 py-4">
              <DetailItem label="Username" value={currentUser.username || "-"} />
              <DetailItem label="Email" value={currentUser.email} />
              <DetailItem label="Joined" value={formatDate(currentUser.created_at)} />
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.95fr]">
            <SectionCard title="Basic Information">
              {isEditEnabled ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    disabled={isSubmitting}
                    label="First Name"
                    name="first_name"
                    onChange={updateValue}
                    value={formValues.first_name}
                  />
                  <FormField
                    disabled={isSubmitting}
                    label="Middle Name"
                    name="middle_name"
                    onChange={updateValue}
                    value={formValues.middle_name}
                  />
                  <FormField
                    disabled={isSubmitting}
                    label="Last Name"
                    name="last_name"
                    onChange={updateValue}
                    value={formValues.last_name}
                  />
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Suffix"
                    onChange={(value) => updateValue("suffix", value)}
                    options={suffixOptions}
                    placeholder="Jr."
                    value={formValues.suffix}
                  />
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Sex</span>
                    <select
                      className="h-11 w-full rounded-[5px] border border-border bg-background px-3.5 text-sm text-slate-900 outline-none transition focus:border-primary"
                      disabled={isSubmitting}
                      onChange={(event) => updateValue("sex", event.target.value)}
                      value={formValues.sex}
                    >
                      <option value="">Select sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </label>
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Position"
                    onChange={(value) => updateValue("position", value)}
                    options={positionOptions}
                    placeholder="Teacher I"
                    value={formValues.position}
                  />
                  <FormField
                    disabled={isSubmitting}
                    label="Email"
                    name="email"
                    onChange={updateValue}
                    type="email"
                    value={formValues.email}
                  />
                  <FormField
                    disabled={isSubmitting}
                    label="Contact Number"
                    name="contact_number"
                    onChange={updateValue}
                    value={formValues.contact_number}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailItem label="Full Name" value={fullName || "-"} />
                  <DetailItem label="Sex" value={currentUser.sex ? currentUser.sex.charAt(0).toUpperCase() + currentUser.sex.slice(1) : "-"} />
                  <DetailItem label="Email" value={currentUser.email} />
                  <DetailItem label="Contact Number" value={currentUser.contact_number || "-"} />
                </div>
              )}
            </SectionCard>

            <SectionCard title="Account Details">
              {isEditEnabled ? (
                <div className="space-y-4">
                  <FormField
                    disabled={isSubmitting}
                    label="Username"
                    name="username"
                    onChange={updateValue}
                    value={formValues.username}
                  />
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Position"
                    onChange={(value) => updateValue("position", value)}
                    options={positionOptions}
                    placeholder="Teacher I"
                    value={formValues.position}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem
                      label="Status"
                      value={currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
                    />
                    <DetailItem label="Joined" value={formatDate(currentUser.created_at)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <DetailItem label="Username" value={currentUser.username || "-"} />
                  <DetailItem label="Position" value={currentUser.position || "-"} />
                  <DetailItem
                    label="Status"
                    value={currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
                  />
                  <DetailItem label="Joined" value={formatDate(currentUser.created_at)} />
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Address">
            {isEditEnabled ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Region"
                    onChange={(value) => updateLookupValue("region", value)}
                    options={regionOptions}
                    placeholder="Region VII"
                    value={formValues.region}
                  />
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Province"
                    onChange={(value) => updateLookupValue("province", value)}
                    options={provinceOptions}
                    placeholder="Cebu"
                    value={formValues.province}
                  />
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Municipality / City"
                    onChange={(value) => updateLookupValue("municipality_city", value)}
                    options={cityMunicipalityOptions}
                    placeholder="Talisay City"
                    value={formValues.municipality_city}
                  />
                  <LookupFieldWrap
                    disabled={isSubmitting}
                    label="Barangay"
                    onChange={(value) => updateLookupValue("barangay", value)}
                    options={barangayOptions}
                    placeholder="San Isidro"
                    value={formValues.barangay}
                  />
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Address</span>
                  <textarea
                    className="min-h-24 w-full rounded-[5px] border border-border bg-background px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-primary"
                    disabled={isSubmitting}
                    onChange={(event) => updateValue("address", event.target.value)}
                    value={formValues.address}
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailItem label="Region" value={currentUser.region || "-"} />
                <DetailItem label="Province" value={currentUser.province || "-"} />
                <DetailItem
                  label="Municipality / City"
                  value={currentUser.municipality_city || "-"}
                />
                <DetailItem label="Barangay" value={currentUser.barangay || "-"} />
                <div className="md:col-span-2 xl:col-span-4">
                  <DetailItem label="Address" value={currentUser.address || "-"} />
                </div>
              </div>
            )}
          </SectionCard>

          {errorMessage ? (
            <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isEditEnabled ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button disabled={isSubmitting} onClick={handleCancel} variant="secondary">
                Cancel
              </Button>
              <Button disabled={isSubmitting} onClick={() => void handleSave()}>
                {isSubmitting ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
