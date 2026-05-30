import type {
  ModalFieldOption,
  ModalFieldType,
  ModalSize,
} from "@/app/types/components/modalTypes";

export type AcademicEntityKey =
  | "school-years"
  | "teachers"
  | "sections"
  | "sf10-records"
  | "scholastic-records"
  | "grades"
  | "remedial-classes"
  | "eligibility-records"
  | "certifications";

export type AcademicValueType = "string" | "number" | "boolean" | "date" | "datetime";
export type AcademicLookupSource = "teaching-users";

export type AcademicRecord = Record<string, unknown> & {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type AcademicFieldConfig = {
  name: string;
  label: string;
  valueType?: AcademicValueType;
  defaultValue?: string;
  inputType?: ModalFieldType;
  lookupSource?: AcademicLookupSource;
  options?: ModalFieldOption[];
  required?: boolean;
  placeholder?: string;
  form?: boolean;
  table?: boolean;
  colSpan?: 1 | 2;
  layoutClassName?: string;
  rangeEndName?: string;
  yearStart?: number;
  yearEnd?: number;
};

export type AcademicCrudConfig = {
  entity: AcademicEntityKey;
  title: string;
  recordLabel?: string;
  breadcrumb: string;
  description: string;
  addLabel: string;
  modalSize?: ModalSize;
  modalColumns?: 1 | 2 | 3;
  modalGridClassName?: string;
  fields: AcademicFieldConfig[];
};
