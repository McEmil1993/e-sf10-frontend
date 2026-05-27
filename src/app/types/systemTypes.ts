export type SchoolSettings = {
  school_id: number;
  deped_school_id: string;
  school_name: string;
  district: string;
  division: string;
  region: string;
  address: string;
  school_logo: string;
  deped_logo: string;
  other_logo: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SchoolSettingsFormValues = {
  deped_school_id: string;
  school_name: string;
  district: string;
  division: string;
  region: string;
  province: string;
  municipality_city: string;
  barangay: string;
  sitio_purok: string;
  address: string;
  school_logo: string;
  deped_logo: string;
  other_logo: string;
};
