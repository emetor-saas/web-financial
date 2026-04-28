import { apiFetch } from '@/lib/apiClient';

export interface ImportRowReview {
  date: string | null;
  description: string;
  merchant: string | null;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  categoryId: string | null;
  categoryName: string | null;
  selectedForImport: boolean;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPORTED' | 'ERROR';
  hasPotentialConflict?: boolean;
  notes?: string | null;
}

export interface ImportRow {
  id: string;
  rowNumber: number;
  isDuplicate: boolean;
  isProcessed: boolean;
  createdAt: string;
  rawData: unknown;
  review: ImportRowReview;
}

export interface ImportJobSummary {
  total: number;
  selected: number;
  approved: number;
  pending: number;
  rejected: number;
  imported: number;
  duplicates: number;
  potentialConflicts: number;
}

export interface ImportJobDetail {
  job: {
    id: string;
    fileName: string;
    fileType: string;
    status: string;
    totalRows: number | null;
    processedRows: number | null;
    successRows: number | null;
    errorRows: number | null;
    duplicateRows: number | null;
    createdAt: string;
  };
  summary: ImportJobSummary;
  rows: ImportRow[];
  categories: Array<{ id: string; name: string }>;
}

export async function fetchImportJobDetail(id: string): Promise<ImportJobDetail> {
  return apiFetch<ImportJobDetail>(`/api/import-jobs/${id}/rows`);
}

export async function updateImportRow(
  jobId: string,
  rowId: string,
  payload: Partial<{
    date: string | null;
    description: string;
    merchant: string | null;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    categoryId: string | null;
    selectedForImport: boolean;
    reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    notes: string | null;
  }>,
): Promise<ImportRow> {
  return apiFetch<ImportRow>(`/api/import-jobs/${jobId}/rows/${rowId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createImportRow(
  jobId: string,
  payload: {
    date: string | null;
    description: string;
    merchant: string | null;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    categoryId: string | null;
    selectedForImport?: boolean;
    notes?: string | null;
  },
): Promise<ImportRow> {
  return apiFetch<ImportRow>(`/api/import-jobs/${jobId}/rows`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteImportRow(jobId: string, rowId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/import-jobs/${jobId}/rows/${rowId}`, {
    method: 'DELETE',
  });
}

export async function approveSelectedRows(jobId: string): Promise<{ updatedCount: number }> {
  return apiFetch<{ updatedCount: number }>(`/api/import-jobs/${jobId}/approve-selected`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function commitImport(jobId: string): Promise<{
  importedCount: number;
  skippedCount: number;
}> {
  return apiFetch<{ importedCount: number; skippedCount: number }>(
    `/api/import-jobs/${jobId}/commit`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
}

