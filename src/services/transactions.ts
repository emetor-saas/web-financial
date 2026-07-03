import { apiFetch } from '@/lib/apiClient';

export interface TransactionRow {
  id: string;
  date: string;
  description: string;
  merchant: string | null;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  status: string;
  importJobId: string | null;
  category: { id: string; name: string } | null;
}

export function getMonthDateRange(month: number, year: number): { startDate: string; endDate: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export async function fetchTransactionsForPeriod(params: {
  month: number;
  year: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  limit?: number;
}): Promise<TransactionRow[]> {
  const { startDate, endDate } = getMonthDateRange(params.month, params.year);
  const search = new URLSearchParams({
    startDate,
    endDate,
    status: 'CONFIRMED',
    limit: String(params.limit ?? 500),
  });
  if (params.type) search.set('type', params.type);

  const rows = await apiFetch<TransactionRow[]>(`/api/transactions?${search.toString()}`);
  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

export function sumTransactionsByType(
  rows: TransactionRow[],
  type: 'INCOME' | 'EXPENSE',
): number {
  return rows
    .filter((row) => row.type === type)
    .reduce((sum, row) => sum + (type === 'EXPENSE' ? Math.abs(row.amount) : Math.max(0, row.amount)), 0);
}

export async function updateTransaction(
  id: string,
  payload: Partial<{
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    date: string;
    categoryId: string | null;
  }>,
): Promise<TransactionRow> {
  return apiFetch<TransactionRow>(`/api/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
}
