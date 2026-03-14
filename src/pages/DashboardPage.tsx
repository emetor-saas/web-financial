import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Zap, BrainCircuit, AlertTriangle, Target, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import { Link } from 'react-router-dom';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.35 } });

const DashboardPage = () => {
  const { profileType, singleProfile, coupleProfile, adminProfile } = useAuth();

  if (profileType === 'ADMIN') return <AdminDashboard />;
  if (profileType === 'COUPLE') return <CoupleDashboard />;
  return <SingleDashboard />;
};

const SingleDashboard = () => {
  const { singleProfile: p } = useAuth();
  const totalExpenses = p.metrics.fixedExpenses + p.metrics.variableExpenses;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Bem-vindo, {p.name}. Aqui está seu resumo financeiro.</p>
        </div>
        <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</span>
          <div className="flex items-center gap-1 text-success text-sm font-bold">
            <TrendingUp size={14} /> +4 pts este mês
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div {...anim(0)} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center shadow-premium">
          <span className="text-xs font-bold text-muted-foreground uppercase mb-2">Health Score</span>
          <span className={`text-5xl font-display font-black tabular-nums ${getScoreColor(p.score)}`}>{p.score}</span>
          <span className="text-xs text-muted-foreground mt-1">{getScoreLabel(p.score)}</span>
        </motion.div>
        <StatCard label="Renda Mensal" value={formatCurrency(p.metrics.income)} trend="+5%" type="up" i={1} />
        <StatCard label="Gastos Totais" value={formatCurrency(totalExpenses)} trend="-2%" type="down" i={2} />
        <StatCard label="Sobra Real" value={formatCurrency(p.metrics.savings)} trend="+12%" type="up" i={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div {...anim(4)} className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-premium">
          <h3 className="font-display font-semibold mb-6">Fluxo de Caixa</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p.monthlyData}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3952" vertical={false} />
                <XAxis dataKey="month" stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                <Area type="monotone" dataKey="income" stroke="#25D366" fillOpacity={1} fill="url(#incGrad)" strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="#FF6B6B" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Insights Sidebar */}
        <div className="space-y-4">
          <motion.div {...anim(5)} className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute top-3 right-3 opacity-20 group-hover:scale-110 transition-transform">
              <BrainCircuit size={40} className="text-secondary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-secondary mb-3">
                <Zap size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Insight IA</span>
              </div>
              <h4 className="font-display font-bold mb-1">{p.insights[0].title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.insights[0].text}</p>
              <Link to="/app/insights" className="text-sm font-semibold text-secondary hover:underline">Ver todos →</Link>
            </div>
          </motion.div>

          <motion.div {...anim(6)} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Próximas Ações</h3>
            <ul className="space-y-3">
              {p.alerts.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'warning' ? 'bg-warning' : a.type === 'danger' ? 'bg-destructive' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Categories + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...anim(7)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Categorias de Gasto</h3>
          <div className="flex gap-6">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={p.categories} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {p.categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {p.categories.slice(0, 5).map(c => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-muted-foreground">{c.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{formatCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Diagnóstico', icon: AlertTriangle, path: '/app/diagnostico', color: 'text-secondary' },
              { label: 'Metas', icon: Target, path: '/app/metas', color: 'text-success' },
              { label: 'Dívidas', icon: CreditCard, path: '/app/dividas', color: 'text-destructive' },
              { label: 'Insights IA', icon: BrainCircuit, path: '/app/insights', color: 'text-secondary' },
            ].map(item => (
              <Link key={item.path} to={item.path} className="flex items-center gap-3 p-3 bg-accent rounded-lg hover:bg-muted transition-colors group">
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

const CoupleDashboard = () => {
  const { coupleProfile: p } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Dashboard do Casal</h1>
        <p className="text-muted-foreground text-sm">{p.name} — Visão conjunta da saúde financeira.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div {...anim(0)} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center shadow-premium">
          <span className="text-xs font-bold text-muted-foreground uppercase mb-2">Score Conjunto</span>
          <span className={`text-5xl font-display font-black tabular-nums ${getScoreColor(p.score)}`}>{p.score}</span>
          <span className="text-xs text-muted-foreground mt-1">{getScoreLabel(p.score)}</span>
        </motion.div>
        <StatCard label="Renda Conjunta" value={formatCurrency(p.metrics.jointIncome)} trend="+3%" type="up" i={1} />
        <StatCard label="Gastos Totais" value={formatCurrency(p.metrics.jointFixed + p.metrics.jointVariable)} trend="-4%" type="down" i={2} />
        <StatCard label="Sobra Conjunta" value={formatCurrency(p.metrics.jointSavings)} trend="+15%" type="up" i={3} />
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[p.p1, p.p2].map((person, i) => (
          <motion.div key={person.name} {...anim(4 + i)} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold">{person.name}</h3>
              <span className={`text-2xl font-display font-black tabular-nums ${getScoreColor(person.score)}`}>{person.score}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Renda</span><p className="font-semibold tabular-nums">{formatCurrency(person.income)}</p></div>
              <div><span className="text-muted-foreground">Gastos Pessoais</span><p className="font-semibold tabular-nums">{formatCurrency(person.personalExpenses)}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...anim(6)} className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-premium">
          <h3 className="font-display font-semibold mb-6">Evolução Mensal</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p.monthlyData}>
                <defs>
                  <linearGradient id="incGradC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3952" vertical={false} />
                <XAxis dataKey="month" stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                <Area type="monotone" dataKey="income" stroke="#25D366" fillOpacity={1} fill="url(#incGradC)" strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="expenses" stroke="#FF6B6B" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Gastos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div {...anim(7)} className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Alertas</h3>
            <ul className="space-y-3">
              {p.alerts.map(a => (
                <li key={a.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'warning' ? 'bg-warning' : a.type === 'danger' ? 'bg-destructive' : 'bg-primary'}`} />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...anim(8)} className="bg-secondary/10 border border-secondary/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <Zap size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Insight IA</span>
            </div>
            <h4 className="font-display font-bold text-sm mb-1">{p.insights[0].title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.insights[0].text}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { adminProfile: p } = useAuth();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Visão geral do produto e base de usuários.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {p.kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...anim(i)} className="bg-card border border-border rounded-xl p-5">
            <span className="text-xs font-bold text-muted-foreground uppercase">{kpi.label}</span>
            <p className="text-2xl font-display font-bold mt-1 tabular-nums">{kpi.value}</p>
            <span className={`text-xs flex items-center gap-1 mt-1 ${kpi.trend === 'up' ? 'text-success' : kpi.trend === 'down' && kpi.label === 'Churn Mensal' ? 'text-success' : 'text-destructive'}`}>
              {kpi.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {kpi.change}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div {...anim(6)} className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-premium">
          <h3 className="font-display font-semibold mb-6">Crescimento</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={p.growthData}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B3952" vertical={false} />
                <XAxis dataKey="month" stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                <Area type="monotone" dataKey="users" stroke="#25D366" fillOpacity={1} fill="url(#usersGrad)" strokeWidth={2} name="Usuários" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div {...anim(7)} className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-display font-semibold mb-4">Planos</h3>
          <div className="space-y-3">
            {p.plans.map(plan => (
              <div key={plan.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{plan.name}</span>
                  <span className="font-medium tabular-nums">{plan.users}</span>
                </div>
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${plan.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Users Table */}
      <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Usuários Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase">Nome</th>
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase">Tipo</th>
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase">Score</th>
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase">Status</th>
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase">Plano</th>
                <th className="text-left py-3 px-2 text-xs text-muted-foreground font-semibold uppercase hidden md:table-cell">Último Acesso</th>
              </tr>
            </thead>
            <tbody>
              {p.users.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-2 font-medium">{u.name}</td>
                  <td className="py-3 px-2"><span className="text-xs bg-accent px-2 py-0.5 rounded">{u.type === 'COUPLE' ? 'Casal' : 'Solteiro'}</span></td>
                  <td className={`py-3 px-2 font-bold tabular-nums ${getScoreColor(u.score)}`}>{u.score}</td>
                  <td className="py-3 px-2"><span className={`text-xs font-medium ${u.status === 'active' ? 'text-success' : u.status === 'inactive' ? 'text-warning' : 'text-destructive'}`}>{u.status === 'active' ? 'Ativo' : u.status === 'inactive' ? 'Inativo' : 'Churned'}</span></td>
                  <td className="py-3 px-2">{u.plan}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{u.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ label, value, trend, type, i }: { label: string; value: string; trend: string; type: 'up' | 'down'; i: number }) => (
  <motion.div {...anim(i)} className="bg-card border border-border rounded-xl p-5">
    <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
    <p className="text-2xl font-display font-bold mt-1 tabular-nums">{value}</p>
    <span className={`text-xs flex items-center gap-1 mt-1 ${type === 'up' ? 'text-success' : 'text-destructive'}`}>
      {type === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {trend} vs mês anterior
    </span>
  </motion.div>
);

export default DashboardPage;
