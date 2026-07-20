import { apiFetch, apiFormFetch } from '@/lib/apiClient';

export interface ImportJob {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface ImportJobsResponse extends Array<ImportJob> {}

export class ImportUploadError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ImportUploadError';
    this.status = status;
    this.details = details;
  }
}

export async function listImportJobs(): Promise<ImportJobsResponse> {
  return apiFetch<ImportJobsResponse>('/api/import-jobs');
}

export async function uploadImportFile(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    await apiFormFetch('/api/import-jobs/upload', formData);
  } catch (err) {
    const status = (err as Error & { status?: number; details?: unknown }).status ?? 0;
    const details = (err as Error & { details?: unknown }).details;
    const message =
      err instanceof Error && err.message
        ? err.message
        : `Erro ao enviar arquivo (${status})`;
    throw new ImportUploadError(message, status, details);
  }
}

