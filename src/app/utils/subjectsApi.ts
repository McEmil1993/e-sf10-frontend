import { formatDate } from "@/app/lib/display";
import type {
  PaginatedSubjectsResponse,
  SubjectRecord,
  SubjectTableRow,
  SubjectsQueryOptions,
  SubjectsSortField,
  SubjectsSortOrder,
} from "@/app/types/subjectTypes";

const defaultQueryOptions: Required<Omit<SubjectsQueryOptions, "basePath">> = {
  page: 1,
  perPage: 10,
  search: "",
  sortBy: "sort_order",
  sortOrder: "asc",
};

export function formatSubjectGradeLevels(gradeLevels: number[]) {
  if (gradeLevels.length === 0) {
    return "-";
  }

  return gradeLevels
    .slice()
    .sort((firstValue, secondValue) => firstValue - secondValue)
    .map((gradeLevel) => `Grade ${gradeLevel}`)
    .join(", ");
}

export function toSubjectTableRow(subject: SubjectRecord): SubjectTableRow {
  return {
    id: subject.id,
    name: subject.name,
    subject_group: subject.subject_group || "-",
    grade_levels: formatSubjectGradeLevels(subject.grade_levels),
    is_optional: subject.is_optional ? "Optional" : "Required",
    is_active: subject.is_active ? "Active" : "Inactive",
    sort_order: subject.sort_order,
    updated_at: formatDate(subject.updated_at),
  };
}

export function createSubjectsResponse(
  subjects: SubjectRecord[],
  options: SubjectsQueryOptions = {},
): PaginatedSubjectsResponse<SubjectRecord> {
  const page = getPositiveNumber(options.page, defaultQueryOptions.page);
  const perPage = getPositiveNumber(options.perPage, defaultQueryOptions.perPage);
  const search = (options.search ?? defaultQueryOptions.search).trim();
  const sortBy = options.sortBy ?? defaultQueryOptions.sortBy;
  const sortOrder = options.sortOrder ?? defaultQueryOptions.sortOrder;
  const basePath = options.basePath ?? "/subjects";

  const filteredSubjects = subjects.filter((subject) => matchesSearch(subject, search));
  const sortedSubjects = filteredSubjects.slice().sort((firstSubject, secondSubject) =>
    compareSubjects(firstSubject, secondSubject, sortBy, sortOrder),
  );
  const total = sortedSubjects.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const data = sortedSubjects.slice(startIndex, startIndex + perPage);

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
      first: buildSubjectsLink(basePath, 1, perPage, search, sortBy, sortOrder),
      last: buildSubjectsLink(basePath, totalPages, perPage, search, sortBy, sortOrder),
      prev:
        safePage > 1
          ? buildSubjectsLink(basePath, safePage - 1, perPage, search, sortBy, sortOrder)
          : null,
      next:
        safePage < totalPages
          ? buildSubjectsLink(basePath, safePage + 1, perPage, search, sortBy, sortOrder)
          : null,
    },
  };
}

function matchesSearch(subject: SubjectRecord, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const searchableValue = [
    subject.id,
    subject.name,
    subject.subject_group,
    formatSubjectGradeLevels(subject.grade_levels),
    subject.is_optional ? "optional" : "required",
    subject.is_active ? "active" : "inactive",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function compareSubjects(
  firstSubject: SubjectRecord,
  secondSubject: SubjectRecord,
  sortBy: SubjectsSortField,
  sortOrder: SubjectsSortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const firstValue = getSortableValue(firstSubject, sortBy);
  const secondValue = getSortableValue(secondSubject, sortBy);

  if (firstValue < secondValue) {
    return -1 * direction;
  }

  if (firstValue > secondValue) {
    return 1 * direction;
  }

  return 0;
}

function getSortableValue(subject: SubjectRecord, sortBy: SubjectsSortField) {
  if (sortBy === "sort_order") {
    return subject.sort_order;
  }

  if (sortBy === "updated_at") {
    return new Date(subject.updated_at).getTime();
  }

  return String(subject[sortBy] ?? "").toLowerCase();
}

function getPositiveNumber(value: number | string | null | undefined, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function buildSubjectsLink(
  basePath: string,
  page: number,
  perPage: number,
  search: string,
  sortBy: SubjectsSortField,
  sortOrder: SubjectsSortOrder,
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
