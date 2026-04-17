export type UserRole = "admin" | "user" | "editor" | "staff" | "developer";
export type UserStatus = "active" | "inactive" | "banned";
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
};

export type UserTableRow = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  username?: string;
  contact_number?: string;
  created_at: string;
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
  password: string;
  confirm_password: string;
  roles: string;
  position: string;
  status: string;
  profile_picture: string;
};
