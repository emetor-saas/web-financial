import { motion } from 'framer-motion';
import { Target, CreditCard, BrainCircuit, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '@/services/dashboard';
import { fetchGoals } from '@/services/goals';
import { apiFetch } from '@/lib/apiClient';
import { buildClientNarrative } from '@/lib/clientNarrative';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { fetchInAppAlerts } from '@/services/notifications';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Alert } from '@/types';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

type DiagnosticPayload = {
  auraScore: { score: number; band: string };
  mainRisks: string[];
  mainPriorities: string[];
  summaryExecutive?: string[];
  currentSituation?: { totalDebt?: number };
  onboardingAnswers?: {
    saldoMensal?: 'azul' | 'vermelho' | '';
    objetivosCurto?: string;
    objetivosLongo?: string;
  } | null;
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [showNotifications, setShowNotifications] = useState(false);
  const now = new Date();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());

  const monthLabel = new Date(periodYear, periodMonth - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    .replace('.', '')
    .replace(/^\w/, (c) => c.toUpperCase());

  const yearOptions = [periodYear - 1, periodYear, periodYear + 1];

  const canLoadNotifications = isAuthenticated && Boolean(user?.householdId);
  const { data: notificationsFromApi } = useQuery({
    queryKey: ['in-app-notifications', user?.householdId],
    queryFn: () => fetchInAppAlerts({ limit: 50 }),
    enabled: canLoadNotifications,
    staleTime: 60_000,
    retry: 1,
  });
  const notifications: Alert[] = canLoadNotifications ? (notificationsFromApi ?? []) : [];
  const unreadCount = notifications.length;



  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', periodMonth, periodYear],
    queryFn: () => fetchDashboardStats({ month: periodMonth, year: periodYear }),
  });

  const { data: diagnostic } = useQuery({
    queryKey: ['diagnostic-current-dashboard'],
    queryFn: () => apiFetch<DiagnosticPayload>('/api/diagnostic/current'),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  const topGoal = (goals ?? []).find((g) => !g.isAchieved) ?? (goals ?? [])[0] ?? null;
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const balance = stats?.balance ?? 0;
  const dataSource = stats?.dataSource ?? 'none';
  const usesTransactions = dataSource === 'transactions';
  const periodHasTransactions = stats?.periodHasTransactions === true;
  const estimatedFromDiagnostic = stats?.estimatedFromDiagnostic === true;

  const auraScore = diagnostic?.auraScore?.score ?? 0;
  const riskBand = diagnostic?.auraScore?.band?.replace('_', ' ') ?? 'Aguardando dados';
  const narrative = buildClientNarrative(diagnostic ?? {}, 'dashboard');
  const priorities = diagnostic?.mainPriorities ?? [];
  const recommendation = diagnostic?.summaryExecutive?.[0] ?? null;
  const expensesByCategory = stats?.expensesByCategory ?? [];

  const chartData = [
    { label: 'Receitas', total: totalIncome },
    { label: 'Gastos', total: totalExpenses },
  ];

  const fallbackPriorities = [
    'Construir ou reforçar a reserva até atingir pelo menos 3 meses de despesas.',
    'Proteger saldo positivo para acelerar metas.',
    'Criar estratégia de ataque por juros e impacto no fluxo.',
  ];

  const displayPriorities = priorities.length > 0 ? priorities.slice(0, 3) : fallbackPriorities;

  const quickLinks = [
    { label: 'Diagnóstico', icon: Activity, path: '/app/diagnostico' },
    { label: 'Metas', icon: Target, path: '/app/metas' },
    { label: 'Dívidas', icon: CreditCard, path: '/app/dividas' },
    { label: 'Insights IA', icon: BrainCircuit, path: '/app/insights' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="font-bold text-lg tracking-tight text-foreground">
            Resumo / <span className="text-muted-foreground font-normal">{monthLabel}</span>
          </h1>
          <div className="flex items-center gap-2">
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
              className="text-xs rounded-lg border border-border bg-card px-2 py-1.5"
              aria-label="Mês do resumo"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {new Date(periodYear, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
              className="text-xs rounded-lg border border-border bg-card px-2 py-1.5"
              aria-label="Ano do resumo"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risco</span>
            <span className="text-xs font-bold text-destructive">{riskBand}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <ThemeSwitcher />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              className={cn(
                'relative p-2 rounded-lg transition-all duration-200',
                showNotifications
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              aria-label={unreadCount ? `${unreadCount} notificações` : 'Notificações'}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} aria-hidden />
                <div className={cn(
                  'z-50',
                  isMobile
                    ? 'fixed left-2 right-2 top-[60px]'
                    : 'absolute right-0 top-full mt-2'
                )}>
                  <NotificationsPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    className={isMobile ? 'w-full max-h-[65vh]' : undefined}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 sm:p-8 space-y-6">

        {estimatedFromDiagnostic && (
          <motion.p {...anim(0)} className="text-xs text-muted-foreground border-b border-border pb-4">
            Valores do diagnóstico inicial (antes de importar extratos). Importe OFX/CSV para ver dados reais.
          </motion.p>
        )}

        {usesTransactions && !periodHasTransactions && (
          <motion.p {...anim(0)} className="text-xs text-amber-700 dark:text-amber-400 border-b border-amber-500/30 pb-4">
            Você já importou extratos, mas não há lançamentos em {monthLabel.toLowerCase()}. Selecione o mês do
            extrato acima.
          </motion.p>
        )}

        {usesTransactions && periodHasTransactions && (
          <motion.p {...anim(0)} className="text-xs text-emerald-700 dark:text-emerald-400 border-b border-emerald-500/30 pb-4">
            Renda e gastos calculados a partir dos lançamentos importados ({monthLabel.toLowerCase()}).
          </motion.p>
        )}

        <motion.div {...anim(0)} className="grid grid-cols-2 lg:grid-cols-4 items-start gap-x-8 gap-y-4">
          <KpiItem label="Renda Mensal" value={formatCurrency(totalIncome)} />
          <KpiItem label="Gastos Totais" value={formatCurrency(totalExpenses)} />
          <KpiItem label="Sobra Real" value={formatCurrency(balance)} />
          <div className="flex flex-col items-start lg:items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score Clareza</span>
            <span className={`text-5xl font-black font-mono-nums leading-none ${getScoreColor(auraScore)}`}>
              {Math.round(auraScore)}
            </span>
            <span className="text-xs text-muted-foreground">{getScoreLabel(auraScore)}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            <motion.div {...anim(1)} className="card-solid rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Diagnóstico Financeiro Atual
                </span>
                <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest border border-border rounded px-2 py-0.5 text-muted-foreground">
                  Active Diagnosis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Contexto</span>
                  <p className="text-sm text-foreground leading-relaxed">{narrative.context}.</p>
                </div>

                <div className="space-y-2">
                  {recommendation && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Recomendação Clareza</span>
                      <p className="text-sm font-semibold text-foreground italic leading-snug">"{recommendation}"</p>
                    </div>
                  )}
                  {priorities[0] && (
                    <div className="mt-2 rounded-lg bg-muted px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">Ação Recomendada:</span>
                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide leading-snug">{priorities[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-8 pt-3 border-t border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">
                    Meta principal
                  </span>
                  {topGoal ? (
                    <Link to="/app/metas" className="block hover:opacity-80">
                      <span className="text-sm font-bold font-mono-nums text-foreground">
                        {formatCurrency(topGoal.targetAmount)}
                      </span>
                      <span className="text-[11px] text-muted-foreground block truncate max-w-[140px]">
                        {topGoal.name}
                      </span>
                    </Link>
                  ) : (
                    <Link to="/app/metas" className="text-sm font-semibold text-primary hover:underline">
                      Cadastrar meta
                    </Link>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-0.5">Dívida Mapeada</span>
                  <span className="text-sm font-bold font-mono-nums text-foreground">
                    {formatCurrency(diagnostic?.currentSituation?.totalDebt ?? 0)}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div {...anim(2)} className="card-solid rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-sm text-foreground">Performance de Caixa</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(145,55%,52%)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receitas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(0,70%,55%)]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastos</span>
                  </div>
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={56}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Valor">
                      <Cell fill="hsl(145, 55%, 52%)" />
                      <Cell fill="hsl(0, 70%, 55%)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>

          <div className="space-y-5">

            <motion.div {...anim(3)} className="card-solid rounded-2xl p-5 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Categorias de Gastos</h3>
              <div className="flex gap-4 items-center">
                <div className="w-[90px] h-[90px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          expensesByCategory.length > 0
                            ? expensesByCategory
                            : [{ categoryName: 'Sem dados', total: 1, color: 'hsl(var(--border))' }]
                        }
                        dataKey="total"
                        cx="50%"
                        cy="50%"
                        innerRadius={24}
                        outerRadius={40}
                        paddingAngle={2}
                      >
                        {(expensesByCategory.length > 0 ? expensesByCategory : [{ color: 'hsl(var(--border))' }]).map((c, i) => (
                          <Cell key={i} fill={c.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  {expensesByCategory.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sem categorias ainda.</p>
                  )}
                  {expensesByCategory.slice(0, 4).map((c) => (
                    <div key={c.categoryId ?? c.categoryName} className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-muted-foreground truncate">{c.categoryName}</span>
                      </div>
                      <span className="text-xs font-semibold font-mono-nums shrink-0">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div {...anim(4)} className="card-solid rounded-2xl p-5 space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Próximas Ações</h3>
              <ol className="space-y-3">
                {displayPriorities.map((text, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <p className="text-xs text-foreground leading-snug">{text}</p>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div {...anim(5)} className="grid grid-cols-2 gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="card-solid flex flex-col items-center justify-center gap-2 p-4 rounded-xl hover:bg-accent transition-all duration-200 group"
                >
                  <item.icon size={18} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}
            </motion.div>

          </div>

        </div>

        {!estimatedFromDiagnostic && (
          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            Dados estimados do diagnóstico inicial: renda, gastos e sobra estão vindo do onboarding até você importar extratos ou registrar movimentações reais.
          </p>
        )}

      </div>

      <footer className="px-6 sm:px-8 py-4 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide">Projeto Clareza · Est 2024</span>
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </footer>
    </div>
  );
};

const KpiItem = ({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-2xl sm:text-3xl font-black font-mono-nums text-foreground leading-none">{value}</span>
    {delta && (
      <span className={`text-xs font-semibold ${positive ? 'text-success' : 'text-destructive'}`}>{delta}</span>
    )}
  </div>
);

export default DashboardPage;
