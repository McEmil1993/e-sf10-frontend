export type GuardianRecord = {
  id: number;
  full_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  contact_number: string;
  address: string;
  barangay: string;
  municipality_city: string;
  province: string;
  region: string;
  avatar?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type GuardianTableRow = {
  id: number;
  name: string;
  avatar?: string;
  contact_number: string;
  location: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type GuardiansSortField =
  | "created_at"
  | "name"
  | "contact_number"
  | "location";

export type GuardiansSortOrder = "asc" | "desc";

export type GuardiansResponseMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type GuardiansResponseFilters = {
  search: string;
  sort_by: GuardiansSortField;
  sort_order: GuardiansSortOrder;
};

export type GuardiansResponseLinks = {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
};

export type PaginatedGuardiansResponse<T> = {
  success: true;
  message: string;
  data: T[];
  meta: GuardiansResponseMeta;
  filters: GuardiansResponseFilters;
  links: GuardiansResponseLinks;
};

export type GuardiansQueryOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: GuardiansSortField;
  sortOrder?: GuardiansSortOrder;
  basePath?: string;
};

export type GuardianFormValues = {
  profile_picture: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  contact_number: string;
  address: string;
  barangay: string;
  municipality_city: string;
  province: string;
  region: string;
};
