export type StudentSex = "male" | "female";
export type StudentStatus = "active" | "inactive" | "transferred" | "graduated";

export type StudentRecord = {
  id: number;
  lrn: string;
  full_name: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  sex: StudentSex;
  birthdate: string;
  birthplace?: string;
  street_address?: string;
  barangay: string;
  city_municipality: string;
  province: string;
  region: string;
  status: StudentStatus;
  avatar?: string;
  profile_picture?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type StudentInformationLookup = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type StudentInformationLookups = {
  mother_tongues: StudentInformationLookup[];
  indigenous_groups: StudentInformationLookup[];
  religions: StudentInformationLookup[];
};

export type StudentInformation = {
  student_id: number;
  mother_tongue: StudentInformationLookup | null;
  indigenous_group: StudentInformationLookup | null;
  religion: StudentInformationLookup | null;
};

export type StudentTableRow = {
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

export type StudentsSortField =
  | "created_at"
  | "full_name"
  | "lrn"
  | "sex"
  | "birthdate"
  | "status";

export type StudentsSortOrder = "asc" | "desc";

export type StudentsResponseMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type StudentsResponseFilters = {
  search: string;
  sort_by: StudentsSortField;
  sort_order: StudentsSortOrder;
};

export type StudentsResponseLinks = {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
};

export type PaginatedStudentsResponse<T> = {
  success: true;
  message: string;
  data: T[];
  meta: StudentsResponseMeta;
  filters: StudentsResponseFilters;
  links: StudentsResponseLinks;
};

export type StudentsQueryOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: StudentsSortField;
  sortOrder?: StudentsSortOrder;
  basePath?: string;
};

export type StudentFormValues = {
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
  mother_tongue: string;
  indigenous_group: string;
  indigenous_group_other: string;
  religion: string;
};
