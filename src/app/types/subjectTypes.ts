export type SubjectRecord = {
  id: number;
  name: string;
  subject_group: string;
  grade_levels: number[];
  is_optional: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type SubjectTableRow = {
  id: number;
  name: string;
  subject_group: string;
  grade_levels: string;
  is_optional: string;
  is_active: string;
  sort_order: number;
  updated_at: string;
};

export type SubjectFormValues = {
  name: string;
  subject_group: string;
  grade_levels: string;
  is_optional: string;
  is_active: string;
  sort_order: string;
};

export type SubjectsSortField =
  | "name"
  | "subject_group"
  | "sort_order"
  | "updated_at";

export type SubjectsSortOrder = "asc" | "desc";

export type SubjectsResponseMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type SubjectsResponseFilters = {
  search: string;
  sort_by: SubjectsSortField;
  sort_order: SubjectsSortOrder;
};

export type SubjectsResponseLinks = {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
};

export type PaginatedSubjectsResponse<T> = {
  success: true;
  message: string;
  data: T[];
  meta: SubjectsResponseMeta;
  filters: SubjectsResponseFilters;
  links: SubjectsResponseLinks;
};

export type SubjectsQueryOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: SubjectsSortField;
  sortOrder?: SubjectsSortOrder;
  basePath?: string;
};
