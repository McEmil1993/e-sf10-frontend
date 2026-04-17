import type { AdminUser } from "@/app/types/userTypes";

export type LoginState = {
  error: string | null;
  email: string;
  password: string;
};

export type SessionUser = Pick<
  AdminUser,
  "id" | "name" | "email" | "roles" | "status" | "created_at"
>;

export type SessionShellUser = Pick<SessionUser, "name" | "email" | "roles">;
