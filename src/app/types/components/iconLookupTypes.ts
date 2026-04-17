import type { AppIconName, AppIconOption } from "@/app/types/iconTypes";

export type IconLookupFieldProps = {
  disabled?: boolean;
  onChange: (value: AppIconName) => void;
  options: AppIconOption[];
  value: string;
};
