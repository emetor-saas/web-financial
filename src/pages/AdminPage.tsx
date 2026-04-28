import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, getScoreColor } from '@/utils/formatters';
import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Ticket, Settings, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchMasterOverview, type MasterTenantRow } from '@/services/masterOverview';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

function newTenantsByMonth(tenants: MasterTenantRow[]) {
  const buckets: { key: string; month: string; users: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    buckets.push({ key, month: label.charAt(0).toUpperCase() + label.slice(1), users: 0 });
  }
  for (const t of tenants) {
    const c = new Date(t.createdAt);
    const key = `${c.getFullYear()}-${c.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.users += 1;
  }
  return buckets.map(({ month, users }) => ({ month, users }));
}

const AdminPage = () => {
  const { profileType, user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users' | 'cohorts' | 'support' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['master-overview'],
    queryFn: fetchMasterOverview,
    enabled: profileType === 'ADMIN',
  });

  const tenants = profileType === 'ADMIN' ? (data?.tenants ?? []) : [];
  const metrics = profileType === 'ADMIN' ? data?.metrics : undefined;
  const operational = profileType === 'ADMIN' ? data?.operational : undefined;

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.planCode.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.isActive) ||
        (statusFilter === 'inactive' && !t.isActive);
      return matchSearch && matchStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const pieData = useMemo(() => {
    const active = metrics?.activeTenants ?? 0;
    const inactive = metrics?.inactiveTenants ?? 0;
    return [
      { name: 'Ativos', value: active, color: 'hsl(145, 55%, 58%)' },
      { name: 'Inativos', value: inactive, color: 'hsl(145, 45%, 45%)' },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  const growthChartData = useMemo(() => newTenantsByMonth(tenants), [tenants]);

  const planDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tenants) {
      map.set(t.planCode, (map.get(t.planCode) || 0) + 1);
    }
    return [...map.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [tenants]);

  const criticalTenants = useMemo(() => tenants.filter((t) => t.healthScore < 40).slice(0, 12), [tenants]);

  const kpis = useMemo(() => {
    if (!metrics) return [];
    return [
      { label: 'Tenants totais', value: String(metrics.tenantsTotal), change: '—', trend: 'up' as const },
      { label: 'MRR (estimado)', value: formatCurrency(metrics.mrr), change: 'Stripe / planos', trend: 'up' as const },
      { label: 'ARR (estimado)', value: formatCurrency(metrics.arr), change: 'MRR × 12', trend: 'up' as const },
      { label: 'Churn (mês)', value: `${metrics.churnRate.toFixed(1)}%`, change: 'Cancelados vs base', trend: metrics.churnRate > 5 ? ('down' as const) : ('up' as const) },
      { label: 'Inadimplentes', value: String(metrics.delinquentTenants), change: 'Assinatura', trend: 'down' as const },
      { label: 'ARPA', value: formatCurrency(metrics.arpa), change: 'MRR / ativos', trend: 'up' as const },
    ];
  }, [metrics]);

  const tabs = [
    { id: 'overview' as const, label: 'Visão geral' },
    { id: 'users' as const, label: 'Tenants' },
    { id: 'cohorts' as const, label: 'Planos' },
    { id: 'support' as const, label: 'Suporte' },
    { id: 'settings' as const, label: 'Configurações' },
  ];

  if (profileType !== 'ADMIN') return <Navigate to="/app/dashboard" replace />;

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-sm text-destructive">
        Não foi possível carregar o painel master. Verifique permissões e sessão.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <motion.div {...anim(0)} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Settings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Admin Master</h1>
          <p className="text-muted-foreground text-sm">
            Painel executivo — {user?.name ?? 'Master'}
          </p>
        </div>
      </motion.div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-5">
                <span className="text-xs font-bold text-muted-foreground uppercase">{kpi.label}</span>
                <p className="text-2xl font-display font-bold mt-1 tabular-nums">{kpi.value}</p>
                <span
                  className={`text-xs flex items-center gap-1 mt-1 ${
                    kpi.trend === 'up' && kpi.label !== 'Churn (mês)' && kpi.label !== 'Inadimplentes'
                      ? 'text-success'
                      : 'text-muted-foreground'
                  }`}
                >
                  <TrendingUp size={12} /> {kpi.change}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div {...anim(7)} className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-premium">
              <h3 className="font-display font-semibold mb-6">Novos tenants por mês (criação)</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthChartData}>
                    <defs>
                      <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(145, 55%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(145, 55%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }}
                      itemStyle={{ color: 'hsl(0, 0%, 100%)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="hsl(145, 55%, 58%)"
                      fillOpacity={1}
                      fill="url(#admGrad)"
                      strokeWidth={2}
                      name="Contas criadas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-semibold mb-4">Ativos vs inativos</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados.</p>
              ) : (
                <>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4}>
                          {pieData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }}
                          itemStyle={{ color: 'hsl(0, 0%, 100%)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-medium tabular-nums">{d.value.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <motion.div {...anim(9)} className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4">Operação (30 dias / mês atual)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg border border-border p-4">
                <p className="text-muted-foreground text-xs uppercase font-bold">Falhas de importação</p>
                <p className="text-2xl font-display font-bold tabular-nums mt-1">{operational?.importFailures30d ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-muted-foreground text-xs uppercase font-bold">Mensagens IA (mês)</p>
                <p className="text-2xl font-display font-bold tabular-nums mt-1">{operational?.aiMessagesMonth ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-muted-foreground text-xs uppercase font-bold">Custo IA USD (mês)</p>
                <p className="text-2xl font-display font-bold tabular-nums mt-1">
                  {(operational?.aiCostMonth ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div {...anim(10)} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-destructive" />
              <h3 className="font-display font-semibold">Tenants com health score baixo</h3>
            </div>
            {criticalTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tenant abaixo de 40 no índice operacional.</p>
            ) : (
              <div className="space-y-2">
                {criticalTenants.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.planCode} — {t.subscriptionStatus}
                      </p>
                    </div>
                    <span className={`text-lg font-display font-bold tabular-nums ${getScoreColor(t.healthScore)}`}>
                      {t.healthScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, id ou plano..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                    statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Nome', 'Plano', 'Health', 'Ativo', 'Assinatura', 'Assentos', 'Último acesso'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 font-medium max-w-[200px] truncate" title={t.name}>
                        {t.name}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{t.planCode}</td>
                      <td className={`py-3 px-4 font-bold tabular-nums ${getScoreColor(t.healthScore)}`}>{t.healthScore}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${t.isActive ? 'text-success' : 'text-warning'}`}>
                          {t.isActive ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{t.subscriptionStatus}</td>
                      <td className="py-3 px-4 tabular-nums">{t.seatUsage}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                        {t.lastActiveAt
                          ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(t.lastActiveAt))
                          : '—'}
                      </td>
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
          <p className="text-sm text-muted-foreground">
            Distribuição de tenants por código de plano (dados reais do banco).
          </p>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Plano (code)', 'Tenants'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planDistribution.map((row) => (
                    <tr key={row.code} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{row.code}</td>
                      <td className="py-3 px-4 tabular-nums">{row.count}</td>
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
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Ticket size={28} className="text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold mb-2">Tickets de suporte</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Ainda não há integração com ferramenta de tickets. Use e-mail ou Slack interno para filas de suporte.
            </p>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <h3 className="font-display font-semibold">Configurações globais</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Planos pagos, webhooks e chaves de API são configurados no backend (variáveis de ambiente) e no Stripe.
              Esta tela lista apenas dados operacionais agregados.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
