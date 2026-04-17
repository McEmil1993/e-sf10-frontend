import type { ModalFieldOption } from "@/app/types/components/modalTypes";

export type LookupFieldProps = {
  disabled?: boolean;
  onChange: (value: string) => void;
  options: ModalFieldOption[];
  placeholder?: string;
  value: string;
};
