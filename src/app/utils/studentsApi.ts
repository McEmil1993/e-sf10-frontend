import { formatDate } from "@/app/lib/display";
import type {
  PaginatedStudentsResponse,
  StudentRecord,
  StudentTableRow,
  StudentsQueryOptions,
  StudentsSortField,
  StudentsSortOrder,
} from "@/app/types/studentTypes";

const defaultQueryOptions: Required<Omit<StudentsQueryOptions, "basePath">> = {
  page: 1,
  perPage: 10,
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

export function buildStudentFullName(
  student: Pick<StudentRecord, "first_name" | "middle_name" | "last_name" | "suffix">,
) {
  return [student.first_name, student.middle_name, student.last_name, student.suffix]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function normalizeStudentRecord(student: StudentRecord): StudentRecord {
  const fullName = buildStudentFullName(student);

  return {
    ...student,
    full_name: fullName || student.full_name,
  };
}

export function toStudentTableRow(student: StudentRecord): StudentTableRow {
  return {
    id: student.id,
    full_name: student.full_name,
    lrn: student.lrn,
    avatar: student.avatar ?? "",
    sex: student.sex,
    birthdate: formatDate(student.birthdate),
    location: [student.barangay, student.city_municipality, student.province].filter(Boolean).join(", "),
    status: student.status,
    created_at: formatDate(student.created_at),
    updated_at: formatDate(student.updated_at),
  };
}

export function createStudentsResponse(
  students: StudentRecord[],
  options: StudentsQueryOptions = {},
): PaginatedStudentsResponse<StudentRecord> {
  const page = getPositiveNumber(options.page, defaultQueryOptions.page);
  const perPage = getPositiveNumber(options.perPage, defaultQueryOptions.perPage);
  const search = (options.search ?? defaultQueryOptions.search).trim();
  const sortBy = options.sortBy ?? defaultQueryOptions.sortBy;
  const sortOrder = options.sortOrder ?? defaultQueryOptions.sortOrder;
  const basePath = options.basePath ?? "/students/information";

  const filteredStudents = students.filter((student) => matchesSearch(student, search));
  const sortedStudents = filteredStudents.slice().sort((firstStudent, secondStudent) =>
    compareStudents(firstStudent, secondStudent, sortBy, sortOrder),
  );
  const total = sortedStudents.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const data = sortedStudents.slice(startIndex, startIndex + perPage);

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
      first: buildStudentsLink(basePath, 1, perPage, search, sortBy, sortOrder),
      last: buildStudentsLink(basePath, totalPages, perPage, search, sortBy, sortOrder),
      prev:
        safePage > 1
          ? buildStudentsLink(basePath, safePage - 1, perPage, search, sortBy, sortOrder)
          : null,
      next:
        safePage < totalPages
          ? buildStudentsLink(basePath, safePage + 1, perPage, search, sortBy, sortOrder)
          : null,
    },
  };
}

function matchesSearch(student: StudentRecord, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const searchableValue = [
    student.id,
    student.lrn,
    student.full_name,
    student.first_name,
    student.middle_name,
    student.last_name,
    student.suffix,
    student.sex,
    student.birthdate,
    student.birthplace,
    student.street_address,
    student.barangay,
    student.city_municipality,
    student.province,
    student.region,
    student.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableValue.includes(normalizedSearch);
}

function compareStudents(
  firstStudent: StudentRecord,
  secondStudent: StudentRecord,
  sortBy: StudentsSortField,
  sortOrder: StudentsSortOrder,
) {
  const direction = sortOrder === "asc" ? 1 : -1;
  const firstValue = getSortableValue(firstStudent, sortBy);
  const secondValue = getSortableValue(secondStudent, sortBy);

  if (firstValue < secondValue) {
    return -1 * direction;
  }

  if (firstValue > secondValue) {
    return 1 * direction;
  }

  return 0;
}

function getSortableValue(student: StudentRecord, sortBy: StudentsSortField) {
  if (sortBy === "created_at") {
    return new Date(student.created_at).getTime();
  }

  if (sortBy === "birthdate") {
    return new Date(student.birthdate).getTime();
  }

  return String(student[sortBy] ?? "").toLowerCase();
}

function getPositiveNumber(value: number | string | null | undefined, fallback: number) {
  const parsedValue =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

function buildStudentsLink(
  basePath: string,
  page: number,
  perPage: number,
  search: string,
  sortBy: StudentsSortField,
  sortOrder: StudentsSortOrder,
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
