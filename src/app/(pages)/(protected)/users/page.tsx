"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import { DeleteIcon, EditIcon, RefreshIcon, ViewIcon } from "@/app/components/Icon/UserActionIcons";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import Table from "@/app/components/Table/Table";
import ToastViewport from "@/app/components/Toast/ToastViewport";
import UserViewModal from "@/app/components/User/UserViewModal";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import type { AppRole } from "@/app/types/accessControlTypes";
import type { ModalField } from "@/app/types/components/modalTypes";
import type { ToastItem } from "@/app/types/components/toastTypes";
import type {
  UserOption,
  UsersDeleteState,
  UsersDialogState,
  UsersStatusState,
} from "@/app/types/components/usersManagerTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import type { AdminUser, UserFormValues, UserStatus, UserTableRow } from "@/app/types/userTypes";
import {
  createUser,
  deleteUser,
  getClientAuthSession,
  listPositions,
  listRoles,
  listUsers,
  updateUser,
} from "@/app/utils/api";
import { buildRoleToneMap, getStatusTone } from "@/app/lib/display";
import { createUsersResponse, normalizeUserRecord, toUserTableRow } from "@/app/utils/usersApi";

function normalizeRoles(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function formatRoleLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFullName(values: Pick<UserFormValues, "first_name" | "middle_name" | "last_name" | "suffix">) {
  return [values.first_name, values.middle_name, values.last_name, values.suffix]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeContactNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

const statusToneMap = {
  active: getStatusTone("active"),
  inactive: getStatusTone("inactive"),

};

const sexOptions: UserOption[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const suffixOptions: UserOption[] = (rawSuffixes as string[]).map((suffix) => ({
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

const regionOptions: UserOption[] = (
  rawRegions as Array<{ code: string; name: string; regionName: string }>
).map((region) => ({
  label: `${region.regionName} - ${region.name}`,
  value: region.regionName,
}));

const statusOptions: UserOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function buildUserFields(
  roleOptions: UserOption[],
  positionOptions: UserOption[],
  provinceOptions: UserOption[],
  cityMunicipalityOptions: UserOption[],
  barangayOptions: UserOption[],
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
    name: "roles",
    label: "Role",
    type: "checkbox-group",
    options: roleOptions,
    maxSelections: 3,
    checkboxStyle: "pill",
    layoutClassName: "md:col-span-6 xl:col-span-6",
  },
  {
    name: "first_name",
    label: "First Name",
    placeholder: "Juan",
    required: true,
    layoutClassName: "md:col-span-3 xl:col-span-4",
  },
  {
    name: "middle_name",
    label: "Middle Name",
    placeholder: "Santos",
    layoutClassName: "md:col-span-3 xl:col-span-4",
  },
  {
    name: "last_name",
    label: "Last Name",
    placeholder: "Dela Cruz",
    required: true,
    layoutClassName: "md:col-span-6 xl:col-span-4",
  },
  {
    name: "suffix",
    label: "Suffix",
    placeholder: "Jr.",
    type: "lookup",
    options: suffixOptions,
    layoutClassName: "md:col-span-3 xl:col-span-2",
  },
  {
    name: "sex",
    label: "Sex",
    type: "select",
    options: sexOptions,
    layoutClassName: "md:col-span-3 xl:col-span-2",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "juan@example.com",
    required: true,
    layoutClassName: "md:col-span-6 xl:col-span-4",
  },
  {
    name: "username",
    label: "Username",
    placeholder: "juan.cruz",
    required: true,
    layoutClassName: "md:col-span-6 xl:col-span-4",
  },
  {
    name: "contact_number",
    label: "Contact #",
    placeholder: "09171234567",
    helperText: "Enter 10 to 11 digits only.",
    layoutClassName: "md:col-span-6 xl:col-span-4",
  },
  {
    name: "position",
    label: "Position",
    type: "lookup",
    options: positionOptions,
    placeholder: "Teacher I",
    layoutClassName: "md:col-span-6 xl:col-span-4",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: statusOptions,
    layoutClassName: "md:col-span-6 xl:col-span-4",
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
    layoutClassName: "md:col-span-6 xl:col-span-8",
  },
  ];
}

const emptyFormValues: UserFormValues = {
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  sex: "male",
  email: "",
  contact_number: "",
  address: "",
  barangay: "",
  municipality_city: "",
  province: "Bohol",
  region: "Region VII",
  username: "",
  roles: "user",
  position: "",
  status: "active",
  profile_picture: "",
};

function createToastId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRandomIndex(maxValue: number) {
  if (maxValue <= 0) {
    return 0;
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] % maxValue;
  }

  return Math.floor(Math.random() * maxValue);
}

function pickRandomCharacter(characters: string) {
  return characters.charAt(getRandomIndex(characters.length));
}

function generateTemporaryPassword() {
  const uppercaseCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercaseCharacters = "abcdefghijkmnopqrstuvwxyz";
  const numberCharacters = "23456789";
  const symbolCharacters = "!@#$%^&*";
  const allCharacters =
    `${uppercaseCharacters}${lowercaseCharacters}${numberCharacters}${symbolCharacters}`;

  const passwordCharacters = [
    pickRandomCharacter(uppercaseCharacters),
    pickRandomCharacter(lowercaseCharacters),
    pickRandomCharacter(numberCharacters),
    pickRandomCharacter(symbolCharacters),
    ...Array.from({ length: 8 }, () => pickRandomCharacter(allCharacters)),
  ];

  for (let currentIndex = passwordCharacters.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = getRandomIndex(currentIndex + 1);
    const currentCharacter = passwordCharacters[currentIndex];
    passwordCharacters[currentIndex] = passwordCharacters[randomIndex];
    passwordCharacters[randomIndex] = currentCharacter;
  }

  return passwordCharacters.join("");
}

function getNextStatus(status: UserTableRow["status"]): UserStatus {
  if (status === "active") {
    return "inactive";
  }



  return "active";
}

function normalizeFormValues(user: AdminUser | null): UserFormValues {
  if (!user) {
    return emptyFormValues;
  }

  return {
    first_name: user.first_name ?? "",
    middle_name: user.middle_name ?? "",
    last_name: user.last_name ?? "",
    suffix: user.suffix ?? "",
    sex: user.sex ?? "male",
    email: user.email,
    contact_number: user.contact_number ?? "",
    address: user.address ?? "",
    barangay: user.barangay ?? "",
    municipality_city: user.municipality_city ?? "",
    province: user.province ?? "",
    region: user.region ?? "",
    username: user.username ?? "",
    roles: user.roles.join(","),
    position: user.position ?? "",
    status: user.status,
    profile_picture: user.profile_picture ?? user.avatar ?? "",
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]);
  const [positionOptions, setPositionOptions] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<UsersDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<UsersDeleteState | null>(null);
  const [statusState, setStatusState] = useState<UsersStatusState | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyFormValues);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersResponse = useMemo(
    () =>
      createUsersResponse(users, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "created_at",
        sortOrder: "desc",
        basePath: "/users",
      }),
    [currentPage, pageSize, searchTerm, users],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setIsLoading(true);
        const currentSessionUserId = getClientAuthSession()?.user.id ?? null;
        const [userData, roleData, positionData] = await Promise.all([
          listUsers(),
          listRoles(),
          listPositions(),
        ]);

        if (!isMounted) {
          return;
        }

        setUsers(
          userData
            .filter((user) => (currentSessionUserId ? user.id !== currentSessionUserId : true))
            .map(normalizeUserRecord),
        );
        setAvailableRoles(roleData);
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

        showToast({
          tone: "error",
          title: "Unable to load users.",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

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

  const roleOptions = useMemo(() => {
    const roleValues = new Set<string>();

    availableRoles.forEach((role) => {
      const normalizedValue = role.name.trim().toLowerCase();

      if (normalizedValue) {
        roleValues.add(normalizedValue);
      }
    });

    users.forEach((user) => {
      user.roles.forEach((role) => {
        const normalizedValue = role.trim().toLowerCase();

        if (normalizedValue) {
          roleValues.add(normalizedValue);
        }
      });
    });

    return Array.from(roleValues)
      .sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
      .map((role) => ({
        label: formatRoleLabel(role),
        value: role,
      }));
  }, [availableRoles, users]);

  const defaultRoleValue = roleOptions[0]?.value ?? "user";

  const roleToneMap = useMemo(
    () => buildRoleToneMap([...roleOptions.map((role) => role.value), ...users.flatMap((user) => user.roles)]),
    [roleOptions, users],
  );

  const userFields = useMemo(
    () =>
      buildUserFields(
        roleOptions,
        positionOptions,
        provinceOptions,
        cityMunicipalityOptions,
        barangayOptions,
      ),
    [barangayOptions, cityMunicipalityOptions, positionOptions, provinceOptions, roleOptions],
  );

  const deleteTargetUser = useMemo(
    () => users.find((user) => user.id === deleteState?.userId) ?? null,
    [deleteState?.userId, users],
  );

  const statusUser = useMemo(
    () => users.find((user) => user.id === statusState?.userId) ?? null,
    [statusState?.userId, users],
  );

  const viewUser = useMemo(
    () => users.find((user) => user.id === dialogState?.userId) ?? null,
    [dialogState?.userId, users],
  );

  const tableUsers: UserTableRow[] = useMemo(
    () => usersResponse.data.map(toUserTableRow),
    [usersResponse.data],
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
    setFormValues({
      ...emptyFormValues,
      roles: defaultRoleValue,
    });
    setDialogState({
      mode: "add",
      userId: null,
    });
  }

  function openViewModal(userId: number) {
    const user = users.find((item) => item.id === userId) ?? null;
    setFormValues(normalizeFormValues(user));
    setDialogState({
      mode: "view",
      userId,
    });
  }

  function openEditModal(userId: number) {
    const user = users.find((item) => item.id === userId) ?? null;
    setFormValues(normalizeFormValues(user));
    setDialogState({
      mode: "edit",
      userId,
    });
  }

  function openDeleteModal(userId: number) {
    setDeleteState({ userId });
  }

  function openStatusModal(userId: number) {
    setStatusState({ userId });
  }

  function closeDialog() {
    setDialogState(null);
    setFormValues(emptyFormValues);
  }

  function closeDeleteDialog() {
    setDeleteState(null);
  }

  function closeStatusDialog() {
    setStatusState(null);
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

  function buildUserPayload(existingUser?: AdminUser, temporaryPassword?: string) {
    const selectedRoles = normalizeRoles(formValues.roles);

    return {
      ...existingUser,
      name: buildFullName(formValues),
      first_name: formValues.first_name.trim(),
      middle_name: formValues.middle_name.trim(),
      last_name: formValues.last_name.trim(),
      suffix: formValues.suffix.trim(),
      sex: formValues.sex as AdminUser["sex"],
      email: formValues.email.trim().toLowerCase(),
      contact_number: formValues.contact_number.trim(),
      address: formValues.address.trim(),
      barangay: formValues.barangay.trim(),
      municipality_city: formValues.municipality_city.trim(),
      province: formValues.province.trim(),
      region: formValues.region.trim(),
      username: formValues.username.trim(),
      ...(temporaryPassword ? { password: temporaryPassword } : {}),
      avatar: formValues.profile_picture.trim(),
      profile_picture: formValues.profile_picture.trim(),
      roles: selectedRoles,
      position: formValues.position.trim(),
      status: formValues.status as UserStatus,
    };
  }

  async function handleSaveUser() {
    if (!dialogState) {
      return;
    }

    const normalizedContactNumber = normalizeContactNumberInput(formValues.contact_number);

    if (normalizedContactNumber && !/^\d{10,11}$/.test(normalizedContactNumber)) {
      showToast({
        tone: "error",
        title: "Invalid contact number.",
        description: "Contact # must be 10 to 11 digits only.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (dialogState.mode === "add") {
        const temporaryPassword = generateTemporaryPassword();
        const createdUser = await createUser(
          buildUserPayload(undefined, temporaryPassword),
        );

        setUsers((currentUsers) => [normalizeUserRecord(createdUser), ...currentUsers]);
        setCurrentPage(1);
        closeDialog();
        showToast({
          tone: "success",
          title: "User created successfully.",
          description: (
            <span>
              Temporary password:{" "}
              <span className="font-mono font-semibold text-slate-900">
                {temporaryPassword}
              </span>
            </span>
          ),
          duration: 10000,
        });
        return;
      }

      if (dialogState.mode === "edit" && dialogState.userId !== null) {
        const user = users.find((item) => item.id === dialogState.userId);
        const updatedUser = await updateUser(dialogState.userId, buildUserPayload(user));

        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser.id === dialogState.userId
              ? normalizeUserRecord(updatedUser)
              : currentUser,
          ),
        );
        closeDialog();
        showToast({
          tone: "success",
          title: "User updated successfully.",
        });
      }
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to save the user.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteState?.userId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteUser(deleteState.userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== deleteState.userId));
      closeDeleteDialog();
      showToast({
        tone: "success",
        title: "User deleted successfully.",
        description: deleteTargetUser?.name
          ? `${deleteTargetUser.name} was removed from the list.`
          : undefined,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to delete the user.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus() {
    if (!statusState?.userId) {
      return;
    }

    const user = users.find((item) => item.id === statusState.userId);

    if (!user) {
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedUser = await updateUser(statusState.userId, {
        status: getNextStatus(user.status),
      });

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === statusState.userId
            ? normalizeUserRecord(updatedUser)
            : currentUser,
        ),
      );
      closeStatusDialog();
      showToast({
        tone: "success",
        title: "User status updated.",
        description: `${user.name} is now ${getNextStatus(user.status)}.`,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Unable to update user status.",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: TableColumn<UserTableRow>[] = [
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
      key: "contact_number",
      header: "Contact #",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "position",
      header: "Position",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "roles",
      header: "Role",
      type: "badges",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold",
      toneMap: roleToneMap,
    },
    {
      key: "status",
      header: "Status",
      type: "badge",
      badgeClassName: "inline-flex rounded px-2 py-1 text-xs font-semibold ring-1 ring-inset",
      toneMap: statusToneMap,
    },
    {
      key: "created_at",
      header: "Join Date",
      valueClassName: "text-sm text-slate-600",
    },
    {
      key: "actions",
      header: "Actions",
      type: "actions",
      className: "whitespace-nowrap",
      headerClassName: "w-[180px]",
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
          label: "Update Status",
          icon: <RefreshIcon />,
          onClick: (row) => openStatusModal(Number(row.id)),
          tone: "primary",
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
    <PagePlaceholder breadcrumb="Home > Users" title="Users">
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button disabled={isSubmitting} onClick={openAddModal} size="sm">
            Add User
          </Button>
        </div>
        <Table
          columns={columns}
          data={tableUsers}
          emptyMessage={isLoading ? "Loading users..." : "No users found."}
          pagination={{
            page: usersResponse.meta.page,
            perPage: usersResponse.meta.per_page,
            total: usersResponse.meta.total,
            totalPages: usersResponse.meta.total_pages,
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
          searchPlaceholder="Search name, email, username, role, or status"
        />
      </div>

      <FormModal
        bodyClassName="px-5 py-5 sm:px-5 sm:py-5"
        columns={3}
        fields={userFields}
        fieldClassName="space-y-1"
        footerClassName="border-t border-border bg-card px-5 py-4 sm:px-5"
        gridClassName="grid-cols-1 md:grid-cols-6 xl:grid-cols-12 xl:auto-rows-min"
        headerClassName="border-b border-border px-5 py-3.5 sm:px-5"
        isOpen={Boolean(dialogState) && dialogState?.mode !== "view"}
        labelClassName="text-[13px] font-semibold text-slate-700"
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveUser}
        panelClassName="rounded-[6px] border border-border bg-card shadow-[0_14px_38px_rgba(15,23,42,0.14)]"
        size="modal-large"
        submitLabel={
          isSubmitting
            ? dialogState?.mode === "edit"
              ? "Saving..."
              : "Creating..."
            : dialogState?.mode === "edit"
              ? "Save Changes"
              : "Create User"
        }
        title={
          dialogState?.mode === "view"
            ? "View User"
            : dialogState?.mode === "edit"
              ? "Edit User"
              : "Add User"
        }
        titleClassName="text-[17px] font-semibold text-slate-950 sm:text-[18px]"
        values={formValues}
      />

      <UserViewModal
        isOpen={dialogState?.mode === "view"}
        onClose={closeDialog}
        onEdit={openEditModal}
        user={viewUser}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteTargetUser?.name ?? "this user"}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteUser}
        title="Delete User"
      />

      <ConfirmModal
        confirmClassName="border-sky-600 bg-sky-600 text-white hover:border-sky-700 hover:bg-sky-700"
        confirmLabel="Update Status"
        description="Are you sure you want to update the status of"
        emphasisMessage={
          statusUser
            ? `Current status: ${statusUser.status}. New status: ${getNextStatus(statusUser.status)}.`
            : ""
        }
        emphasisTone="primary"
        isOpen={Boolean(statusState)}
        itemLabel={statusUser?.name ?? "this user"}
        onClose={closeStatusDialog}
        onConfirm={handleUpdateStatus}
        title="Update Status"
      />
    </PagePlaceholder>
  );
}
