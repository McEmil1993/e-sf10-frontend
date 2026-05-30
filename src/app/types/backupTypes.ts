export type BackupFileSource = "export" | "import";

export type BackupTableCounts = {
  modules: number;
  permissions: number;
  roles: number;
  role_permissions: number;
  positions: number;
  subjects: number;
  schools: number;
  school_years: number;
  teachers: number;
  sections: number;
  users: number;
  user_roles: number;
  user_permissions: number;
  students: number;
  sf10_records: number;
  scholastic_records: number;
  student_grades: number;
  remedial_classes: number;
  eligibility_records: number;
  sf10_certifications: number;
};

export type BackupFileItem = {
  filename: string;
  displayName: string;
  extension: string;
  sizeInBytes: number;
  downloadUrl: string;
  storagePath: string;
  createdAt: string;
  lastModifiedAt: string;
  source: BackupFileSource;
};

export type BackupListResponse = {
  totalFiles: number;
  totalSizeInBytes: number;
  files: BackupFileItem[];
};

export type BackupSummary = {
  totalRecords: number;
  tableCounts: BackupTableCounts;
};

export type BackupMutationResponse = {
  file: BackupFileItem;
  summary: BackupSummary;
};
