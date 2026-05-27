import axios from "axios";
import type { AppModule, AppPermission, AppRole } from "@/app/types/accessControlTypes";
import type { SessionUser } from "@/app/types/authTypes";
import type {
  BackendApiResponse,
  BackendAuthResponseDto,
  BackendGuardianResponseDto,
  BackendModuleResponseDto,
  BackendPermissionResponseDto,
  BackendSchoolSettingsResponseDto,
  BackendStudentInformationLookupDto,
  BackendStudentInformationLookupsResponseDto,
  BackendStudentInformationResponseDto,
  BackendStudentGuardianResponseDto,
  BackendStudentResponseDto,
  BackendPositionResponseDto,
  BackendRoleResponseDto,
  BackendUserResponseDto,
} from "@/app/types/backendTypes";
import type { AppIconName } from "@/app/types/iconTypes";
import type { GuardianRecord } from "@/app/types/guardianTypes";
import type {
  StudentGuardianRecord,
  StudentGuardianRelationFormValues,
} from "@/app/types/studentGuardianTypes";
import type {
  StudentInformation,
  StudentInformationLookup,
  StudentInformationLookups,
  StudentRecord,
  StudentSex,
  StudentStatus,
} from "@/app/types/studentTypes";
import type { AdminUser, ChangePasswordPayload, UserSex, UserStatus } from "@/app/types/userTypes";
import type { SchoolSettings } from "@/app/types/systemTypes";

export const AUTH_COOKIE_NAME = "tmc-itclub-session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthSessionCookie = {
  token: string;
  user: SessionUser;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

type UploadedFileResponseDto = {
  category: string;
  fieldName: string;
  originalName: string;
  filename: string;
  mimeType: string;
  extension: string;
  sizeInBytes: number;
  relativeUrl: string;
  publicUrl: string;
  apiViewUrl: string;
  storagePath: string;
};

const iconNames = new Set<AppIconName>([
  "dashboard",
  "administration",
  "settings",
  "users",
  "products",
  "orders",
  "analytics",
  "reports",
  "images",
  "chart",
  "document",
  "shield",
]);

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function getApiBaseUrl() {
  const value = process.env.BASE_API?.trim();

  if (!value) {
    throw new ApiError(500, "BASE_API is not set.");
  }

  return value.replace(/\/+$/, "");
}

function getBackendOrigin() {
  const value = process.env.BASE_URL?.trim();

  if (value) {
    return value.replace(/\/+$/, "");
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return apiBaseUrl.replace(/\/api\/?$/, "");
  }
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError<BackendApiResponse<unknown>>(error)) {
    const status = error.response?.status ?? 500;
    const payload = error.response?.data;

    return new ApiError(
      status,
      payload?.message ?? error.message ?? `API request failed with status ${status}.`,
      payload && !payload.success ? payload.errors : undefined,
    );
  }

  return new ApiError(500, error instanceof Error ? error.message : "Unexpected API request error.");
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeUserRole(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue || "user";
}

function normalizeUserStatus(value: string | null): UserStatus {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "inactive";
}

function normalizeUserSex(value: string | null): UserSex | undefined {
  if (value === "male" || value === "female") {
    return value;
  }

  return undefined;
}

function normalizeIconName(value: string | null): AppIconName {
  if (value && iconNames.has(value as AppIconName)) {
    return value as AppIconName;
  }

  return "users";
}

function normalizeStudentStatus(value: string | null): StudentStatus {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "transferred" ||
    value === "graduated"
  ) {
    return value;
  }

  return "active";
}

function normalizeStudentSex(value: string | null): StudentSex {
  if (value === "female") {
    return "female";
  }

  return "male";
}

function splitRoleValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toNullableString(item))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildFullNameFromParts(parts: Array<string | null>) {
  return parts.filter(Boolean).join(" ").trim();
}

function mapBackendUserToAdminUser(user: BackendUserResponseDto): AdminUser {
  const firstName = user.firstName ?? "";
  const middleName = user.middleName ?? "";
  const lastName = user.lastName ?? "";
  const suffix = user.suffix ?? "";
  const fullName =
    user.name ||
    buildFullNameFromParts([firstName, middleName, lastName, suffix]) ||
    user.email;

  const storedProfilePicture = toStoredAssetPath(user.profilePicture ?? "");
  const profilePicture = resolveBackendAssetUrl(storedProfilePicture);

  return {
    id: user.id,
    name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    sex: normalizeUserSex(user.sex),
    email: user.email,
    contact_number: user.contactNumber ?? "",
    address: user.address ?? "",
    barangay: user.barangay ?? "",
    municipality_city: user.municipalityCity ?? "",
    province: user.province ?? "",
    region: user.region ?? "",
    username: user.username ?? "",
    avatar: profilePicture,
    profile_picture: storedProfilePicture,
    roles: user.roles.map(normalizeUserRole),
    position: user.position ?? "",
    status: normalizeUserStatus(user.status),
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    deleted_at: user.deletedAt
  };
}

function mapBackendStudentToStudentRecord(student: BackendStudentResponseDto): StudentRecord {
  const firstName = student.firstName.trim();
  const middleName = student.middleName?.trim() ?? "";
  const lastName = student.lastName.trim();
  const suffix = student.suffix?.trim() ?? "";
  const storedProfilePicture = toStoredAssetPath(student.profilePicture ?? "");
  const profilePicture = resolveBackendAssetUrl(storedProfilePicture);

  return {
    id: student.id,
    lrn: student.lrn,
    full_name: buildFullNameFromParts([firstName, middleName, lastName, suffix]) || student.lrn,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    sex: normalizeStudentSex(student.sex),
    birthdate: student.birthdate,
    birthplace: student.birthplace?.trim() ?? "",
    street_address: student.streetAddress?.trim() ?? "",
    barangay: student.barangay.trim(),
    city_municipality: student.cityMunicipality.trim(),
    province: student.province.trim(),
    region: student.region.trim(),
    status: normalizeStudentStatus(student.status),
    avatar: profilePicture,
    profile_picture: storedProfilePicture,
    created_at: student.createdAt,
    updated_at: student.updatedAt,
    deleted_at: student.deletedAt,
  };
}

function mapBackendGuardianToGuardianRecord(guardian: BackendGuardianResponseDto): GuardianRecord {
  const firstName = guardian.firstName.trim();
  const middleName = guardian.middleName?.trim() ?? "";
  const lastName = guardian.lastName.trim();
  const suffix = guardian.suffix?.trim() ?? "";
  const storedProfilePicture = toStoredAssetPath(guardian.profilePicture ?? "");
  const profilePicture = resolveBackendAssetUrl(storedProfilePicture);

  return {
    id: guardian.id,
    full_name: buildFullNameFromParts([firstName, middleName, lastName, suffix]) || firstName || lastName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    contact_number: guardian.contactNumber.trim(),
    address: guardian.address.trim(),
    barangay: guardian.barangay.trim(),
    municipality_city: guardian.municipalityCity.trim(),
    province: guardian.province.trim(),
    region: guardian.region.trim(),
    avatar: profilePicture,
    profile_picture: storedProfilePicture,
    created_at: guardian.createdAt,
    updated_at: guardian.updatedAt,
    deleted_at: guardian.deletedAt,
  };
}

function mapBackendStudentGuardianToStudentGuardianRecord(
  relation: BackendStudentGuardianResponseDto,
): StudentGuardianRecord {
  return {
    id: relation.id,
    student_id: relation.studentId,
    guardian_id: relation.guardianId,
    relationship: relation.relationship.trim(),
    is_primary: Boolean(relation.isPrimary),
    guardian: mapBackendGuardianToGuardianRecord(relation.guardian),
    created_at: relation.createdAt,
    updated_at: relation.updatedAt,
    deleted_at: relation.deletedAt,
  };
}

function mapBackendStudentInformationLookup(
  lookup: BackendStudentInformationLookupDto,
): StudentInformationLookup {
  return {
    id: lookup.id,
    name: lookup.name,
    sort_order: lookup.sortOrder,
    is_active: Boolean(lookup.isActive),
  };
}

function mapBackendStudentInformationLookups(
  lookups: BackendStudentInformationLookupsResponseDto,
): StudentInformationLookups {
  return {
    mother_tongues: lookups.motherTongues.map(mapBackendStudentInformationLookup),
    indigenous_groups: lookups.indigenousGroups.map(mapBackendStudentInformationLookup),
    religions: lookups.religions.map(mapBackendStudentInformationLookup),
  };
}

function mapBackendStudentInformation(
  information: BackendStudentInformationResponseDto,
): StudentInformation {
  return {
    student_id: information.studentId,
    mother_tongue: information.motherTongue
      ? mapBackendStudentInformationLookup(information.motherTongue)
      : null,
    indigenous_group: information.indigenousGroup
      ? mapBackendStudentInformationLookup(information.indigenousGroup)
      : null,
    religion: information.religion ? mapBackendStudentInformationLookup(information.religion) : null,
  };
}

function mapBackendSchoolSettings(school: BackendSchoolSettingsResponseDto): SchoolSettings {
  return {
    school_id: school.schoolId,
    deped_school_id: school.depedSchoolId,
    school_name: school.schoolName,
    district: school.district,
    division: school.division,
    region: school.region,
    address: school.address,
    school_logo: toStoredAssetPath(school.schoolLogo),
    deped_logo: toStoredAssetPath(school.depedLogo),
    other_logo: toStoredAssetPath(school.otherLogo),
    created_at: school.createdAt,
    updated_at: school.updatedAt,
    deleted_at: school.deletedAt,
  };
}

function inferFileExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return ".jpg";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  if (mimeType === "image/webp") {
    return ".webp";
  }

  if (mimeType === "image/gif") {
    return ".gif";
  }

  if (mimeType === "image/svg+xml") {
    return ".svg";
  }

  const subtype = mimeType.split("/")[1]?.trim();

  if (!subtype) {
    return ".bin";
  }

  return `.${subtype.replace(/[^a-z0-9.+-]/gi, "").toLowerCase() || "bin"}`;
}

function toStoredAssetPath(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue || trimmedValue.startsWith("data:")) {
    return trimmedValue;
  }

  if (!/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`;
  }

  try {
    const parsedValue = new URL(trimmedValue);

    if (parsedValue.origin === getBackendOrigin()) {
      return `${parsedValue.pathname}${parsedValue.search}${parsedValue.hash}`;
    }
  } catch {
    return trimmedValue;
  }

  return trimmedValue;
}

export function requiresAuthenticatedAssetRequest(value: string | null | undefined) {
  const normalizedValue = toStoredAssetPath(value);

  if (!normalizedValue || normalizedValue.startsWith("data:") || normalizedValue.startsWith("blob:")) {
    return false;
  }

  return (
    normalizedValue.startsWith("/uploads/") ||
    normalizedValue.startsWith("/api/uploads/files/")
  );
}

export function resolveBackendAssetUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim() ?? "";

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.startsWith("data:") || /^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  const normalizedPath = trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`;
  return `${getBackendOrigin()}${normalizedPath}`;
}

async function dataUrlToFile(dataUrl: string, fileBaseName = "profile-picture") {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new ApiError(response.status, "Unable to read the selected profile image.");
  }

  const blob = await response.blob();
  const mimeType = blob.type || "application/octet-stream";
  const fileExtension = inferFileExtension(mimeType);

  return new File([blob], `${fileBaseName}${fileExtension}`, {
    type: mimeType,
  });
}

export async function uploadFile(file: File, token?: string) {
  const formData = new FormData();
  formData.append("file", file);

  return requestAuthenticatedApi<UploadedFileResponseDto>("/uploads/single", {
    method: "POST",
    body: formData,
    token,
  });
}

async function prepareProfilePictureValue(value: unknown, token?: string) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (!trimmedValue.startsWith("data:")) {
    return toStoredAssetPath(trimmedValue);
  }

  const file = await dataUrlToFile(trimmedValue);
  const uploadedFile = await uploadFile(file, token);

  return uploadedFile.relativeUrl;
}

async function prepareUserPayload(
  payload: Record<string, unknown>,
  mode: "create" | "update",
  token?: string,
) {
  const nextPayload = { ...payload };

  if ("profile_picture" in nextPayload) {
    nextPayload.profile_picture = await prepareProfilePictureValue(
      nextPayload.profile_picture,
      token,
    );
  }

  return mapUserPayloadToBackend(nextPayload, mode);
}

async function prepareStudentPayload(
  payload: Record<string, unknown>,
  mode: "create" | "update",
  token?: string,
) {
  const nextPayload = { ...payload };

  if ("profile_picture" in nextPayload) {
    nextPayload.profile_picture = await prepareProfilePictureValue(
      nextPayload.profile_picture,
      token,
    );
  }

  return mapStudentPayloadToBackend(nextPayload, mode);
}

async function prepareGuardianPayload(
  payload: Record<string, unknown>,
  mode: "create" | "update",
  token?: string,
) {
  const nextPayload = { ...payload };

  if ("profile_picture" in nextPayload) {
    nextPayload.profile_picture = await prepareProfilePictureValue(
      nextPayload.profile_picture,
      token,
    );
  }

  return mapGuardianPayloadToBackend(nextPayload, mode);
}

async function prepareStudentGuardianPayload(
  payload: Record<string, unknown>,
  token?: string,
) {
  const nextPayload = { ...payload };
  const hasExistingGuardianId =
    ("guardian_id" in nextPayload && typeof nextPayload.guardian_id === "string" && nextPayload.guardian_id.trim().length > 0) ||
    ("guardian_id" in nextPayload && typeof nextPayload.guardian_id === "number" && Number.isInteger(nextPayload.guardian_id));

  if (!hasExistingGuardianId && "profile_picture" in nextPayload) {
    nextPayload.profile_picture = await prepareProfilePictureValue(
      nextPayload.profile_picture,
      token,
    );
  }

  return mapStudentGuardianPayloadToBackend(nextPayload);
}

function mapBackendRoleToAppRole(role: BackendRoleResponseDto): AppRole {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? "",
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

function mapBackendModuleToAppModule(module: BackendModuleResponseDto): AppModule {
  return {
    id: module.id,
    name: module.name,
    slug: module.slug,
    icon: normalizeIconName(module.icon),
    sort_order: module.sortOrder,
    created_at: module.createdAt,
    updated_at: module.updatedAt,
  };
}

function mapBackendPermissionToAppPermission(permission: BackendPermissionResponseDto): AppPermission {
  return {
    id: permission.id,
    module_id: permission.moduleId,
    name: permission.name,
    slug: permission.slug,
    description: permission.description ?? "",
    created_at: permission.createdAt,
    updated_at: permission.updatedAt,
  };
}

function mapUserPayloadToBackend(payload: Record<string, unknown>, mode: "create" | "update") {
  const backendPayload: Record<string, unknown> = {};
  const firstName = toNullableString(payload.first_name);
  const middleName = toNullableString(payload.middle_name);
  const lastName = toNullableString(payload.last_name);
  const suffix = toNullableString(payload.suffix);
  const computedName = buildFullNameFromParts([firstName, middleName, lastName, suffix]);
  const providedName = toNullableString(payload.name);
  const name = computedName || providedName;
  const roles = splitRoleValues(payload.roles).map((value) => value.toLowerCase());
  const password = toNullableString(payload.password);

  if (mode === "create" || "name" in payload || name) {
    backendPayload.name = name;
  }

  if (mode === "create" || "first_name" in payload) {
    backendPayload.firstName = firstName;
  }

  if (mode === "create" || "middle_name" in payload) {
    backendPayload.middleName = middleName;
  }

  if (mode === "create" || "last_name" in payload) {
    backendPayload.lastName = lastName;
  }

  if (mode === "create" || "suffix" in payload) {
    backendPayload.suffix = suffix;
  }

  if (mode === "create" || "sex" in payload) {
    backendPayload.sex = toNullableString(payload.sex)?.toLowerCase() ?? null;
  }

  if (mode === "create" || "email" in payload) {
    backendPayload.email = toNullableString(payload.email)?.toLowerCase() ?? null;
  }

  if (mode === "create" || "contact_number" in payload) {
    backendPayload.contactNumber = toNullableString(payload.contact_number);
  }

  if (mode === "create" || "address" in payload) {
    backendPayload.address = toNullableString(payload.address);
  }

  if (mode === "create" || "barangay" in payload) {
    backendPayload.barangay = toNullableString(payload.barangay);
  }

  if (mode === "create" || "municipality_city" in payload) {
    backendPayload.municipalityCity = toNullableString(payload.municipality_city);
  }

  if (mode === "create" || "province" in payload) {
    backendPayload.province = toNullableString(payload.province);
  }

  if (mode === "create" || "region" in payload) {
    backendPayload.region = toNullableString(payload.region);
  }

  if (mode === "create" || "username" in payload) {
    backendPayload.username = toNullableString(payload.username)?.toLowerCase() ?? null;
  }

  if (password) {
    backendPayload.password = password;
  }

  if (mode === "create" || "roles" in payload) {
    backendPayload.roles = roles;
  }

  if (mode === "create" || "position" in payload) {
    backendPayload.position = toNullableString(payload.position);
  }

  if (mode === "create" || "status" in payload) {
    backendPayload.status = toNullableString(payload.status)?.toLowerCase() ?? null;
  }

  if (mode === "create" || "profile_picture" in payload) {
    backendPayload.profilePicture = toNullableString(payload.profile_picture);
  }

  return backendPayload;
}

function mapRolePayloadToBackend(payload: Record<string, unknown>) {
  return {
    name: toNullableString(payload.name)?.toLowerCase() ?? "",
    description: toNullableString(payload.description),
  };
}

function mapModulePayloadToBackend(payload: Record<string, unknown>, sortOrder: number) {
  return {
    name: toNullableString(payload.name) ?? "",
    slug: toNullableString(payload.slug)?.toLowerCase() ?? "",
    icon: normalizeIconName(toNullableString(payload.icon)),
    sortOrder,
  };
}

function mapPermissionPayloadToBackend(payload: Record<string, unknown>) {
  const rawModuleId = payload.module_id;
  const moduleId =
    typeof rawModuleId === "number"
      ? rawModuleId
      : typeof rawModuleId === "string" && rawModuleId.trim()
        ? Number(rawModuleId)
        : 0;

  return {
    moduleId,
    name: toNullableString(payload.name) ?? "",
    slug: toNullableString(payload.slug)?.toLowerCase() ?? "",
    description: toNullableString(payload.description),
  };
}

function mapStudentPayloadToBackend(payload: Record<string, unknown>, mode: "create" | "update") {
  const backendPayload: Record<string, unknown> = {};

  if (mode === "create" || "lrn" in payload) {
    backendPayload.lrn = toNullableString(payload.lrn);
  }

  if (mode === "create" || "first_name" in payload) {
    backendPayload.firstName = toNullableString(payload.first_name);
  }

  if (mode === "create" || "middle_name" in payload) {
    backendPayload.middleName = toNullableString(payload.middle_name);
  }

  if (mode === "create" || "last_name" in payload) {
    backendPayload.lastName = toNullableString(payload.last_name);
  }

  if (mode === "create" || "suffix" in payload) {
    backendPayload.suffix = toNullableString(payload.suffix);
  }

  if (mode === "create" || "sex" in payload) {
    backendPayload.sex = toNullableString(payload.sex)?.toLowerCase() ?? null;
  }

  if (mode === "create" || "birthdate" in payload) {
    backendPayload.birthdate = toNullableString(payload.birthdate);
  }

  if (mode === "create" || "birthplace" in payload) {
    backendPayload.birthplace = toNullableString(payload.birthplace);
  }

  if (mode === "create" || "street_address" in payload) {
    backendPayload.streetAddress = toNullableString(payload.street_address);
  }

  if (mode === "create" || "barangay" in payload) {
    backendPayload.barangay = toNullableString(payload.barangay);
  }

  if (mode === "create" || "city_municipality" in payload) {
    backendPayload.cityMunicipality = toNullableString(payload.city_municipality);
  }

  if (mode === "create" || "province" in payload) {
    backendPayload.province = toNullableString(payload.province);
  }

  if (mode === "create" || "region" in payload) {
    backendPayload.region = toNullableString(payload.region);
  }

  if (mode === "create" || "status" in payload) {
    backendPayload.status = toNullableString(payload.status)?.toLowerCase() ?? null;
  }

  if (mode === "create" || "profile_picture" in payload) {
    backendPayload.profilePicture = toNullableString(payload.profile_picture);
  }

  return backendPayload;
}

function mapGuardianPayloadToBackend(payload: Record<string, unknown>, mode: "create" | "update") {
  const backendPayload: Record<string, unknown> = {};

  if (mode === "create" || "first_name" in payload) {
    backendPayload.firstName = toNullableString(payload.first_name);
  }

  if (mode === "create" || "middle_name" in payload) {
    backendPayload.middleName = toNullableString(payload.middle_name);
  }

  if (mode === "create" || "last_name" in payload) {
    backendPayload.lastName = toNullableString(payload.last_name);
  }

  if (mode === "create" || "suffix" in payload) {
    backendPayload.suffix = toNullableString(payload.suffix);
  }

  if (mode === "create" || "contact_number" in payload) {
    backendPayload.contactNumber = toNullableString(payload.contact_number);
  }

  if (mode === "create" || "address" in payload) {
    backendPayload.address = toNullableString(payload.address);
  }

  if (mode === "create" || "barangay" in payload) {
    backendPayload.barangay = toNullableString(payload.barangay);
  }

  if (mode === "create" || "municipality_city" in payload) {
    backendPayload.municipalityCity = toNullableString(payload.municipality_city);
  }

  if (mode === "create" || "province" in payload) {
    backendPayload.province = toNullableString(payload.province);
  }

  if (mode === "create" || "region" in payload) {
    backendPayload.region = toNullableString(payload.region);
  }

  if (mode === "create" || "profile_picture" in payload) {
    backendPayload.profilePicture = toNullableString(payload.profile_picture);
  }

  return backendPayload;
}

function mapStudentGuardianPayloadToBackend(payload: Record<string, unknown>) {
  const rawGuardianId = payload.guardian_id;
  const guardianId =
    typeof rawGuardianId === "number"
      ? rawGuardianId
      : typeof rawGuardianId === "string" && rawGuardianId.trim()
        ? Number(rawGuardianId)
        : null;

  if (typeof guardianId === "number" && Number.isInteger(guardianId) && guardianId > 0) {
    return {
      guardianId,
      relationship: toNullableString(payload.relationship) ?? "",
      isPrimary:
        typeof payload.is_primary === "boolean"
          ? payload.is_primary
          : typeof payload.is_primary === "string"
            ? payload.is_primary.trim().toLowerCase() === "true"
            : Boolean(payload.is_primary),
    };
  }

  return {
    ...mapGuardianPayloadToBackend(payload, "create"),
    relationship: toNullableString(payload.relationship) ?? "",
    isPrimary:
      typeof payload.is_primary === "boolean"
        ? payload.is_primary
        : typeof payload.is_primary === "string"
          ? payload.is_primary.trim().toLowerCase() === "true"
          : Boolean(payload.is_primary),
  };
}

function mapStudentGuardianRelationPayloadToBackend(
  payload: Pick<StudentGuardianRelationFormValues, "relationship" | "is_primary">,
) {
  return {
    relationship: toNullableString(payload.relationship) ?? "",
    isPrimary: payload.is_primary.trim().toLowerCase() === "true",
  };
}

function mapSchoolSettingsPayloadToBackend(payload: Record<string, unknown>) {
  const backendPayload: Record<string, unknown> = {};

  if ("deped_school_id" in payload) {
    backendPayload.depedSchoolId = toNullableString(payload.deped_school_id);
  }

  if ("school_name" in payload) {
    backendPayload.schoolName = toNullableString(payload.school_name);
  }

  if ("district" in payload) {
    backendPayload.district = toNullableString(payload.district);
  }

  if ("division" in payload) {
    backendPayload.division = toNullableString(payload.division);
  }

  if ("region" in payload) {
    backendPayload.region = toNullableString(payload.region);
  }

  if ("address" in payload) {
    backendPayload.address = toNullableString(payload.address);
  }

  if ("school_logo" in payload) {
    backendPayload.schoolLogo = toNullableString(payload.school_logo);
  }

  if ("deped_logo" in payload) {
    backendPayload.depedLogo = toNullableString(payload.deped_logo);
  }

  if ("other_logo" in payload) {
    backendPayload.otherLogo = toNullableString(payload.other_logo);
  }

  return backendPayload;
}

export function toSessionUser(user: AdminUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    status: user.status,
    created_at: user.created_at,
  };
}

export function createAuthSession(token: string, user: AdminUser): AuthSessionCookie {
  return {
    token,
    user: toSessionUser(user),
  };
}

export function serializeAuthSessionCookie(session: AuthSessionCookie) {
  return JSON.stringify(session);
}

export function parseAuthSessionCookie(value: string | undefined): AuthSessionCookie | null {
  if (!value) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value) as Partial<AuthSessionCookie>;

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      typeof parsedValue.token !== "string" ||
      !parsedValue.user ||
      typeof parsedValue.user !== "object"
    ) {
      return null;
    }

    const user = parsedValue.user as Partial<SessionUser>;

    if (
      typeof user.id !== "number" ||
      typeof user.name !== "string" ||
      typeof user.email !== "string" ||
      !Array.isArray(user.roles) ||
      typeof user.status !== "string" ||
      typeof user.created_at !== "string"
    ) {
      return null;
    }

    return {
      token: parsedValue.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        status: user.status,
        created_at: user.created_at,
      },
    };
  } catch {
    return null;
  }
}

export function getClientAuthSession() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${AUTH_COOKIE_NAME}=`;
  const cookieValue = document.cookie
    .split("; ")
    .find((value) => value.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  return parseAuthSessionCookie(cookieValue ? decodeURIComponent(cookieValue) : undefined);
}

export function setClientAuthSession(session: AuthSessionCookie) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(serializeAuthSessionCookie(session))}`,
    "Path=/",
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    typeof window !== "undefined" && window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearClientAuthSession() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = [
    `${AUTH_COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    typeof window !== "undefined" && window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function resolveAuthToken(token?: string) {
  if (token?.trim()) {
    return token.trim();
  }

  return getClientAuthSession()?.token ?? null;
}

export async function requestApi<T>(
  path: string,
  { body, headers, method, token }: ApiRequestOptions = {},
) {
  try {
    const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;

    const response = await apiClient.request<BackendApiResponse<T>>({
      url: path,
      method: method ?? (body === undefined ? "GET" : "POST"),
      data: body,
      headers: {
        ...(body !== undefined && !isFormDataBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
    });

    const payload = response.data;

    if (!payload || typeof payload !== "object") {
      return null as T;
    }

    if (!payload.success) {
      throw new ApiError(
        response.status,
        payload.message ?? `API request failed with status ${response.status}.`,
        payload.errors,
      );
    }

    return payload.data as T;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function requestAuthenticatedApi<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const token = resolveAuthToken(options.token);

  if (!token) {
    throw new ApiError(401, "Unauthorized.");
  }

  return requestApi<T>(path, {
    ...options,
    token,
  });
}

export async function login(email: string, password: string) {
  const result = await requestApi<BackendAuthResponseDto>("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

  const user = mapBackendUserToAdminUser(result.user);
  setClientAuthSession(createAuthSession(result.token, user));

  return {
    token: result.token,
    user,
  };
}

export async function logout() {
  const session = getClientAuthSession();

  try {
    if (session?.token) {
      await requestApi("/auth/logout", {
        method: "POST",
        token: session.token,
      });
    }
  } finally {
    clearClientAuthSession();
  }
}

export async function fetchCurrentUserWithToken(token: string) {
  const user = await requestApi<BackendUserResponseDto>("/users/me", { token });
  return mapBackendUserToAdminUser(user);
}

export async function updateCurrentUserProfile(payload: Record<string, unknown>, token?: string) {
  const preparedPayload = await prepareUserPayload(payload, "update", token);

  const user = await requestAuthenticatedApi<BackendUserResponseDto>("/users/me", {
    method: "PUT",
    body: preparedPayload,
    token,
  });

  return mapBackendUserToAdminUser(user);
}

export async function changeCurrentUserPassword(
  payload: ChangePasswordPayload,
  token?: string,
) {
  await requestAuthenticatedApi("/users/me/password", {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function listUsers(token?: string) {
  const users = await requestAuthenticatedApi<BackendUserResponseDto[]>("/users", { token });
  return users.map(mapBackendUserToAdminUser);
}

export async function createUser(payload: Record<string, unknown>, token?: string) {
  const preparedPayload = await prepareUserPayload(payload, "create", token);

  const user = await requestAuthenticatedApi<BackendUserResponseDto>("/users", {
    method: "POST",
    body: preparedPayload,
    token,
  });

  return mapBackendUserToAdminUser(user);
}

export async function updateUser(userId: number, payload: Record<string, unknown>, token?: string) {
  const preparedPayload = await prepareUserPayload(payload, "update", token);

  const user = await requestAuthenticatedApi<BackendUserResponseDto>(`/users/${userId}`, {
    method: "PUT",
    body: preparedPayload,
    token,
  });

  return mapBackendUserToAdminUser(user);
}

export async function deleteUser(userId: number, token?: string) {
  await requestAuthenticatedApi(`/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

export async function listStudents(token?: string) {
  const students = await requestAuthenticatedApi<BackendStudentResponseDto[]>("/students", { token });
  return students.map(mapBackendStudentToStudentRecord);
}

export async function getStudent(studentId: number, token?: string) {
  const student = await requestAuthenticatedApi<BackendStudentResponseDto>(`/students/${studentId}`, {
    token,
  });

  return mapBackendStudentToStudentRecord(student);
}

export async function createStudent(payload: Record<string, unknown>, token?: string) {
  const student = await requestAuthenticatedApi<BackendStudentResponseDto>("/students", {
    method: "POST",
    body: await prepareStudentPayload(payload, "create", token),
    token,
  });

  return mapBackendStudentToStudentRecord(student);
}

export async function updateStudent(studentId: number, payload: Record<string, unknown>, token?: string) {
  const student = await requestAuthenticatedApi<BackendStudentResponseDto>(`/students/${studentId}`, {
    method: "PUT",
    body: await prepareStudentPayload(payload, "update", token),
    token,
  });

  return mapBackendStudentToStudentRecord(student);
}

export async function deleteStudent(studentId: number, token?: string) {
  await requestAuthenticatedApi(`/students/${studentId}`, {
    method: "DELETE",
    token,
  });
}

export async function listStudentInformationLookups(token?: string) {
  const lookups = await requestAuthenticatedApi<BackendStudentInformationLookupsResponseDto>("/students/lookups", {
    token,
  });

  return mapBackendStudentInformationLookups(lookups);
}

export async function getStudentInformation(studentId: number, token?: string) {
  const information = await requestAuthenticatedApi<BackendStudentInformationResponseDto>(
    `/students/${studentId}/information`,
    { token },
  );

  return mapBackendStudentInformation(information);
}

export async function updateStudentInformation(
  studentId: number,
  payload: Record<string, unknown>,
  token?: string,
) {
  const information = await requestAuthenticatedApi<BackendStudentInformationResponseDto>(
    `/students/${studentId}/information`,
    {
      method: "PUT",
      body: payload,
      token,
    },
  );

  return mapBackendStudentInformation(information);
}

export async function listStudentGuardians(studentId: number, token?: string) {
  const relations = await requestAuthenticatedApi<BackendStudentGuardianResponseDto[]>(
    `/students/${studentId}/guardians`,
    { token },
  );

  return relations.map(mapBackendStudentGuardianToStudentGuardianRecord);
}

export async function createStudentGuardian(
  studentId: number,
  payload: Record<string, unknown>,
  token?: string,
) {
  const relation = await requestAuthenticatedApi<BackendStudentGuardianResponseDto>(
    `/students/${studentId}/guardians`,
    {
      method: "POST",
      body: await prepareStudentGuardianPayload(payload, token),
      token,
    },
  );

  return mapBackendStudentGuardianToStudentGuardianRecord(relation);
}

export async function updateStudentGuardian(
  studentId: number,
  relationId: number,
  payload: Pick<StudentGuardianRelationFormValues, "relationship" | "is_primary">,
  token?: string,
) {
  const relation = await requestAuthenticatedApi<BackendStudentGuardianResponseDto>(
    `/students/${studentId}/guardians/${relationId}`,
    {
      method: "PUT",
      body: mapStudentGuardianRelationPayloadToBackend(payload),
      token,
    },
  );

  return mapBackendStudentGuardianToStudentGuardianRecord(relation);
}

export async function deleteStudentGuardian(
  studentId: number,
  relationId: number,
  token?: string,
) {
  await requestAuthenticatedApi(`/students/${studentId}/guardians/${relationId}`, {
    method: "DELETE",
    token,
  });
}

export async function listGuardians(token?: string) {
  const guardians = await requestAuthenticatedApi<BackendGuardianResponseDto[]>("/guardians", { token });
  return guardians.map(mapBackendGuardianToGuardianRecord);
}

export async function createGuardian(payload: Record<string, unknown>, token?: string) {
  const guardian = await requestAuthenticatedApi<BackendGuardianResponseDto>("/guardians", {
    method: "POST",
    body: await prepareGuardianPayload(payload, "create", token),
    token,
  });

  return mapBackendGuardianToGuardianRecord(guardian);
}

export async function updateGuardian(guardianId: number, payload: Record<string, unknown>, token?: string) {
  const guardian = await requestAuthenticatedApi<BackendGuardianResponseDto>(`/guardians/${guardianId}`, {
    method: "PUT",
    body: await prepareGuardianPayload(payload, "update", token),
    token,
  });

  return mapBackendGuardianToGuardianRecord(guardian);
}

export async function deleteGuardian(guardianId: number, token?: string) {
  await requestAuthenticatedApi(`/guardians/${guardianId}`, {
    method: "DELETE",
    token,
  });
}

export async function listRoles(token?: string) {
  const roles = await requestAuthenticatedApi<BackendRoleResponseDto[]>("/rbac/roles", { token });
  return roles.map(mapBackendRoleToAppRole);
}

export async function listPositions(token?: string) {
  return requestAuthenticatedApi<BackendPositionResponseDto[]>("/positions", { token });
}

export async function getSchoolSettings(token?: string) {
  const school = await requestAuthenticatedApi<BackendSchoolSettingsResponseDto>("/system/school", {
    token,
  });

  return mapBackendSchoolSettings(school);
}

export async function updateSchoolSettings(payload: Record<string, unknown>, token?: string) {
  const school = await requestAuthenticatedApi<BackendSchoolSettingsResponseDto>("/system/school", {
    method: "PUT",
    body: mapSchoolSettingsPayloadToBackend(payload),
    token,
  });

  return mapBackendSchoolSettings(school);
}

export async function createRole(payload: Record<string, unknown>, token?: string) {
  const role = await requestAuthenticatedApi<BackendRoleResponseDto>("/rbac/roles", {
    method: "POST",
    body: mapRolePayloadToBackend(payload),
    token,
  });

  return mapBackendRoleToAppRole(role);
}

export async function updateRole(roleId: number, payload: Record<string, unknown>, token?: string) {
  const role = await requestAuthenticatedApi<BackendRoleResponseDto>(`/rbac/roles/${roleId}`, {
    method: "PUT",
    body: mapRolePayloadToBackend(payload),
    token,
  });

  return mapBackendRoleToAppRole(role);
}

export async function deleteRole(roleId: number, token?: string) {
  await requestAuthenticatedApi(`/rbac/roles/${roleId}`, {
    method: "DELETE",
    token,
  });
}

export async function listModules(token?: string) {
  const modules = await requestAuthenticatedApi<BackendModuleResponseDto[]>("/rbac/modules", {
    token,
  });
  return modules.map(mapBackendModuleToAppModule);
}

export async function createModule(
  payload: Record<string, unknown>,
  sortOrder: number,
  token?: string,
) {
  const accessModule = await requestAuthenticatedApi<BackendModuleResponseDto>("/rbac/modules", {
    method: "POST",
    body: mapModulePayloadToBackend(payload, sortOrder),
    token,
  });

  return mapBackendModuleToAppModule(accessModule);
}

export async function updateModule(
  moduleId: number,
  payload: Record<string, unknown>,
  sortOrder: number,
  token?: string,
) {
  const accessModule = await requestAuthenticatedApi<BackendModuleResponseDto>(
    `/rbac/modules/${moduleId}`,
    {
      method: "PUT",
      body: mapModulePayloadToBackend(payload, sortOrder),
      token,
    },
  );

  return mapBackendModuleToAppModule(accessModule);
}

export async function deleteModule(moduleId: number, token?: string) {
  await requestAuthenticatedApi(`/rbac/modules/${moduleId}`, {
    method: "DELETE",
    token,
  });
}

export async function listPermissions(token?: string) {
  const permissions = await requestAuthenticatedApi<BackendPermissionResponseDto[]>(
    "/rbac/permissions",
    { token },
  );
  return permissions.map(mapBackendPermissionToAppPermission);
}

export async function getRolePermissions(roleId: number, token?: string) {
  const permissions = await requestAuthenticatedApi<BackendPermissionResponseDto[]>(
    `/rbac/roles/${roleId}/permissions`,
    { token },
  );
  return permissions.map(mapBackendPermissionToAppPermission);
}

export async function createPermission(payload: Record<string, unknown>, token?: string) {
  const permission = await requestAuthenticatedApi<BackendPermissionResponseDto>(
    "/rbac/permissions",
    {
      method: "POST",
      body: mapPermissionPayloadToBackend(payload),
      token,
    },
  );

  return mapBackendPermissionToAppPermission(permission);
}

export async function updatePermission(
  permissionId: number,
  payload: Record<string, unknown>,
  token?: string,
) {
  const permission = await requestAuthenticatedApi<BackendPermissionResponseDto>(
    `/rbac/permissions/${permissionId}`,
    {
      method: "PUT",
      body: mapPermissionPayloadToBackend(payload),
      token,
    },
  );

  return mapBackendPermissionToAppPermission(permission);
}

export async function deletePermission(permissionId: number, token?: string) {
  await requestAuthenticatedApi(`/rbac/permissions/${permissionId}`, {
    method: "DELETE",
    token,
  });
}

export async function replaceRolePermissions(
  roleId: number,
  permissionIds: number[],
  token?: string,
) {
  const permissions = await requestAuthenticatedApi<BackendPermissionResponseDto[]>(
    `/rbac/roles/${roleId}/permissions`,
    {
      method: "PUT",
      body: {
        permissionIds,
      },
      token,
    },
  );

  return permissions.map(mapBackendPermissionToAppPermission);
}
