import { apiFetch } from '@/lib/apiClient';

export type SimulatorResponse =
  | {
      type: 'debt';
      result: {
        months: number;
        totalPaid: number;
        totalInterest: number;
        feasible: boolean;
        message: string;
      };
    }
  | {
      type: 'reserve';
      result: {
        targetAmount: number;
        gap: number;
        monthsToTarget: number | null;
        coverageMonthsNow: number;
        message: string;
      };
    }
  | {
      type: 'floor';
      result: {
        totalCommitted: number;
        surplus: number;
        burnRatePct: number;
        safe: boolean;
        message: string;
      };
    };

export async function runSimulator(body: Record<string, unknown>): Promise<SimulatorResponse> {
  return apiFetch('/api/simulators', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
