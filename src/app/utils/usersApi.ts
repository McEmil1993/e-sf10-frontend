import type {
  AdminUser,
  PaginatedUsersResponse,
  UserTableRow,
  UsersQueryOptions,
  UsersSortField,
  UsersSortOrder,
} from "@/app/types/userTypes";
import { formatDate } from "@/app/lib/display";
import { resolveBackendAssetUrl } from "@/app/utils/api";

const markdownEmailPattern = /^\[[^[\]]+\]\(mailto:([^)]+)\)$/i;

const defaultQueryOptions: Required<Omit<UsersQueryOptions, "basePath">> = {
  page: 1,
  perPage: 10,
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function normalizeEmail(value: string) {
  const trimmedValue = value.trim().toLowerCase();
  const markdownMatch = trimmedValue.match(markdownEmailPattern);

  if (markdownMatch) {
    return markdownMatch[1].trim().toLowerCase();
  }

  return trimmedValue.replace(/^mailto:/i, "");
}

export function normalizeUserRecord(user: AdminUser): AdminUser {
  return {
    ...user,
    email: normalizeEmail(user.email),
    avatar: user.avatar ?? resolveBackendAssetUrl(user.profile_picture) ?? "",
    roles: user.roles,
  };
}

export function toUserTableRow(user: AdminUser): UserTableRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? resolveBackendAssetUrl(user.profile_picture) ?? "",
    role: user.roles[0] ?? "user",
    position: user.position ?? "-",
    status: user.status,
    username: user.username ?? "",
    contact_number: user.contact_number ?? "",
    created_at: formatDate(user.created_at),
    updated_at: formatDate(user.updated_at),
  };
}

export function createUsersResponse(
  users: AdminUser[],
  options: UsersQueryOptions = {},
): PaginatedUsersResponse<AdminUser> {
  const page = getPositiveNumber(options.page, defaultQueryOptions.page);
  const perPage = getPositiveNumber(options.perPage, defaultQueryOptions.perPage);
  const search = (options.search ?? defaultQueryOptions.search).trim();
  const sortBy = options.sortBy ?? defaultQueryOptions.sortBy;
  const sortOrder = options.sortOrder ?? defaultQueryOptions.sortOrder;
  const basePath = options.basePath ?? "/users";

  const filteredUsers = users.filter((user) => matchesSearch(user, search));
  const sortedUsers = filteredUsers.slice().sort((firstUser, secondUser) =>
    compareUsers(firstUser, secondUser, sortBy, sortOrder),
  );
  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const data = sortedUsers.slice(startIndex, startIndex + perPage);

  return {
    success: true,
    message: "Data fetched successfully",
    data,
    meta: {
      page: safePage,
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
    filters: {
      search,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    links: {
      first: buildUsersLink(basePath, 1, perPage, search, sortBy, sortOrder),
      last: buildUsersLink(basePath, totalPages, perPage, search, sortBy, sortOrder),
      prev:
        safePage > 1
          ? buildUsersLink(basePath, safePage - 1, perPage, search, sortBy, sortOrder)
          : null,
      next:
        safePage < totalPages
          ? buildUsersLink(basePath, safePage + 1, perPage, search, sortBy, sortOrder)
          : null,
    },
  };
}

export function parseUsersQueryOptions(searchParams: URLSearchParams): UsersQueryOptions {
  return {
    page: getPositiveNumber(searchParams.get("page"), defaultQueryOptions.page),
    perPage: getPositiveNumber(searchParams.get("per_page"), defaultQueryOptions.perPage),
    search: searchParams.get("search") ?? defaultQueryOptions.search,
    sortBy: getSortField(searchParams.get("sort_by")),
    sortOrder: getSortOrder(searchParams.get("sort_order")),
  };
}

function matchesSearch(user: AdminUser, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const searchableValue = [
    user.id,
    user.name,
    normalizeEmail(user.email),
    user.username,
    user.contact_number,
    user.position,
    user.status,
    user.roles.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function compareUsers(
  firstUser: AdminUser,
  secondUser: AdminUser,
  sortBy: UsersSortField,
  sortOrder: UsersSortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const firstValue = getSortableValue(firstUser, sortBy);
  const secondValue = getSortableValue(secondUser, sortBy);

  if (firstValue < secondValue) {
    return -1 * direction;
  }

  if (firstValue > secondValue) {
    return 1 * direction;
  }

  return 0;
}

function getSortableValue(user: AdminUser, sortBy: UsersSortField) {
  if (sortBy === "created_at") {
    return new Date(user.created_at).getTime();
  }

  if (sortBy === "email") {
    return normalizeEmail(user.email);
  }

  if (sortBy === "role") {
    return (user.roles[0] ?? "user").toLowerCase();
  }

  return String(user[sortBy] ?? "").toLowerCase();
}

function getPositiveNumber(value: number | string | null | undefined, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function getSortField(value: string | null): UsersSortField {
  if (
    value === "created_at" ||
    value === "name" ||
    value === "email" ||
    value === "username" ||
    value === "status" ||
    value === "role"
  ) {
    return value;
  }

  return defaultQueryOptions.sortBy;
}

function getSortOrder(value: string | null): UsersSortOrder {
  return value === "asc" ? "asc" : defaultQueryOptions.sortOrder;
}

function buildUsersLink(
  basePath: string,
  page: number,
  perPage: number,
  search: string,
  sortBy: UsersSortField,
  sortOrder: UsersSortOrder,
) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort_by: sortBy,
    sort_order: sortOrder,
  });

  if (search) {
    params.set("search", search);
  }

  return `${basePath}?${params.toString()}`;
}
