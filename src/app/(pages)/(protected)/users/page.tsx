"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/app/components/Button/Button";
import ConfirmModal from "@/app/components/Modal/ConfirmModal";
import FormModal from "@/app/components/Modal/FormModal";
import Table from "@/app/components/Table/Table";
import rawBarangays from "@/app/data/barangays.json";
import rawCitiesMunicipalities from "@/app/data/cities-municipalities.json";
import rawProvinces from "@/app/data/provinces.json";
import rawRegions from "@/app/data/regions.json";
import rawSuffixes from "@/app/data/suffixes.json";
import rawUsers from "@/app/data/users.json";
import type { ModalField } from "@/app/types/components/modalTypes";
import type {
  UserOption,
  UsersDeleteState,
  UsersDialogState,
  UsersStatusState,
} from "@/app/types/components/usersManagerTypes";
import type { TableColumn } from "@/app/types/tableTypes";
import type { AdminUser, UserFormValues, UserRole, UserStatus, UserTableRow } from "@/app/types/userTypes";
import { getRoleTone, getStatusTone } from "@/app/utils/mockData";
import { createUsersResponse, normalizeUserRecord, toUserTableRow } from "@/app/utils/usersApi";

function normalizeRoles(value: string) {
  return value
    .split(",")
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean) as UserRole[];
}

function buildFullName(values: Pick<UserFormValues, "first_name" | "middle_name" | "last_name" | "suffix">) {
  return [values.first_name, values.middle_name, values.last_name, values.suffix]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
}

const initialUsers = (rawUsers as AdminUser[]).map(normalizeUserRecord);

const roleToneMap = {
  admin: getRoleTone("admin"),
  developer: getRoleTone("admin"),
  editor: getRoleTone("editor"),
  staff: getRoleTone("editor"),
  user: getRoleTone("user"),
};

const statusToneMap = {
  active: getStatusTone("active"),
  inactive: getStatusTone("inactive"),
  banned: getStatusTone("banned"),
};

const roleOptions: UserOption[] = [
  { label: "Admin", value: "admin" },
  { label: "Developer", value: "developer" },
  { label: "Editor", value: "editor" },
  { label: "Staff", value: "staff" },
  { label: "User", value: "user" },
];

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
  { label: "Banned", value: "banned" },
];

function buildUserFields(
  provinceOptions: UserOption[],
  cityMunicipalityOptions: UserOption[],
  barangayOptions: UserOption[],
): ModalField[] {
  return [
  {
    name: "first_name",
    label: "First Name",
    placeholder: "Juan",
    required: true,
  },
  {
    name: "middle_name",
    label: "Middle Name",
    placeholder: "Santos",
  },
  {
    name: "last_name",
    label: "Last Name",
    placeholder: "Dela Cruz",
    required: true,
  },
  {
    name: "suffix",
    label: "Suffix",
    placeholder: "Jr.",
    type: "lookup",
    options: suffixOptions,
  },
  {
    name: "sex",
    label: "Sex",
    type: "select",
    options: sexOptions,
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "juan@example.com",
    required: true,
  },
  {
    name: "contact_number",
    label: "Contact Number",
    placeholder: "09171234567",
  },
  {
    name: "username",
    label: "Username",
    placeholder: "juan.cruz",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter password",
    required: true,
  },
  {
    name: "confirm_password",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm password",
    required: true,
  },
  {
    name: "roles",
    label: "Role",
    type: "checkbox-group",
    options: roleOptions,
    maxSelections: 2,
    colSpan: 2,
  },
  {
    name: "position",
    label: "Position",
    placeholder: "Teacher I",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: statusOptions,
  },
  {
    name: "profile_picture",
    label: "Profile Picture",
    placeholder: "http://localhost/encript_token/profile.png",
    colSpan: 2,
  },
  {
    name: "region",
    label: "Region",
    type: "lookup",
    options: regionOptions,
    placeholder: "Region VII",
  },
  {
    name: "province",
    label: "Province",
    type: "lookup",
    options: provinceOptions,
    placeholder: "Cebu",
  },
  {
    name: "municipality_city",
    label: "Municipality / City",
    type: "lookup",
    options: cityMunicipalityOptions,
    placeholder: "Talisay City",
  },
  {
    name: "barangay",
    label: "Barangay",
    type: "lookup",
    options: barangayOptions,
    placeholder: "San Isidro",
  },
  {
    name: "address",
    label: "Address",
    placeholder: "Street and house details",
    colSpan: 2,
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
  password: "",
  confirm_password: "",
  roles: "user",
  position: "",
  status: "active",
  profile_picture: "",
};

function ViewIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5c5.5 0 9.27 5.11 9.43 5.33l.57.8-.57.8C21.27 12.15 17.5 17.27 12 17.27S2.73 12.15 2.57 11.93L2 11.13l.57-.8C2.73 10.11 6.5 5 12 5Zm0 2c-3.62 0-6.54 2.96-7.31 4.13.77 1.17 3.69 4.14 7.31 4.14s6.54-2.97 7.31-4.14C18.54 9.96 15.62 7 12 7Zm0 1.5A2.63 2.63 0 1 1 9.38 11 2.63 2.63 0 0 1 12 8.5Z" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="m4 15.75 9.81-9.81 4.25 4.25L8.25 20H4v-4.25Zm12.95-10.7a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-.83.83-4.25-4.25.83-.83Z" fill="currentColor" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" fill="currentColor" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 5a7 7 0 0 1 6.05 3.48V6H20v6h-6V10h2.56A5 5 0 1 0 17 15h2a7 7 0 1 1-7-10Z" fill="currentColor" />
    </svg>
  );
}

function getNextStatus(status: UserTableRow["status"]): UserStatus {
  if (status === "active") {
    return "inactive";
  }

  if (status === "inactive") {
    return "banned";
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
    password: user.password ?? "",
    confirm_password: user.password ?? "",
    roles: user.roles.join(","),
    position: user.position ?? "",
    status: user.status,
    profile_picture: user.profile_picture ?? user.avatar ?? "",
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<UsersDialogState | null>(null);
  const [deleteState, setDeleteState] = useState<UsersDeleteState | null>(null);
  const [statusState, setStatusState] = useState<UsersStatusState | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyFormValues);

  const usersResponse = useMemo(
    () =>
      createUsersResponse(users, {
        page: currentPage,
        perPage: pageSize,
        search: searchTerm,
        sortBy: "created_at",
        sortOrder: "desc",
        basePath: "/api/users",
      }),
    [currentPage, pageSize, searchTerm, users],
  );

  useEffect(() => {
    if (currentPage !== usersResponse.meta.page) {
      setCurrentPage(usersResponse.meta.page);
    }
  }, [currentPage, usersResponse.meta.page]);

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

  const userFields = useMemo(
    () => buildUserFields(provinceOptions, cityMunicipalityOptions, barangayOptions),
    [barangayOptions, cityMunicipalityOptions, provinceOptions],
  );

  const deleteUser = useMemo(
    () => users.find((user) => user.id === deleteState?.userId) ?? null,
    [deleteState?.userId, users],
  );

  const statusUser = useMemo(
    () => users.find((user) => user.id === statusState?.userId) ?? null,
    [statusState?.userId, users],
  );

  const tableUsers: UserTableRow[] = useMemo(
    () => usersResponse.data.map(toUserTableRow),
    [usersResponse.data],
  );

  function openAddModal() {
    setFormValues(emptyFormValues);
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

  function buildUserPayload(existingUser?: AdminUser) {
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
      password: formValues.password,
      avatar: formValues.profile_picture.trim(),
      profile_picture: formValues.profile_picture.trim(),
      roles: selectedRoles,
      position: formValues.position.trim(),
      status: formValues.status as UserStatus,
    };
  }

  function handleSaveUser() {
    if (!dialogState) {
      return;
    }

    if (dialogState.mode === "add") {
      const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
      setUsers((currentUsers) => [
        ...currentUsers,
        {
          id: nextId,
          ...buildUserPayload(),
          created_at: new Date().toISOString(),
        },
      ]);
      setCurrentPage(1);
      closeDialog();
      return;
    }

    if (dialogState.mode === "edit" && dialogState.userId !== null) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === dialogState.userId
            ? {
                ...buildUserPayload(user),
                id: user.id,
                created_at: user.created_at,
              }
            : user,
        ),
      );
      closeDialog();
    }
  }

  function handleDeleteUser() {
    if (!deleteState?.userId) {
      return;
    }

    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== deleteState.userId));
    closeDeleteDialog();
  }

  function handleUpdateStatus() {
    if (!statusState?.userId) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === statusState.userId
          ? {
              ...user,
              status: getNextStatus(user.status),
            }
          : user,
      ),
    );
    closeStatusDialog();
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
      key: "username",
      header: "Username",
      valueClassName: "text-sm font-medium text-slate-700",
    },
    {
      key: "contact_number",
      header: "Contact Number",
      valueClassName: "text-sm text-slate-700",
    },
    {
      key: "role",
      header: "Role",
      type: "badge",
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
      header: "Created At",
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
    <div className="space-y-4">
      <section className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-light text-slate-900">Users</h1>
        </div>
        <div className="text-sm text-muted">Home &gt; Users</div>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={openAddModal} size="sm">
            Add User
          </Button>
        </div>
        <Table
          columns={columns}
          data={tableUsers}
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
        columns={3}
        fields={userFields}
        isOpen={Boolean(dialogState)}
        mode={dialogState?.mode ?? "view"}
        onChange={handleFieldChange}
        onClose={closeDialog}
        onSubmit={dialogState?.mode === "view" ? undefined : handleSaveUser}
        size="modal-large"
        submitLabel={dialogState?.mode === "edit" ? "Save Changes" : "Create User"}
        title={
          dialogState?.mode === "view"
            ? "View User"
            : dialogState?.mode === "edit"
              ? "Edit User"
              : "Add User"
        }
        values={formValues}
      />

      <ConfirmModal
        confirmClassName="border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700"
        confirmLabel="Delete"
        description="Are you sure you want to delete"
        emphasisMessage="This action cannot be undone."
        emphasisTone="danger"
        isOpen={Boolean(deleteState)}
        itemLabel={deleteUser?.name ?? "this user"}
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
    </div>
  );
}
