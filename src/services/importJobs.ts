import { apiFetch } from '@/lib/apiClient';

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

  const response = await fetch('/api/import-jobs/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (response.ok) return;

  let message = `Erro ao enviar arquivo (${response.status})`;
  let details: unknown;

  try {
    const payload = (await response.json()) as {
      error?: string;
      details?: unknown;
    };
    if (payload?.error) message = payload.error;
    details = payload?.details;
  } catch {
    const text = await response.text().catch(() => '');
    if (text) {
      message = text.slice(0, 200);
    }
  }

  throw new ImportUploadError(message, response.status, details);
}

