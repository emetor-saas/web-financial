import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getScoreColor, getScoreLabel } from '@/utils/formatters';

const anim = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04, duration: 0.25 } });

const DiagnosticoPage = () => {
  const { profileType, singleProfile, coupleProfile } = useAuth();
  const isCouple = profileType === 'COUPLE';
  const score = isCouple ? coupleProfile.score : singleProfile.score;
  const diag = singleProfile.diagnostic;

  const radarData = [
    { subject: 'Estabilidade', value: diag.stability },
    { subject: 'Comprometimento', value: diag.commitment },
    { subject: 'Dívidas', value: diag.debtPressure },
    { subject: 'Disciplina', value: diag.discipline },
    { subject: 'Liquidez', value: diag.liquidity },
    { subject: 'Metas', value: diag.alignment },
  ];

  const historyData = [
    { month: 'Out', score: 55 }, { month: 'Nov', score: 58 }, { month: 'Dez', score: 56 },
    { month: 'Jan', score: 60 }, { month: 'Fev', score: 62 }, { month: 'Mar', score: score },
  ];

  const dimensions = [
    { label: 'Estabilidade de Renda', value: diag.stability, desc: 'Renda com baixa volatilidade e previsibilidade adequada.' },
    { label: 'Comprometimento da Renda', value: diag.commitment, desc: 'Proporção da renda comprometida com despesas fixas.' },
    { label: 'Pressão das Dívidas', value: diag.debtPressure, desc: 'Impacto das dívidas ativas no fluxo mensal.' },
    { label: 'Disciplina de Gastos', value: diag.discipline, desc: 'Consistência no controle de gastos variáveis.' },
    { label: 'Segurança de Caixa', value: diag.liquidity, desc: 'Capacidade de cobrir imprevistos com reserva disponível.' },
    { label: 'Alinhamento com Metas', value: diag.alignment, desc: 'Progresso em relação aos objetivos financeiros definidos.' },
  ];

  const strengths = dimensions.filter(d => d.value >= 65);
  const attentions = dimensions.filter(d => d.value < 65);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <motion.div {...anim(0)} className="text-center space-y-3">
        <h1 className="font-display text-3xl font-black tracking-tight">Análise Dimensional</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Sua saúde financeira é medida através de 6 pilares fundamentais. O equilíbrio entre eles determina sua resiliência a longo prazo.
        </p>
      </motion.div>

      {/* Score Hero */}
      <motion.div {...anim(1)} className="card-solid rounded-2xl p-8 text-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Score Geral</span>
        <p className={`text-7xl font-display font-black tabular-nums mt-2 ${getScoreColor(score)}`}>{score}</p>
        <p className="text-muted-foreground text-sm mt-2">Nível: <span className={`font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</span></p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Radar */}
        <motion.div {...anim(2)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold tracking-tight mb-4 text-center">Radar Dimensional</h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="hsl(0, 0%, 18%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 11 }} />
                <Radar dataKey="value" stroke="hsl(145, 55%, 58%)" fill="hsl(145, 55%, 58%)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Dimensions */}
        <motion.div {...anim(3)} className="space-y-5">
          {dimensions.map((d, i) => (
            <div key={d.label} className="space-y-1.5">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-sm">{d.label}</span>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">{d.value}/100</span>
              </div>
              <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.value}%` }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                  className={`h-full rounded-full ${d.value >= 70 ? 'bg-success' : d.value >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                />
              </div>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Score History */}
      <motion.div {...anim(4)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
        <h3 className="font-display font-semibold mb-6">Evolução do Score</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} domain={[40, 100]} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }} itemStyle={{ color: 'hsl(0, 0%, 100%)' }} />
              <Line type="monotone" dataKey="score" stroke="hsl(145, 55%, 58%)" strokeWidth={2} dot={{ fill: 'hsl(145, 55%, 58%)', r: 4 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Strengths & Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...anim(5)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold mb-4 text-success">Pontos Fortes</h3>
          <ul className="space-y-3">
            {strengths.map(s => (
              <li key={s.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
            {strengths.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pilar acima de 65 pontos ainda.</p>}
          </ul>
        </motion.div>
        <motion.div {...anim(6)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold mb-4 text-warning">Pontos de Atenção</h3>
          <ul className="space-y-3">
            {attentions.map(a => (
              <li key={a.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default DiagnosticoPage;
