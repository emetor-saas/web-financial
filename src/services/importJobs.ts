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

export async function listImportJobs(): Promise<ImportJobsResponse> {
  return apiFetch<ImportJobsResponse>('/api/import-jobs');
}

export async function uploadImportFile(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  await fetch('/api/import-jobs/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
}

