import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, getScoreColor, getScoreLabel } from '@/utils/formatters';
import { Users, BrainCircuit, Calendar, CheckCircle2, Circle, MessageCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchCoupleOverview } from '@/services/couple';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const CasalPage = () => {
  const { profileType, coupleProfile: p } = useAuth();
  const { data: couple } = useQuery({
    queryKey: ['couple-overview'],
    queryFn: fetchCoupleOverview,
    enabled: profileType === 'COUPLE',
  });

  if (profileType !== 'COUPLE') return <Navigate to="/app/dashboard" replace />;

  const contribData = [
    { name: p.p1.name, value: p.p1.income },
    { name: p.p2.name, value: p.p2.income },
  ];

  const conversaQuestions = [
    'Estamos de acordo com os gastos deste mês?',
    'Existe algum gasto individual que devemos discutir?',
    'Alguma meta precisa ser reavaliada?',
    'Como nos sentimos em relação ao nosso progresso financeiro?',
    'Há algum desejo ou necessidade que não estamos priorizando?',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div {...anim(0)} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Users size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Espaço do Casal</h1>
          <p className="text-muted-foreground text-sm">{p.name} — Gestão financeira compartilhada.</p>
        </div>
      </motion.div>

      {/* Diagnóstico de alinhamento do casal */}
      {couple && (
        <motion.div {...anim(0.5)} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={18} className="text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Alinhamento financeiro do casal
            </p>
            <p className="text-sm">
              <span className="font-semibold">
                {couple.alignmentLevel === 'desalinhado'
                  ? 'Desalinhado'
                  : couple.alignmentLevel === 'fragil'
                    ? 'Frágil'
                    : couple.alignmentLevel === 'razoavel'
                      ? 'Razoável'
                      : couple.alignmentLevel === 'bom'
                        ? 'Bom'
                        : 'Forte'}
              </span>{' '}
              — {couple.mainTension}
            </p>
            <p className="text-xs text-muted-foreground">
              Próxima decisão em conjunto:{' '}
              <span className="font-medium text-foreground">{couple.mainDecision}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Scores Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[p.p1, p.p2].map((person, i) => (
          <motion.div key={person.name} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold text-primary">
              {person.name.charAt(0)}
            </div>
            <h3 className="font-display font-semibold">{person.name}</h3>
            <p className={`text-3xl font-display font-black tabular-nums mt-1 ${getScoreColor(person.score)}`}>{person.score}</p>
            <p className="text-xs text-muted-foreground">{getScoreLabel(person.score)}</p>
            <div className="mt-3 text-sm">
              <p className="text-muted-foreground">Renda: <strong className="text-foreground tabular-nums">{formatCurrency(person.income)}</strong></p>
              <p className="text-muted-foreground">Gastos Pessoais: <strong className="text-foreground tabular-nums">{formatCurrency(person.personalExpenses)}</strong></p>
            </div>
          </motion.div>
        ))}
        <motion.div {...anim(3)} className="bg-card border border-primary/30 rounded-xl p-5 text-center shadow-glow-primary">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users size={20} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold">Score Conjunto</h3>
          <p className={`text-3xl font-display font-black tabular-nums mt-1 ${getScoreColor(p.score)}`}>{p.score}</p>
          <p className="text-xs text-muted-foreground">{getScoreLabel(p.score)}</p>
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">Renda Conjunta: <strong className="text-foreground tabular-nums">{formatCurrency(p.metrics.jointIncome)}</strong></p>
          </div>
        </motion.div>
      </div>

      {/* Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div {...anim(4)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Distribuição de Renda</h3>
          <div className="flex items-center gap-6">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contribData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                    <Cell fill="hsl(145, 55%, 58%)" />
                    <Cell fill="hsl(145, 45%, 45%)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {contribData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? 'hsl(145, 55%, 58%)' : 'hsl(145, 45%, 45%)' }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(d.value)}</span>
                  <span className="text-xs text-muted-foreground">({Math.round((d.value / p.metrics.jointIncome) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...anim(5)} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Gastos por Categoria (Conjunto)</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={p.sharedCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(0, 0%, 55%)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0, 0%, 100%)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Valor">
                  {p.sharedCategories.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Shared Goals */}
      <motion.div {...anim(6)} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-semibold mb-4">Metas Compartilhadas</h3>
        <div className="space-y-4">
          {p.goals.map(g => {
            const progress = Math.round((g.current / g.target) * 100);
            return (
              <div key={g.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{g.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(g.current)} / {formatCurrency(g.target)}</span>
                  </div>
                  <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${g.status === 'on-track' ? 'bg-success' : g.status === 'warning' ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums w-10 text-right">{progress}%</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* AI Meeting */}
      <motion.div {...anim(7)} className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center gap-2 text-primary mb-4">
          <BrainCircuit size={18} />
          <h3 className="font-display font-semibold">Reunião Guiada por IA</h3>
        </div>
        <div className="space-y-3 mb-4">
          {p.meetings.filter(m => m.status === 'scheduled').map(m => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-primary" />
                <span className="font-semibold text-sm">{m.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">{m.date}</span>
              </div>
              <ul className="space-y-1">
                {m.topics.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Circle size={8} className="flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Conversa do Mês */}
      <motion.div {...anim(8)} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-primary" />
          <h3 className="font-display font-semibold">Conversa do Mês — Perguntas Guiadas</h3>
        </div>
        <div className="space-y-3">
          {conversaQuestions.map((q, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-accent/50 rounded-lg">
              <span className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm">{q}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alerts */}
      <motion.div {...anim(9)} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-warning" />
          <h3 className="font-display font-semibold">Alertas de Desalinhamento</h3>
        </div>
        <ul className="space-y-3">
          {p.alerts.map(a => (
            <li key={a.id} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'danger' ? 'bg-destructive' : a.type === 'warning' ? 'bg-warning' : 'bg-primary'}`} />
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default CasalPage;
