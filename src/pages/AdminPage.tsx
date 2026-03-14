import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, getScoreColor } from '@/utils/formatters';
import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts';
import { Users, UserCheck, TrendingUp, AlertTriangle, Ticket, Settings, Search } from 'lucide-react';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const AdminPage = () => {
  const { profileType, adminProfile: p } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'cohorts' | 'support' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (profileType !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

  const filteredUsers = p.users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'users', label: 'Usuários' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'support', label: 'Suporte' },
    { id: 'settings', label: 'Configurações' },
  ] as const;

  const pieData = [
    { name: 'Solteiros', value: p.stats.activeSingles, color: '#25D366' },
    { name: 'Casais', value: p.stats.activeCouples, color: '#7C5CFF' },
  ];

  const funnelData = [
    { step: 'Cadastro', value: 12840 },
    { step: 'Ativação', value: 11299 },
    { step: 'Diagnóstico', value: 9758 },
    { step: 'Plano Ativo', value: 8200 },
    { step: 'Retenção 30d', value: 7400 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <motion.div {...anim(0)} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Settings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Admin Master</h1>
          <p className="text-muted-foreground text-sm">Painel executivo — {p.name}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {p.kpis.map((kpi, i) => (
              <motion.div key={kpi.label} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-5">
                <span className="text-xs font-bold text-muted-foreground uppercase">{kpi.label}</span>
                <p className="text-2xl font-display font-bold mt-1 tabular-nums">{kpi.value}</p>
                <span className={`text-xs flex items-center gap-1 mt-1 ${
                  (kpi.trend === 'up' && kpi.label !== 'Churn Mensal') || (kpi.trend === 'down' && kpi.label === 'Churn Mensal')
                    ? 'text-success' : 'text-destructive'
                }`}>
                  <TrendingUp size={12} /> {kpi.change}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Growth Chart */}
            <motion.div {...anim(7)} className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-premium">
              <h3 className="font-display font-semibold mb-6">Crescimento de Usuários</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={p.growthData}>
                    <defs>
                      <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2B3952" vertical={false} />
                    <XAxis dataKey="month" stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7F8AA3" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                    <Area type="monotone" dataKey="users" stroke="#25D366" fillOpacity={1} fill="url(#admGrad)" strokeWidth={2} name="Usuários" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Segmentation */}
            <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold mb-4">Segmentação</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium tabular-nums">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Funnel */}
          <motion.div {...anim(9)} className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-semibold mb-6">Funil de Ativação</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B3952" vertical={false} />
                  <XAxis dataKey="step" stroke="#7F8AA3" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7F8AA3" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#182235', border: '1px solid #2B3952', borderRadius: 8 }} itemStyle={{ color: '#F5F7FB' }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Usuários">
                    {funnelData.map((_, i) => <Cell key={i} fill={`hsl(${145 - i * 15}, 60%, ${50 - i * 5}%)`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Plans */}
          <motion.div {...anim(10)} className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4">Distribuição por Plano</h3>
            <div className="space-y-3">
              {p.plans.map(plan => (
                <div key={plan.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{plan.name}</span>
                    <span className="text-muted-foreground tabular-nums">{plan.users} usuários — {formatCurrency(plan.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${plan.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Critical Users */}
          <motion.div {...anim(11)} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-destructive" />
              <h3 className="font-display font-semibold">Usuários com Score Crítico</h3>
            </div>
            <div className="space-y-2">
              {p.users.filter(u => u.score < 40).map(u => (
                <div key={u.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} — {u.plan}</p>
                  </div>
                  <span className="text-lg font-display font-bold text-destructive tabular-nums">{u.score}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-accent rounded-md px-3 py-2 flex-1">
              <Search size={14} className="text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'inactive', 'churned'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : s === 'inactive' ? 'Inativos' : 'Churned'}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Nome', 'E-mail', 'Tipo', 'Score', 'Status', 'Plano', 'Último Acesso'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4"><span className="text-xs bg-accent px-2 py-0.5 rounded">{u.type === 'COUPLE' ? 'Casal' : 'Solteiro'}</span></td>
                      <td className={`py-3 px-4 font-bold tabular-nums ${getScoreColor(u.score)}`}>{u.score}</td>
                      <td className="py-3 px-4"><span className={`text-xs font-medium ${u.status === 'active' ? 'text-success' : u.status === 'inactive' ? 'text-warning' : 'text-destructive'}`}>{u.status === 'active' ? 'Ativo' : u.status === 'inactive' ? 'Inativo' : 'Churned'}</span></td>
                      <td className="py-3 px-4">{u.plan}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'cohorts' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Período', 'Usuários', 'Retidos', 'Taxa Retenção', 'Score Médio', 'Receita'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.cohorts.map(c => (
                    <tr key={c.period} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{c.period}</td>
                      <td className="py-3 px-4 tabular-nums">{c.users}</td>
                      <td className="py-3 px-4 tabular-nums">{c.retained}</td>
                      <td className="py-3 px-4 tabular-nums text-success">{Math.round((c.retained / c.users) * 100)}%</td>
                      <td className={`py-3 px-4 font-bold tabular-nums ${getScoreColor(c.avgScore)}`}>{c.avgScore}</td>
                      <td className="py-3 px-4 tabular-nums">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'support' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Ticket size={18} className="text-destructive mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Abertos</p>
              <p className="text-2xl font-display font-bold tabular-nums">{p.tickets.filter(t => t.status === 'open').length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <UserCheck size={18} className="text-warning mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Em Progresso</p>
              <p className="text-2xl font-display font-bold tabular-nums">{p.tickets.filter(t => t.status === 'in-progress').length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Users size={18} className="text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Resolvidos</p>
              <p className="text-2xl font-display font-bold tabular-nums">{p.tickets.filter(t => t.status === 'resolved').length}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Usuário', 'Assunto', 'Prioridade', 'Status', 'Data'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.tickets.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">#{t.id}</td>
                    <td className="py-3 px-4 font-medium">{t.user}</td>
                    <td className="py-3 px-4">{t.subject}</td>
                    <td className="py-3 px-4"><span className={`text-xs font-medium ${t.priority === 'high' ? 'text-destructive' : t.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'}`}>{t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa'}</span></td>
                    <td className="py-3 px-4"><span className={`text-xs font-medium ${t.status === 'open' ? 'text-destructive' : t.status === 'in-progress' ? 'text-warning' : 'text-success'}`}>{t.status === 'open' ? 'Aberto' : t.status === 'in-progress' ? 'Em Progresso' : 'Resolvido'}</span></td>
                    <td className="py-3 px-4 text-muted-foreground">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-display font-semibold">Configurações Globais</h3>
            <div className="space-y-3">
              {[
                { label: 'Score mínimo para alerta', value: '40' },
                { label: 'Dias para considerar inativo', value: '14' },
                { label: 'E-mail de notificações admin', value: 'admin@aura.com' },
                { label: 'Frequência de relatórios', value: 'Semanal' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <input value={s.value} readOnly className="bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground w-40 text-right" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
