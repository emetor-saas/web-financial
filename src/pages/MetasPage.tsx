import { motion } from 'framer-motion';
import { formatCurrency, getStatusColor } from '@/utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchGoals, type Goal } from '@/services/goals';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type GoalStatus = 'on-track' | 'warning' | 'behind' | 'completed';

function computeStatus(goal: Goal, progress: number): GoalStatus {
  if (goal.isAchieved || progress >= 100) return 'completed';
  if (progress >= 70) return 'on-track';
  if (progress >= 40) return 'warning';
  return 'behind';
}

const MetasPage = () => {
  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Metas Financeiras</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe seus objetivos e viabilidade real.</p>
      </motion.div>

      <div className="space-y-4">
        {(goals ?? []).map((g, i) => {
          const progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
          const remaining = g.targetAmount - g.currentAmount;
          const monthlyNeeded = g.monthlyContribution ?? 0;
          const status = computeStatus(g, progress);

          const projectionData = Array.from({ length: 7 }, (_, idx) => ({
            month: `M${idx}`,
            otimista: Math.min(g.currentAmount + monthlyNeeded * 1.2 * idx, g.targetAmount),
            realista: Math.min(g.currentAmount + monthlyNeeded * idx, g.targetAmount),
            conservador: Math.min(g.currentAmount + monthlyNeeded * 0.7 * idx, g.targetAmount),
          }));

          return (
            <motion.div key={g.id} {...anim(1 + i)} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      status === 'on-track' || status === 'completed'
                        ? 'bg-success/20'
                        : status === 'warning'
                          ? 'bg-warning/20'
                          : 'bg-destructive/20'
                    }`}
                  >
                    <Target size={18} className={getStatusColor(status)} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">{g.name}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-display font-bold tabular-nums">{formatCurrency(g.targetAmount)}</p>
                  {g.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      Prazo: {new Date(g.targetDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatCurrency(g.currentAmount)} acumulado</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${
                      g.status === 'on-track' || g.status === 'completed' ? 'bg-success' : g.status === 'warning' ? 'bg-warning' : 'bg-destructive'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                <div><span className="text-muted-foreground text-xs">Falta</span><p className="font-semibold tabular-nums">{formatCurrency(remaining)}</p></div>
                <div><span className="text-muted-foreground text-xs">Aporte Necessário</span><p className="font-semibold tabular-nums">{formatCurrency(monthlyNeeded)}/mês</p></div>
                <div>
                  <span className="text-muted-foreground text-xs">Viabilidade</span>
                  <p className={`font-semibold ${getStatusColor(status)}`}>
                    {status === 'on-track' ? 'Viável' : status === 'warning' ? 'Atenção' : status === 'completed' ? 'Concluída' : 'Em Risco'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {status === 'on-track' ? <TrendingUp size={14} className="text-success" /> : <AlertCircle size={14} className="text-warning" />}
                    <span className="text-sm">
                      {status === 'on-track'
                        ? 'No caminho'
                        : status === 'warning'
                          ? 'Requer ajuste'
                          : status === 'completed'
                            ? 'Concluída'
                            : 'Atrasada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Projection chart */}
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(0, 0%, 55%)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8, fontSize: 12 }} itemStyle={{ color: 'hsl(0, 0%, 100%)' }} />
                    <Line type="monotone" dataKey="otimista" stroke="hsl(145, 55%, 65%)" strokeWidth={1.5} dot={false} name="Otimista" />
                    <Line type="monotone" dataKey="realista" stroke="hsl(145, 55%, 58%)" strokeWidth={2} dot={false} name="Realista" />
                    <Line type="monotone" dataKey="conservador" stroke="hsl(0, 0%, 65%)" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="Conservador" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MetasPage;
