import axios from "axios";
import type { AppModule, AppPermission, AppRole } from "@/app/types/accessControlTypes";
import type { SessionUser } from "@/app/types/authTypes";
import type {
  BackendApiResponse,
  BackendAuthResponseDto,
  BackendModuleResponseDto,
  BackendPermissionResponseDto,
  BackendPupilResponseDto,
  BackendPositionResponseDto,
  BackendRoleResponseDto,
  BackendUserResponseDto,
} from "@/app/types/backendTypes";
import type { AppIconName } from "@/app/types/iconTypes";
import type { PupilRecord, PupilSex, PupilStatus } from "@/app/types/pupilTypes";
import type { AdminUser, ChangePasswordPayload, UserSex, UserStatus } from "@/app/types/userTypes";

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

function normalizePupilStatus(value: string | null): PupilStatus {
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

function normalizePupilSex(value: string | null): PupilSex {
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

function mapBackendPupilToPupilRecord(pupil: BackendPupilResponseDto): PupilRecord {
  const firstName = pupil.firstName.trim();
  const middleName = pupil.middleName?.trim() ?? "";
  const lastName = pupil.lastName.trim();
  const suffix = pupil.suffix?.trim() ?? "";

  return {
    id: pupil.id,
    lrn: pupil.lrn,
    full_name: buildFullNameFromParts([firstName, middleName, lastName, suffix]) || pupil.lrn,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    suffix,
    sex: normalizePupilSex(pupil.sex),
    birthdate: pupil.birthdate,
    birthplace: pupil.birthplace?.trim() ?? "",
    street_address: pupil.streetAddress?.trim() ?? "",
    barangay: pupil.barangay.trim(),
    city_municipality: pupil.cityMunicipality.trim(),
    province: pupil.province.trim(),
    region: pupil.region.trim(),
    status: normalizePupilStatus(pupil.status),
    created_at: pupil.createdAt,
    updated_at: pupil.updatedAt,
    deleted_at: pupil.deletedAt,
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

async function prepareUserProfilePictureValue(value: unknown, token?: string) {
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
    nextPayload.profile_picture = await prepareUserProfilePictureValue(
      nextPayload.profile_picture,
      token,
    );
  }

  return mapUserPayloadToBackend(nextPayload, mode);
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

function mapPupilPayloadToBackend(payload: Record<string, unknown>, mode: "create" | "update") {
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

export async function listPupils(token?: string) {
  const pupils = await requestAuthenticatedApi<BackendPupilResponseDto[]>("/pupils", { token });
  return pupils.map(mapBackendPupilToPupilRecord);
}

export async function createPupil(payload: Record<string, unknown>, token?: string) {
  const pupil = await requestAuthenticatedApi<BackendPupilResponseDto>("/pupils", {
    method: "POST",
    body: mapPupilPayloadToBackend(payload, "create"),
    token,
  });

  return mapBackendPupilToPupilRecord(pupil);
}

export async function updatePupil(pupilId: number, payload: Record<string, unknown>, token?: string) {
  const pupil = await requestAuthenticatedApi<BackendPupilResponseDto>(`/pupils/${pupilId}`, {
    method: "PUT",
    body: mapPupilPayloadToBackend(payload, "update"),
    token,
  });

  return mapBackendPupilToPupilRecord(pupil);
}

export async function deletePupil(pupilId: number, token?: string) {
  await requestAuthenticatedApi(`/pupils/${pupilId}`, {
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
