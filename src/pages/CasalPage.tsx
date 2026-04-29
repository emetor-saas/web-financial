import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import { Users, Sparkles, Calendar, Circle, MessageCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchCoupleOverview } from '@/services/couple';
import { fetchDashboardStats } from '@/services/dashboard';
import { fetchGoals } from '@/services/goals';
import { fetchAlerts } from '@/services/alerts';
import { fetchReminders } from '@/services/reminders';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const conversaQuestions = [
  'Estamos de acordo com os gastos deste mês?',
  'Existe algum gasto individual que devemos discutir?',
  'Alguma meta precisa ser reavaliada?',
  'Como nos sentimos em relação ao nosso progresso financeiro?',
  'Há algum desejo ou necessidade que não estamos priorizando?',
];

function reminderDateLabel(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const CasalPage = () => {
  const { user, isAuthenticated, profileType } = useAuth();

  const tenantCount = user?.household?.tenantMemberCount ?? 0;
  const canAccessCasal = profileType !== 'ADMIN' && tenantCount >= 2;

  const { data: couple, isLoading: coupleLoading } = useQuery({
    queryKey: ['couple-overview'],
    queryFn: fetchCoupleOverview,
    enabled: isAuthenticated && canAccessCasal,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', 'casal'],
    queryFn: fetchDashboardStats,
    enabled: isAuthenticated && canAccessCasal,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    enabled: isAuthenticated && canAccessCasal,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: isAuthenticated && canAccessCasal,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders'],
    queryFn: fetchReminders,
    enabled: isAuthenticated && canAccessCasal,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccessCasal) return <Navigate to="/app/dashboard" replace />;

  if (coupleLoading || !couple) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  const memberStats = couple.memberStats ?? [];
  const contribData = memberStats.map((m, i) => ({
    name: m.name,
    value: m.avgMonthlyIncome,
    color: i === 0 ? 'hsl(145, 55%, 58%)' : 'hsl(145, 45%, 45%)',
  }));

  const jointIncome = couple.jointAvgMonthlyIncome > 0 ? couple.jointAvgMonthlyIncome : contribData.reduce((s, d) => s + d.value, 0);

  const categoryRows =
    stats?.expensesByCategory?.map((c) => ({
      name: c.categoryName,
      value: c.total,
      color: c.color || 'hsl(145, 48%, 48%)',
    })) ?? [];

  const upcomingReminders = [...reminders]
    .filter((r) => r.status === 'ACTIVE')
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 6);

  const alignmentLabel =
    couple.alignmentLevel === 'desalinhado'
      ? 'Desalinhado'
      : couple.alignmentLevel === 'fragil'
        ? 'Frágil'
        : couple.alignmentLevel === 'razoavel'
          ? 'Razoável'
          : couple.alignmentLevel === 'bom'
            ? 'Bom'
            : 'Forte';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div {...anim(0)} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Users size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Espaço do Casal</h1>
          <p className="text-muted-foreground text-sm">
            {couple.householdName} — Gestão financeira compartilhada.
          </p>
        </div>
      </motion.div>

      <motion.div {...anim(0.5)} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <BrainCircuit size={18} className="text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Alinhamento financeiro do casal
          </p>
          <p className="text-sm">
            <span className="font-semibold">{alignmentLabel}</span> — {couple.mainTension}
          </p>
          <p className="text-xs text-muted-foreground">
            Próxima decisão em conjunto:{' '}
            <span className="font-medium text-foreground">{couple.mainDecision}</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {memberStats.map((person, i) => (
          <motion.div key={person.userId} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold text-primary">
              {person.name.charAt(0)}
            </div>
            <h3 className="font-display font-semibold">{person.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">Renda atribuída (média 3 meses)</p>
            <p className="text-2xl font-display font-black tabular-nums mt-1 text-foreground">
              {formatCurrency(person.avgMonthlyIncome)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Gastos carteira pessoal (média 3 meses)</p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(person.avgMonthlyPersonalExpenses)}
            </p>
          </motion.div>
        ))}
        <motion.div {...anim(3)} className="bg-card border border-primary/30 rounded-xl p-5 text-center shadow-glow-primary md:col-span-1">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold">Clareza — família</h3>
          <p className={`text-3xl font-display font-black tabular-nums mt-1 ${getScoreColor(couple.jointAuraScore)}`}>
            {couple.jointAuraScore}
          </p>
          <p className="text-xs text-muted-foreground">{getScoreLabel(couple.jointAuraScore)}</p>
          <p className="text-[11px] text-muted-foreground/90 mt-1 leading-snug">
            {couple.jointAuraBand.replaceAll('_', ' ')}
          </p>
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">
              Renda conjunta (média 3 meses):{' '}
              <strong className="text-foreground tabular-nums">{formatCurrency(jointIncome)}</strong>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...anim(4)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Distribuição de renda (estimativa)</h3>
          {contribData.length >= 2 && jointIncome > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contribData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {contribData.map((d, idx) => (
                        <Cell key={d.name} fill={d.color ?? (idx === 0 ? 'hsl(145, 55%, 58%)' : 'hsl(145, 45%, 45%)')} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {contribData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm flex-wrap">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.color ?? (i === 0 ? 'hsl(145, 55%, 58%)' : 'hsl(145, 45%, 45%)') }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(d.value)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round((d.value / jointIncome) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Cadastre entradas classificadas por responsável ou aguarde mais lançamentos para estimar a divisão de
              renda.
            </p>
          )}
        </motion.div>

        <motion.div {...anim(5)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Gastos por categoria (mês atual)</h3>
          {categoryRows.length > 0 ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" horizontal={false} />
                  <XAxis type="number" stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(0, 0%, 55%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(0, 0%, 9%)',
                      border: '1px solid hsl(0, 0%, 18%)',
                      borderRadius: 8,
                    }}
                    itemStyle={{ color: 'hsl(0, 0%, 100%)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Valor">
                    {categoryRows.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem despesas categorizadas no período atual.</p>
          )}
        </motion.div>
      </div>

      <motion.div {...anim(6)} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Metas compartilhadas</h3>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const progress =
                g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
              const tone =
                g.isAchieved ? 'bg-success' : progress >= 70 ? 'bg-success' : progress >= 40 ? 'bg-warning' : 'bg-destructive';
              return (
                <div key={g.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{g.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tone}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-10 text-right">{progress}%</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div {...anim(7)} className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center gap-2 text-primary mb-4">
          <Sparkles size={18} />
          <h3 className="font-display font-semibold">Lembretes e check-ins</h3>
        </div>
        {upcomingReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lembrete ativo. Crie lembretes na área de agenda (API de lembretes) para aparecerem aqui.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map((m) => {
              const topics = m.message
                ? m.message
                    .split('\n')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [];
              return (
                <div key={m.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Calendar size={14} className="text-primary" />
                    <span className="font-semibold text-sm">{m.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{reminderDateLabel(m.dueAt)}</span>
                  </div>
                  {topics.length > 0 ? (
                    <ul className="space-y-1">
                      {topics.map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Circle size={8} className="flex-shrink-0" /> {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sem detalhes adicionais.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-primary" />
          <h3 className="font-display font-semibold">Conversa do mês — perguntas guiadas</h3>
        </div>
        <div className="space-y-3">
          {conversaQuestions.map((q, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
              <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm">{q}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...anim(9)} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-warning" />
          <h3 className="font-display font-semibold">Alertas do assistente</h3>
        </div>
        {!alertsData?.alerts?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
        ) : (
          <ul className="space-y-3">
            {alertsData.alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.type === 'danger' || a.severity === 'critical' || a.severity === 'high'
                      ? 'bg-destructive'
                      : a.type === 'warning' || a.severity === 'medium'
                        ? 'bg-warning'
                        : 'bg-primary'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
};

export default CasalPage;
