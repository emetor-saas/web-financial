import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Zap, BrainCircuit, AlertTriangle, Target, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '@/services/dashboard';
import { apiFetch } from '@/lib/apiClient';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.25 },
});

type DiagnosticPayload = {
  auraScore: {
    score: number;
    band: string;
  };
  mainRisks: string[];
  mainPriorities: string[];
};

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });
  const { data: diagnostic } = useQuery({
    queryKey: ['diagnostic-current-dashboard'],
    queryFn: () => apiFetch<DiagnosticPayload>('/api/diagnostic/current'),
  });

  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const balance = stats?.balance ?? 0;

  const auraScore = diagnostic?.auraScore?.score ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Bem-vindo, {user?.name ?? 'Cliente'}. Aqui está seu resumo financeiro em tempo real.
          </p>
        </div>
        <div className="card-solid px-4 py-2.5 rounded-xl flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risco</span>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-muted-foreground">
              {diagnostic?.auraScore?.band
                ? diagnostic.auraScore.band.replace('_', ' ')
                : 'Aguardando dados financeiros'}
            </span>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div {...anim(0)} className="card-solid rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center hover:border-border transition-all duration-200">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Score Clareza</span>
          <span className={`text-4xl sm:text-5xl font-display font-black font-mono-nums ${getScoreColor(auraScore)}`}>
            {Math.round(auraScore)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">{getScoreLabel(auraScore)}</span>
        </motion.div>
        <StatCard label="Renda Mensal" value={formatCurrency(totalIncome)} trend="" type="up" i={1} />
        <StatCard label="Gastos Totais" value={formatCurrency(totalExpenses)} trend="" type="down" i={2} />
        <StatCard label="Sobra Real" value={formatCurrency(balance)} trend="" type="up" i={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div {...anim(4)} className="lg:col-span-2 card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold tracking-tight mb-6">Fluxo de Caixa</h3>
          <div className="h-[220px] sm:h-[260px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  {
                    label: 'Mês atual',
                    income: totalIncome,
                    expenses: totalExpenses,
                  },
                ]}
              >
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145, 55%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(145, 55%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0, 0%, 100%)' }} />
                <Area type="monotone" dataKey="income" stroke="hsl(145, 55%, 58%)" fillOpacity={1} fill="url(#incGrad)" strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="hsl(0, 70%, 55%)" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Insights Sidebar */}
        <div className="space-y-4">
          <motion.div {...anim(5)} className="bg-primary/10 border border-primary/20 rounded-2xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-200">
            <div className="absolute top-3 right-3 opacity-20 group-hover:scale-105 transition-transform duration-200">
              <BrainCircuit size={40} className="text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-primary mb-3">
                <Zap size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Insight IA</span>
              </div>
              <h4 className="font-display font-bold tracking-tight mb-1">
                {diagnostic?.mainPriorities?.[0] ?? 'Ainda não temos um insight — cadastre suas receitas e despesas.'}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {diagnostic?.summaryExecutive?.[0] ??
                  'Assim que tivermos alguns meses de histórico, o assistente vai interpretar seu fluxo de caixa, dívidas e reservas automaticamente.'}
              </p>
              <Link to="/app/insights" className="text-sm font-semibold text-primary hover:underline transition-opacity duration-200">Ver todos →</Link>
            </div>
          </motion.div>

          <motion.div {...anim(6)} className="card-solid rounded-2xl p-5 hover:border-border transition-all duration-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Próximas Ações</h3>
            <ul className="space-y-3">
              {(diagnostic?.mainPriorities ?? ['Defina um orçamento simples para este mês.', 'Comece registrando suas principais contas fixas.']).map(
                (text, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-primary" />
                  <div>
                    <p className="text-sm font-medium">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Categories + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...anim(7)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold tracking-tight mb-4">Categorias de Gasto</h3>
          <div className="flex gap-6">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.expensesByCategory ?? []}
                    dataKey="total"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {(stats?.expensesByCategory ?? []).map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {(stats?.expensesByCategory ?? []).slice(0, 5).map(c => (
                <div key={c.categoryId ?? c.categoryName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-muted-foreground">{c.categoryName}</span>
                  </div>
                  <span className="font-medium font-mono-nums">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...anim(8)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold tracking-tight mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Diagnóstico', icon: AlertTriangle, path: '/app/diagnostico', color: 'text-primary' },
              { label: 'Metas', icon: Target, path: '/app/metas', color: 'text-success' },
              { label: 'Dívidas', icon: CreditCard, path: '/app/dividas', color: 'text-destructive' },
              { label: 'Insights IA', icon: BrainCircuit, path: '/app/insights', color: 'text-primary' },
            ].map(item => (
              <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 bg-muted/60 border border-border rounded-xl hover:bg-accent hover:border-border transition-all duration-200 group">
                <item.icon size={18} className={item.color} />
                <span className="text-sm font-medium group-hover:text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, type, i }: { label: string; value: string; trend: string; type: 'up' | 'down'; i: number }) => (
  <motion.div {...anim(i)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
    <p className="text-2xl font-display font-bold mt-1.5 font-mono-nums">{value}</p>
    <span className={`text-xs flex items-center gap-1 mt-1.5 font-mono-nums ${type === 'up' ? 'text-success' : 'text-destructive'}`}>
      {type === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {trend} vs mês anterior
    </span>
  </motion.div>
);

export default DashboardPage;
