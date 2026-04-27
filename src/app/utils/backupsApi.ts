import { ApiError, getClientAuthSession, requestAuthenticatedApi } from "@/app/utils/api";
import type {
  BackupFileItem,
  BackupListResponse,
  BackupMutationResponse,
} from "@/app/types/backupTypes";

function getBackupApiBaseUrl() {
  const value = process.env.BASE_API?.trim();

  if (!value) {
    throw new ApiError(500, "BASE_API is not set.");
  }

  return value.replace(/\/+$/, "");
}

function resolveAuthToken(token?: string) {
  if (token?.trim()) {
    return token.trim();
  }

  return getClientAuthSession()?.token ?? null;
}

async function parseErrorResponse(response: Response) {
  try {
    const payload = (await response.json()) as {
      message?: string;
      errors?: unknown;
    };

    return {
      message: payload.message ?? `Request failed with status ${response.status}.`,
      errors: payload.errors,
    };
  } catch {
    return {
      message: `Request failed with status ${response.status}.`,
      errors: undefined,
    };
  }
}

export async function listBackups(token?: string) {
  return requestAuthenticatedApi<BackupListResponse>("/backups", { token });
}

export async function exportBackup(token?: string) {
  return requestAuthenticatedApi<BackupMutationResponse>("/backups/export", {
    method: "POST",
    token,
  });
}

export async function importBackup(file: File, token?: string) {
  const formData = new FormData();
  formData.append("file", file);

  return requestAuthenticatedApi<BackupMutationResponse>("/backups/import", {
    method: "POST",
    body: formData,
    token,
  });
}

export async function importStoredBackup(filename: string, token?: string) {
  return requestAuthenticatedApi<BackupMutationResponse>(
    `/backups/files/${encodeURIComponent(filename)}/import`,
    {
      method: "POST",
      token,
    },
  );
}

export async function downloadBackup(filename: string, token?: string) {
  const resolvedToken = resolveAuthToken(token);

  if (!resolvedToken) {
    throw new ApiError(401, "Unauthorized.");
  }

  const response = await fetch(
    `${getBackupApiBaseUrl()}/backups/files/${encodeURIComponent(filename)}/download`,
    {
      headers: {
        Accept: "application/sql, text/plain, application/octet-stream, application/json",
        Authorization: `Bearer ${resolvedToken}`,
      },
    },
  );

  if (!response.ok) {
    const parsedError = await parseErrorResponse(response);
    throw new ApiError(response.status, parsedError.message, parsedError.errors);
  }

  return response.blob();
}

export function prependBackupFile(files: BackupFileItem[], nextFile: BackupFileItem) {
  return [nextFile, ...files.filter((file) => file.filename !== nextFile.filename)];
}
