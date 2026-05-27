export type BackendSuccessResponse<T> = {
  success: true;
  message: string;
  data?: T;
};

export type BackendErrorResponse = {
  success: false;
  message: string;
  errors?: unknown;
};

export type BackendApiResponse<T> = BackendSuccessResponse<T> | BackendErrorResponse;

export type BackendUserResponseDto = {
  id: number;
  name: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  sex: string | null;
  email: string;
  contactNumber: string | null;
  address: string | null;
  barangay: string | null;
  municipalityCity: string | null;
  province: string | null;
  region: string | null;
  username: string | null;
  roles: string[];
  position: string | null;
  status: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackendStudentResponseDto = {
  id: number;
  lrn: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  sex: string;
  birthdate: string;
  birthplace: string | null;
  streetAddress: string | null;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  status: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackendGuardianResponseDto = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  contactNumber: string;
  address: string;
  barangay: string;
  municipalityCity: string;
  province: string;
  region: string;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackendStudentGuardianResponseDto = {
  id: number;
  studentId: number;
  guardianId: number;
  relationship: string;
  isPrimary: boolean;
  guardian: BackendGuardianResponseDto;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackendStudentInformationLookupDto = {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type BackendStudentInformationLookupsResponseDto = {
  motherTongues: BackendStudentInformationLookupDto[];
  indigenousGroups: BackendStudentInformationLookupDto[];
  religions: BackendStudentInformationLookupDto[];
};

export type BackendStudentInformationResponseDto = {
  studentId: number;
  motherTongue: BackendStudentInformationLookupDto | null;
  indigenousGroup: BackendStudentInformationLookupDto | null;
  religion: BackendStudentInformationLookupDto | null;
};

export type BackendAuthResponseDto = {
  user: BackendUserResponseDto;
  token: string;
};

export type BackendRoleResponseDto = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendModuleResponseDto = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendPermissionResponseDto = {
  id: number;
  moduleId: number;
  moduleName: string;
  moduleSlug: string;
  moduleIcon: string | null;
  moduleSortOrder: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendPositionResponseDto = {
  id: number;
  acronym: string;
  fullPosition: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackendSchoolSettingsResponseDto = {
  schoolId: number;
  depedSchoolId: string;
  schoolName: string;
  district: string;
  division: string;
  region: string;
  address: string;
  schoolLogo: string | null;
  depedLogo: string | null;
  otherLogo: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
