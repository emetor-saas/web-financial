import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, AlertCircle, Plus, Loader2, Pencil } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGoal, fetchGoals, updateGoal, type Goal } from '@/services/goals';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05 },
});

type GoalStatus = 'on-track' | 'warning' | 'behind' | 'completed' | 'incomplete';

/**
 * Status baseado só em dados informados pelo usuário.
 * Sem aporte/prazo: incompleto (não inventa "viável").
 */
function computeStatus(goal: Goal, progress: number): GoalStatus {
  if (goal.isAchieved || progress >= 100) return 'completed';

  if (goal.targetDate && goal.monthlyContribution != null && goal.monthlyContribution > 0) {
    const msLeft = new Date(goal.targetDate).getTime() - Date.now();
    const monthsLeft = Math.max(1, msLeft / (30 * 24 * 3600 * 1000));
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const neededPerMonth = remaining / monthsLeft;

    if (goal.monthlyContribution >= neededPerMonth * 0.9) return 'on-track';
    if (goal.monthlyContribution >= neededPerMonth * 0.55) return 'warning';
    return 'behind';
  }

  return 'incomplete';
}

type GoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  monthlyContribution: string;
  targetDate: string;
};

const emptyForm: GoalFormState = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  monthlyContribution: '',
  targetDate: '',
};

function goalToForm(goal: Goal): GoalFormState {
  return {
    name: goal.name,
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount ?? 0),
    monthlyContribution:
      goal.monthlyContribution != null ? String(goal.monthlyContribution) : '',
    targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
  };
}

function parseFormPayload(form: GoalFormState) {
  const targetAmount = Number(String(form.targetAmount).replace(',', '.'));
  return {
    name: form.name.trim(),
    targetAmount,
    currentAmount: Number(String(form.currentAmount).replace(',', '.')) || 0,
    monthlyContribution: form.monthlyContribution
      ? Number(String(form.monthlyContribution).replace(',', '.'))
      : null,
    targetDate: form.targetDate || null,
    description: null as string | null,
  };
}

const MetasPage = () => {
  const queryClient = useQueryClient();
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalFormState>(emptyForm);

  const invalidateGoalQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['diagnostic-current-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['diagnostic-current-insights'] });
  };

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      invalidateGoalQueries();
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: 'Meta criada', description: 'Ela passa a alimentar diagnóstico e insights.' });
    },
    onError: (err: Error) => {
      toast({
        title: 'Não foi possível criar a meta',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnType<typeof parseFormPayload> }) =>
      updateGoal(id, payload),
    onSuccess: () => {
      invalidateGoalQueries();
      setOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: 'Meta atualizada' });
    },
    onError: (err: Error) => {
      toast({
        title: 'Não foi possível atualizar a meta',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const list = goals ?? [];
  const saving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setForm(goalToForm(goal));
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = parseFormPayload(form);
    if (!payload.name || !Number.isFinite(payload.targetAmount) || payload.targetAmount <= 0) {
      toast({ title: 'Preencha nome e valor alvo', variant: 'destructive' });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div {...anim(0)} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Objetivos com valor, prazo e aporte definidos por você, usados no diagnóstico e nos insights.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} />
          Nova meta
        </button>
      </motion.div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="animate-spin" size={16} />
          Carregando metas…
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <motion.div {...anim(1)} className="border border-dashed border-border rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Target size={22} className="text-primary" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-lg font-semibold">Nenhuma meta ainda</h2>
            <p className="text-sm text-muted-foreground">
              No diagnóstico informe valor e prazo dos objetivos, ou crie a primeira meta aqui com os números
              que fazem sentido para você.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={16} />
            Criar primeira meta
          </button>
        </motion.div>
      )}

      <div className="space-y-4">
        {list.map((g, i) => {
          const progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const monthlyNeeded = g.monthlyContribution;
          const status = computeStatus(g, progress);
          const barClass =
            status === 'on-track' || status === 'completed'
              ? 'bg-success'
              : status === 'warning'
                ? 'bg-warning'
                : status === 'incomplete'
                  ? 'bg-muted-foreground/40'
                  : 'bg-destructive';

          const projectionData =
            monthlyNeeded != null && monthlyNeeded > 0
              ? Array.from({ length: 7 }, (_, idx) => ({
                  month: `M${idx}`,
                  otimista: Math.min(g.currentAmount + monthlyNeeded * 1.2 * idx, g.targetAmount),
                  realista: Math.min(g.currentAmount + monthlyNeeded * idx, g.targetAmount),
                  conservador: Math.min(g.currentAmount + monthlyNeeded * 0.7 * idx, g.targetAmount),
                }))
              : [];

          return (
            <motion.div key={g.id} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      status === 'on-track' || status === 'completed'
                        ? 'bg-success/20'
                        : status === 'warning'
                          ? 'bg-warning/20'
                          : status === 'incomplete'
                            ? 'bg-muted'
                            : 'bg-destructive/20'
                    }`}
                  >
                    <Target size={18} className={getStatusColor(status === 'incomplete' ? 'warning' : status)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold truncate">{g.name}</h3>
                    {g.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="text-xl font-display font-bold tabular-nums">{formatCurrency(g.targetAmount)}</p>
                  {g.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      Prazo: {new Date(g.targetDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(g)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold hover:bg-muted/50"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatCurrency(g.currentAmount)} acumulado</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${barClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground text-xs">Falta</span>
                  <p className="font-semibold tabular-nums">{formatCurrency(remaining)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Aporte planejado</span>
                  <p className="font-semibold tabular-nums">
                    {monthlyNeeded != null && monthlyNeeded > 0
                      ? `${formatCurrency(monthlyNeeded)}/mês`
                      : 'Não definido'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Viabilidade</span>
                  <p className={`font-semibold ${getStatusColor(status === 'incomplete' ? 'warning' : status)}`}>
                    {status === 'on-track'
                      ? 'Viável'
                      : status === 'warning'
                        ? 'Atenção'
                        : status === 'completed'
                          ? 'Concluída'
                          : status === 'incomplete'
                            ? 'Informe aporte e prazo'
                            : 'Em risco'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {status === 'on-track' || status === 'completed' ? (
                      <TrendingUp size={14} className="text-success" />
                    ) : (
                      <AlertCircle size={14} className="text-warning" />
                    )}
                    <span className="text-sm">
                      {status === 'on-track'
                        ? 'No caminho'
                        : status === 'warning'
                          ? 'Requer ajuste'
                          : status === 'completed'
                            ? 'Concluída'
                            : status === 'incomplete'
                              ? 'Incompleto'
                              : 'Atrasada'}
                    </span>
                  </div>
                </div>
              </div>

              {projectionData.length > 0 && (
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
                      <XAxis dataKey="month" stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 9%)',
                          border: '1px solid hsl(0, 0%, 18%)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        itemStyle={{ color: 'hsl(0, 0%, 100%)' }}
                      />
                      <Line type="monotone" dataKey="otimista" stroke="hsl(145, 55%, 65%)" strokeWidth={1.5} dot={false} name="Otimista" />
                      <Line type="monotone" dataKey="realista" stroke="hsl(145, 55%, 58%)" strokeWidth={2} dot={false} name="Realista" />
                      <Line
                        type="monotone"
                        dataKey="conservador"
                        stroke="hsl(0, 0%, 65%)"
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="5 5"
                        name="Conservador"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEditingId(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Nome</span>
              <input
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Reserva de emergência"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Valor alvo (R$)</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  inputMode="decimal"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Já acumulado (R$)</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                  inputMode="decimal"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Aporte mensal (R$)</span>
                <input
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.monthlyContribution}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: e.target.value }))}
                  inputMode="decimal"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Prazo</span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </label>
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Salvar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MetasPage;
