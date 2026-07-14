import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Loader2 } from 'lucide-react';
import { fetchMonthlyHealthReport } from '@/services/reports';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MonthlyHealthReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonthlyHealthReportDialog({ open, onOpenChange }: MonthlyHealthReportDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-health-report'],
    queryFn: () => fetchMonthlyHealthReport(),
    enabled: open,
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Saúde da casa: ${data?.period.label ?? ''}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 32px; color: #111; max-width: 720px; margin: 0 auto; }
          h1 { font-size: 1.5rem; margin-bottom: 4px; }
          .muted { color: #666; font-size: 0.875rem; }
          .score { font-size: 2.5rem; font-weight: 800; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
          .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
          .card label { font-size: 0.7rem; text-transform: uppercase; color: #888; }
          .card p { font-size: 1.1rem; font-weight: 700; margin: 4px 0 0; }
          ul { padding-left: 1.2rem; }
          li { margin-bottom: 6px; }
          .alert { border-left: 3px solid #f59e0b; padding-left: 12px; margin-bottom: 12px; }
          @media print { body { padding: 16px; } }
        </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório de saúde da casa</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <>
            <div ref={printRef} className="space-y-6 text-sm">
              <div>
                <h2 className="text-xl font-bold">{data.householdName}</h2>
                <p className="muted text-muted-foreground">{data.period.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fonte: {data.dataSource === 'transactions' ? 'extratos importados' : 'diagnóstico inicial'}
                </p>
              </div>

              <div className="flex items-baseline gap-3">
                <span className={`score font-display ${getScoreColor(data.auraScore)}`}>{data.auraScore}</span>
                <span className="text-muted-foreground">{getScoreLabel(data.auraScore)}</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="card border border-border rounded-lg p-3">
                  <label className="text-[10px] uppercase text-muted-foreground">Receitas</label>
                  <p className="font-bold">{formatCurrency(data.summary.income)}</p>
                </div>
                <div className="card border border-border rounded-lg p-3">
                  <label className="text-[10px] uppercase text-muted-foreground">Despesas</label>
                  <p className="font-bold">{formatCurrency(data.summary.expenses)}</p>
                </div>
                <div className="card border border-border rounded-lg p-3">
                  <label className="text-[10px] uppercase text-muted-foreground">Saldo</label>
                  <p className={`font-bold ${data.summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(data.summary.balance)}
                  </p>
                </div>
              </div>

              {data.topCategories.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Maiores gastos por categoria</h3>
                  <ul className="space-y-1">
                    {data.topCategories.map((cat) => (
                      <li key={cat.categoryId ?? cat.categoryName} className="flex justify-between gap-2">
                        <span>{cat.categoryName}</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(cat.total)} ({Math.round(cat.shareOfExpenses * 100)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.alerts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Alertas do período</h3>
                  {data.alerts.map((alert) => (
                    <div key={alert.id} className="alert border-l-2 border-amber-500 pl-3 mb-3">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{alert.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {data.goals.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Metas</h3>
                  <ul>
                    {data.goals.map((goal) => (
                      <li key={goal.id}>
                        {goal.name}: {Math.round(goal.progressPct * 100)}% de {formatCurrency(goal.targetAmount)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Prioridades</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {data.priorities.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:bg-primary/90"
            >
              <FileDown size={16} />
              Imprimir / salvar PDF
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
