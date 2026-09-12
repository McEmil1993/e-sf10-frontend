import { requestAuthenticatedApi } from "@/app/utils/api";
import type { AcademicEntityKey, AcademicRecord } from "@/app/types/academicTypes";

export function listAcademicRecords(entity: AcademicEntityKey, token?: string) {
  return requestAuthenticatedApi<AcademicRecord[]>(`/academic/${entity}`, { token });
}

export function createAcademicRecord(
  entity: AcademicEntityKey,
  payload: Record<string, unknown>,
  token?: string,
) {
  return requestAuthenticatedApi<AcademicRecord>(`/academic/${entity}`, {
    method: "POST",
    body: payload,
    token,
  });
}


export function updateAcademicRecord(
  entity: AcademicEntityKey,
  recordId: number,
  payload: Record<string, unknown>,
  token?: string,
) {
  return requestAuthenticatedApi<AcademicRecord>(`/academic/${entity}/${recordId}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export function deleteAcademicRecord(entity: AcademicEntityKey, recordId: number, token?: string) {
  return requestAuthenticatedApi(`/academic/${entity}/${recordId}`, {
    method: "DELETE",
    token,
  });
}
