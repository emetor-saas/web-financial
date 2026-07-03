import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteTransaction,
  fetchTransactionsForPeriod,
  updateTransaction,
  type TransactionRow,
} from '@/services/transactions';
import { formatCurrency } from '@/utils/formatters';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.03 },
});

export default function LancamentosPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['lancamentos', month, year],
    queryFn: () => fetchTransactionsForPeriod({ month, year, limit: 500 }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Nenhum lançamento selecionado');
      const amount = Number(editAmount.replace(',', '.'));
      return updateTransaction(editing.id, {
        description: editDescription,
        amount: Number.isFinite(amount) ? amount : Math.abs(editing.amount),
        type: editing.type,
      });
    },
    onSuccess: () => {
      toast.success('Lançamento atualizado.');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['journey-current'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao salvar.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      toast.success('Lançamento removido.');
      void queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['journey-current'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao remover.'),
  });

  const openEdit = (row: TransactionRow) => {
    setEditing(row);
    setEditDescription(row.description);
    setEditAmount(String(Math.abs(row.amount)));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <motion.header {...anim(0)}>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Lançamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edite ou remova movimentações confirmadas. Alterações refletem no dashboard e na jornada.
        </p>
      </motion.header>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Mês</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="block mt-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Ano</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="block mt-1 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lançamento confirmado neste período.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2.5 px-2 text-xs text-muted-foreground uppercase">Data</th>
                <th className="py-2.5 px-2 text-xs text-muted-foreground uppercase">Descrição</th>
                <th className="py-2.5 px-2 text-xs text-muted-foreground uppercase">Categoria</th>
                <th className="py-2.5 px-2 text-xs text-muted-foreground uppercase text-right">Valor</th>
                <th className="py-2.5 px-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/60 hover:bg-accent/40">
                  <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-2 max-w-[240px] truncate">{row.description}</td>
                  <td className="py-2.5 px-2 text-xs">{row.category?.name ?? '—'}</td>
                  <td
                    className={`py-2.5 px-2 text-right font-semibold tabular-nums ${
                      row.type === 'INCOME' ? 'text-emerald-600' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(Math.abs(row.amount))}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Remover este lançamento?')) {
                            deleteMutation.mutate(row.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md space-y-4">
            <h2 className="font-semibold">Editar lançamento</h2>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Valor (R$)</label>
              <input
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-border text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
