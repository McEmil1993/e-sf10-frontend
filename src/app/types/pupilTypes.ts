export type PupilSex = "male" | "female";
export type PupilStatus = "active" | "inactive" | "transferred" | "graduated";

export type PupilRecord = {
  id: number;
  lrn: string;
  full_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  sex: PupilSex;
  birthdate: string;
  birthplace?: string;
  street_address?: string;
  barangay: string;
  city_municipality: string;
  province: string;
  region: string;
  status: PupilStatus;
  avatar?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PupilTableRow = {
  id: number;
  full_name: string;
  lrn: string;
  avatar?: string;
  sex: string;
  birthdate: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PupilsSortField =
  | "created_at"
  | "full_name"
  | "lrn"
  | "sex"
  | "birthdate"
  | "status";

export type PupilsSortOrder = "asc" | "desc";

export type PupilsResponseMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PupilsResponseFilters = {
  search: string;
  sort_by: PupilsSortField;
  sort_order: PupilsSortOrder;
};

export type PupilsResponseLinks = {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
};

export type PaginatedPupilsResponse<T> = {
  success: true;
  message: string;
  data: T[];
  meta: PupilsResponseMeta;
  filters: PupilsResponseFilters;
  links: PupilsResponseLinks;
};

export type PupilsQueryOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: PupilsSortField;
  sortOrder?: PupilsSortOrder;
  basePath?: string;
};

export type PupilFormValues = {
  profile_picture: string;
  lrn: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  birthdate: string;
  birthplace: string;
  street_address: string;
  barangay: string;
  city_municipality: string;
  province: string;
  region: string;
  status: string;
};
