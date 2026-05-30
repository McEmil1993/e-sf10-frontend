import type { AdminUser } from "@/app/types/userTypes";

export type LoginState = {
  error: string | null;
  email: string;
  password: string;
};

export type SessionUser = Pick<
  AdminUser,
  | "id"
  | "name"
  | "email"
  | "username"
  | "roles"
  | "status"
  | "created_at"
  | "avatar"
  | "profile_picture"
>;

export type SessionShellUser = Pick<
  SessionUser,
  "name" | "email" | "username" | "roles" | "avatar" | "profile_picture"
>;
