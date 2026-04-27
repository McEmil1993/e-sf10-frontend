import { formatDate } from "@/app/lib/display";
import type {
  PaginatedPupilsResponse,
  PupilRecord,
  PupilTableRow,
  PupilsQueryOptions,
  PupilsSortField,
  PupilsSortOrder,
} from "@/app/types/pupilTypes";

const defaultQueryOptions: Required<Omit<PupilsQueryOptions, "basePath">> = {
  page: 1,
  perPage: 10,
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function buildPupilFullName(
  pupil: Pick<PupilRecord, "first_name" | "middle_name" | "last_name" | "suffix">,
) {
  return [pupil.first_name, pupil.middle_name, pupil.last_name, pupil.suffix]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function normalizePupilRecord(pupil: PupilRecord): PupilRecord {
  const fullName = buildPupilFullName(pupil);

  return {
    ...pupil,
    full_name: fullName || pupil.full_name,
  };
}

export function toPupilTableRow(pupil: PupilRecord): PupilTableRow {
  return {
    id: pupil.id,
    full_name: pupil.full_name,
    lrn: pupil.lrn,
    sex: pupil.sex,
    birthdate: formatDate(pupil.birthdate),
    location: [pupil.barangay, pupil.city_municipality, pupil.province].filter(Boolean).join(", "),
    status: pupil.status,
    created_at: formatDate(pupil.created_at),
    updated_at: formatDate(pupil.updated_at),
  };
}

export function createPupilsResponse(
  pupils: PupilRecord[],
  options: PupilsQueryOptions = {},
): PaginatedPupilsResponse<PupilRecord> {
  const page = getPositiveNumber(options.page, defaultQueryOptions.page);
  const perPage = getPositiveNumber(options.perPage, defaultQueryOptions.perPage);
  const search = (options.search ?? defaultQueryOptions.search).trim();
  const sortBy = options.sortBy ?? defaultQueryOptions.sortBy;
  const sortOrder = options.sortOrder ?? defaultQueryOptions.sortOrder;
  const basePath = options.basePath ?? "/pupils/information";

  const filteredPupils = pupils.filter((pupil) => matchesSearch(pupil, search));
  const sortedPupils = filteredPupils.slice().sort((firstPupil, secondPupil) =>
    comparePupils(firstPupil, secondPupil, sortBy, sortOrder),
  );
  const total = sortedPupils.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const data = sortedPupils.slice(startIndex, startIndex + perPage);

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
      first: buildPupilsLink(basePath, 1, perPage, search, sortBy, sortOrder),
      last: buildPupilsLink(basePath, totalPages, perPage, search, sortBy, sortOrder),
      prev:
        safePage > 1
          ? buildPupilsLink(basePath, safePage - 1, perPage, search, sortBy, sortOrder)
          : null,
      next:
        safePage < totalPages
          ? buildPupilsLink(basePath, safePage + 1, perPage, search, sortBy, sortOrder)
          : null,
    },
  };
}

function matchesSearch(pupil: PupilRecord, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const searchableValue = [
    pupil.id,
    pupil.lrn,
    pupil.full_name,
    pupil.first_name,
    pupil.middle_name,
    pupil.last_name,
    pupil.suffix,
    pupil.sex,
    pupil.birthdate,
    pupil.birthplace,
    pupil.street_address,
    pupil.barangay,
    pupil.city_municipality,
    pupil.province,
    pupil.region,
    pupil.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function comparePupils(
  firstPupil: PupilRecord,
  secondPupil: PupilRecord,
  sortBy: PupilsSortField,
  sortOrder: PupilsSortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const firstValue = getSortableValue(firstPupil, sortBy);
  const secondValue = getSortableValue(secondPupil, sortBy);

  if (firstValue < secondValue) {
    return -1 * direction;
  }

  if (firstValue > secondValue) {
    return 1 * direction;
  }

  return 0;
}

function getSortableValue(pupil: PupilRecord, sortBy: PupilsSortField) {
  if (sortBy === "created_at") {
    return new Date(pupil.created_at).getTime();
  }

  if (sortBy === "birthdate") {
    return new Date(pupil.birthdate).getTime();
  }

  return String(pupil[sortBy] ?? "").toLowerCase();
}

function getPositiveNumber(value: number | string | null | undefined, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function buildPupilsLink(
  basePath: string,
  page: number,
  perPage: number,
  search: string,
  sortBy: PupilsSortField,
  sortOrder: PupilsSortOrder,
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
