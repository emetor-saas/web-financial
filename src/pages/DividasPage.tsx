import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingDown, Shield } from 'lucide-react';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const DividasPage = () => {
  const { profileType, singleProfile, coupleProfile } = useAuth();
  const debts = profileType === 'COUPLE' ? coupleProfile.debts : singleProfile.debts;
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const totalSaving = debts.reduce((s, d) => s + d.potentialSaving, 0);

  const chartData = debts.map(d => ({ name: d.name, saldo: d.balance, juros: d.interestRate }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Mapa de Dívidas</h1>
        <p className="text-muted-foreground text-sm mt-1">Análise detalhada e estratégia de quitação.</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div {...anim(1)} className="bg-card border border-border rounded-xl p-5 text-center">
          <AlertTriangle size={20} className="text-destructive mx-auto mb-2" />
          <span className="text-xs text-muted-foreground font-bold uppercase">Dívida Total</span>
          <p className="text-2xl font-display font-bold text-destructive tabular-nums">{formatCurrency(totalDebt)}</p>
        </motion.div>
        <motion.div {...anim(2)} className="bg-card border border-border rounded-xl p-5 text-center">
          <TrendingDown size={20} className="text-warning mx-auto mb-2" />
          <span className="text-xs text-muted-foreground font-bold uppercase">Impacto Mensal</span>
          <p className="text-2xl font-display font-bold text-warning tabular-nums">{formatCurrency(totalMonthly)}</p>
        </motion.div>
        <motion.div {...anim(3)} className="bg-card border border-border rounded-xl p-5 text-center">
          <Shield size={20} className="text-success mx-auto mb-2" />
          <span className="text-xs text-muted-foreground font-bold uppercase">Economia Potencial</span>
          <p className="text-2xl font-display font-bold text-success tabular-nums">{formatCurrency(totalSaving)}</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div {...anim(4)} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-semibold mb-6">Comparativo de Saldo</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0, 0%, 100%)' }} />
              <Bar dataKey="saldo" radius={[6, 6, 0, 0]} name="Saldo">
                {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? 'hsl(0, 70%, 55%)' : 'hsl(145, 55%, 58%)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Debt Cards */}
      <div className="space-y-4">
        <h3 className="font-display font-semibold">Ordem de Ataque Recomendada</h3>
        {debts.sort((a, b) => a.attackOrder - b.attackOrder).map((d, i) => (
          <motion.div key={d.id} {...anim(5 + i)} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-destructive/20 text-destructive text-xs font-bold rounded flex items-center justify-center">#{d.attackOrder}</span>
                  <h4 className="font-semibold">{d.name}</h4>
                </div>
                <span className="text-xs text-muted-foreground">{d.type}</span>
              </div>
              <span className="text-xl font-display font-bold text-destructive tabular-nums">{formatCurrency(d.balance)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground text-xs">Parcela</span><p className="font-semibold tabular-nums">{formatCurrency(d.monthlyPayment)}</p></div>
              <div><span className="text-muted-foreground text-xs">Juros</span><p className="font-semibold tabular-nums">{d.interestRate}% a.m.</p></div>
              <div><span className="text-muted-foreground text-xs">Impacto Mensal</span><p className="font-semibold tabular-nums">{formatCurrency(d.monthlyImpact)}</p></div>
              <div><span className="text-muted-foreground text-xs">Economia se Quitar</span><p className="font-semibold text-success tabular-nums">{formatCurrency(d.potentialSaving)}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Strategy */}
      <motion.div {...anim(8)} className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <h3 className="font-display font-semibold text-primary mb-2">Estratégia Recomendada</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Priorize a quitação da dívida com maior taxa de juros primeiro (método avalanche). 
          Concentre aportes extras no Cartão Nubank para eliminar os 14,5% a.m. de juros. 
          Após quitá-lo, redirecione o valor da parcela para o empréstimo pessoal.
        </p>
      </motion.div>
    </div>
  );
};

export default DividasPage;
