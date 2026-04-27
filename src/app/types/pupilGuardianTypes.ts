import type { GuardianFormValues, GuardianRecord } from "@/app/types/guardianTypes";

export type PupilGuardianRecord = {
  id: number;
  pupil_id: number;
  guardian_id: number;
  relationship: string;
  is_primary: boolean;
  guardian: GuardianRecord;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PupilGuardianFormValues = GuardianFormValues & {
  guardian_source: string;
  guardian_id: string;
  relationship: string;
  is_primary: string;
};

export type PupilGuardianRelationFormValues = {
  relationship: string;
  is_primary: string;
};
