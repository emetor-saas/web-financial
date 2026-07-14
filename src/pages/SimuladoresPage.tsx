import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { runSimulator, type SimulatorResponse } from '@/services/simulators';
import { formatCurrency } from '@/utils/formatters';

type Tab = 'debt' | 'reserve' | 'floor';

export default function SimuladoresPage() {
  const [tab, setTab] = useState<Tab>('debt');
  const [debt, setDebt] = useState({ principal: 5000, monthlyRatePct: 2.5, monthlyPayment: 400 });
  const [reserve, setReserve] = useState({
    monthlyExpenses: 4000,
    currentReserve: 1000,
    monthlyContribution: 300,
    targetMonths: 3,
  });
  const [floor, setFloor] = useState({
    monthlyIncomeFloor: 4500,
    fixedExpenses: 2200,
    variableExpenses: 1200,
    debtPayments: 400,
  });
  const [result, setResult] = useState<SimulatorResponse | null>(null);

  const mutation = useMutation({
    mutationFn: runSimulator,
    onSuccess: setResult,
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs = useMemo(
    () =>
      [
        { id: 'debt' as const, label: 'Quitação de dívida' },
        { id: 'reserve' as const, label: 'Reserva' },
        { id: 'floor' as const, label: 'Orçamento-piso' },
      ] as const,
    [],
  );

  const run = () => {
    if (tab === 'debt') mutation.mutate({ type: 'debt', ...debt });
    else if (tab === 'reserve') mutation.mutate({ type: 'reserve', ...reserve });
    else mutation.mutate({ type: 'floor', ...floor });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
          <Calculator size={28} /> Simuladores
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cálculos determinísticos educativos. Não são recomendação de crédito nem de investimento.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setResult(null);
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-4">
        {tab === 'debt' && (
          <>
            <Field label="Saldo da dívida (R$)" value={debt.principal} onChange={(v) => setDebt({ ...debt, principal: v })} />
            <Field label="Juros a.m. (%)" value={debt.monthlyRatePct} onChange={(v) => setDebt({ ...debt, monthlyRatePct: v })} />
            <Field label="Pagamento mensal (R$)" value={debt.monthlyPayment} onChange={(v) => setDebt({ ...debt, monthlyPayment: v })} />
          </>
        )}
        {tab === 'reserve' && (
          <>
            <Field label="Despesa mensal (R$)" value={reserve.monthlyExpenses} onChange={(v) => setReserve({ ...reserve, monthlyExpenses: v })} />
            <Field label="Reserva atual (R$)" value={reserve.currentReserve} onChange={(v) => setReserve({ ...reserve, currentReserve: v })} />
            <Field label="Aporte mensal (R$)" value={reserve.monthlyContribution} onChange={(v) => setReserve({ ...reserve, monthlyContribution: v })} />
            <Field label="Meta (meses)" value={reserve.targetMonths} onChange={(v) => setReserve({ ...reserve, targetMonths: v })} />
          </>
        )}
        {tab === 'floor' && (
          <>
            <Field label="Renda-piso (R$)" value={floor.monthlyIncomeFloor} onChange={(v) => setFloor({ ...floor, monthlyIncomeFloor: v })} />
            <Field label="Fixos (R$)" value={floor.fixedExpenses} onChange={(v) => setFloor({ ...floor, fixedExpenses: v })} />
            <Field label="Variáveis (R$)" value={floor.variableExpenses} onChange={(v) => setFloor({ ...floor, variableExpenses: v })} />
            <Field label="Parcelas de dívidas (R$)" value={floor.debtPayments} onChange={(v) => setFloor({ ...floor, debtPayments: v })} />
          </>
        )}
        <button
          type="button"
          className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
          disabled={mutation.isPending}
          onClick={run}
        >
          {mutation.isPending ? 'Calculando…' : 'Simular'}
        </button>
      </section>

      {result && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-2">
          <h2 className="font-display font-semibold">Resultado</h2>
          {result.type === 'debt' && (
            <>
              <p className="text-sm">{result.result.message}</p>
              <p className="text-xs text-muted-foreground">
                Total pago {formatCurrency(result.result.totalPaid)} · Juros {formatCurrency(result.result.totalInterest)}
              </p>
            </>
          )}
          {result.type === 'reserve' && (
            <>
              <p className="text-sm">{result.result.message}</p>
              <p className="text-xs text-muted-foreground">
                Meta {formatCurrency(result.result.targetAmount)} · Lacuna {formatCurrency(result.result.gap)} · Cobertura
                atual {result.result.coverageMonthsNow.toFixed(1)} mês(es)
              </p>
            </>
          )}
          {result.type === 'floor' && (
            <>
              <p className="text-sm">{result.result.message}</p>
              <p className="text-xs text-muted-foreground">
                Comprometido {formatCurrency(result.result.totalCommitted)} · Sobra{' '}
                {formatCurrency(result.result.surplus)} · {result.result.burnRatePct.toFixed(0)}% do piso
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <input
        type="number"
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        step="any"
      />
    </label>
  );
}
