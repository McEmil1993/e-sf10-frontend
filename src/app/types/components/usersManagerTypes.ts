import type { AdminUser } from "@/app/types/userTypes";

export type UsersManagerProps = {
  initialUsers: AdminUser[];
};

export type UsersDialogMode = "view" | "add" | "edit";

export type UsersDialogState = {
  mode: UsersDialogMode;
  userId: number | null;
};

export type UsersDeleteState = {
  userId: number | null;
};

export type UsersStatusState = {
  userId: number | null;
};

export type UserOption = {
  label: string;
  value: string;
};
