export type UserRole = string;
export type UserStatus = "active" | "inactive";
export type UserSex = "male" | "female";

export type AdminUser = {
  id: number;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string;
  sex?: UserSex;
  email: string;
  contact_number?: string;
  address?: string;
  barangay?: string;
  municipality_city?: string;
  province?: string;
  region?: string;
  username?: string;
  password?: string;
  avatar?: string;
  profile_picture?: string;
  roles: UserRole[];
  position?: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export type UserTableRow = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  roles: string[];
  position?: string;
  status: string;
  username?: string;
  contact_number?: string;
  created_at: string;
  updated_at?: string;
};

export type UsersSortField =
  | "created_at"
  | "name"
  | "email"
  | "username"
  | "status"
  | "role";

export type UsersSortOrder = "asc" | "desc";

export type UsersResponseMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type UsersResponseFilters = {
  search: string;
  sort_by: UsersSortField;
  sort_order: UsersSortOrder;
};

export type UsersResponseLinks = {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
};

export type PaginatedUsersResponse<T> = {
  success: true;
  message: string;
  data: T[];
  meta: UsersResponseMeta;
  filters: UsersResponseFilters;
  links: UsersResponseLinks;
};

export type UsersQueryOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: UsersSortField;
  sortOrder?: UsersSortOrder;
  basePath?: string;
};

export type UserFormValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  email: string;
  contact_number: string;
  address: string;
  barangay: string;
  municipality_city: string;
  province: string;
  region: string;
  username: string;
  roles: string;
  position: string;
  status: string;
  profile_picture: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

