import { formatDate } from "@/app/lib/display";
import type {
  GuardianRecord,
  GuardianTableRow,
  GuardiansQueryOptions,
  GuardiansSortField,
  GuardiansSortOrder,
  PaginatedGuardiansResponse,
} from "@/app/types/guardianTypes";
import { resolveBackendAssetUrl } from "@/app/utils/api";

const defaultQueryOptions: Required<Omit<GuardiansQueryOptions, "basePath">> = {
  page: 1,
  perPage: 10,
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function buildGuardianFullName(
  guardian: Pick<GuardianRecord, "first_name" | "middle_name" | "last_name" | "suffix">,
) {
  return [guardian.first_name, guardian.middle_name, guardian.last_name, guardian.suffix]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function normalizeGuardianRecord(guardian: GuardianRecord): GuardianRecord {
  const fullName = buildGuardianFullName(guardian);

  return {
    ...guardian,
    full_name: fullName || guardian.full_name,
    avatar: guardian.avatar ?? resolveBackendAssetUrl(guardian.profile_picture) ?? "",
  };
}

export function toGuardianTableRow(guardian: GuardianRecord): GuardianTableRow {
  return {
    id: guardian.id,
    name: guardian.full_name,
    avatar: guardian.avatar ?? resolveBackendAssetUrl(guardian.profile_picture) ?? "",
    contact_number: guardian.contact_number,
    location: [guardian.barangay, guardian.municipality_city, guardian.province].filter(Boolean).join(", "),
    address: guardian.address,
    created_at: formatDate(guardian.created_at),
    updated_at: formatDate(guardian.updated_at),
  };
}

export function createGuardiansResponse(
  guardians: GuardianRecord[],
  options: GuardiansQueryOptions = {},
): PaginatedGuardiansResponse<GuardianRecord> {
  const page = getPositiveNumber(options.page, defaultQueryOptions.page);
  const perPage = getPositiveNumber(options.perPage, defaultQueryOptions.perPage);
  const search = (options.search ?? defaultQueryOptions.search).trim();
  const sortBy = options.sortBy ?? defaultQueryOptions.sortBy;
  const sortOrder = options.sortOrder ?? defaultQueryOptions.sortOrder;
  const basePath = options.basePath ?? "/guardians";

  const filteredGuardians = guardians.filter((guardian) => matchesSearch(guardian, search));
  const sortedGuardians = filteredGuardians.slice().sort((firstGuardian, secondGuardian) =>
    compareGuardians(firstGuardian, secondGuardian, sortBy, sortOrder),
  );
  const total = sortedGuardians.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const data = sortedGuardians.slice(startIndex, startIndex + perPage);

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
      first: buildGuardiansLink(basePath, 1, perPage, search, sortBy, sortOrder),
      last: buildGuardiansLink(basePath, totalPages, perPage, search, sortBy, sortOrder),
      prev:
        safePage > 1
          ? buildGuardiansLink(basePath, safePage - 1, perPage, search, sortBy, sortOrder)
          : null,
      next:
        safePage < totalPages
          ? buildGuardiansLink(basePath, safePage + 1, perPage, search, sortBy, sortOrder)
          : null,
    },
  };
}

function matchesSearch(guardian: GuardianRecord, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const searchableValue = [
    guardian.id,
    guardian.full_name,
    guardian.first_name,
    guardian.middle_name,
    guardian.last_name,
    guardian.suffix,
    guardian.contact_number,
    guardian.address,
    guardian.barangay,
    guardian.municipality_city,
    guardian.province,
    guardian.region,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function compareGuardians(
  firstGuardian: GuardianRecord,
  secondGuardian: GuardianRecord,
  sortBy: GuardiansSortField,
  sortOrder: GuardiansSortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const firstValue = getSortableValue(firstGuardian, sortBy);
  const secondValue = getSortableValue(secondGuardian, sortBy);

  if (firstValue < secondValue) {
    return -1 * direction;
  }

  if (firstValue > secondValue) {
    return 1 * direction;
  }

  return 0;
}

function getSortableValue(guardian: GuardianRecord, sortBy: GuardiansSortField) {
  if (sortBy === "created_at") {
    return new Date(guardian.created_at).getTime();
  }

  if (sortBy === "contact_number") {
    return guardian.contact_number.toLowerCase();
  }

  if (sortBy === "location") {
    return [guardian.barangay, guardian.municipality_city, guardian.province].join(" ").toLowerCase();
  }

  return guardian.full_name.toLowerCase();
}

function getPositiveNumber(value: number | string | null | undefined, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function buildGuardiansLink(
  basePath: string,
  page: number,
  perPage: number,
  search: string,
  sortBy: GuardiansSortField,
  sortOrder: GuardiansSortOrder,
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
