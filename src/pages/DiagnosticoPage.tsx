import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getScoreColor, getScoreLabel } from '@/utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.25 },
});

/** Pilares Clareza: 0–25 cada → exibimos em 0–100 no mapa (×4) para alinhar à legenda */
const PILLAR_KEYS = [
  { key: 'control', short: 'CONTROLE', label: 'Controle do mês' },
  { key: 'resilience', short: 'RESILIÊNCIA', label: 'Resiliência' },
  { key: 'debt', short: 'DÍVIDAS', label: 'Dívida e pressão' },
  { key: 'direction', short: 'DIREÇÃO', label: 'Direção e metas' },
] as const;

function pillarToDisplay(pillar0to25: number): number {
  return Math.round(Math.min(100, Math.max(0, pillar0to25 * 4)));
}

function trendVsAverage(displayScore: number, avg: number): { delta: number; dir: 'up' | 'down' | 'flat' } {
  const d = Math.round(displayScore - avg);
  if (Math.abs(d) < 3) return { delta: 0, dir: 'flat' };
  return { delta: d, dir: d > 0 ? 'up' : 'down' };
}

const LEGEND_RANGES = [
  { range: '0 ~ 49', label: 'Crítico' },
  { range: '50 ~ 69', label: 'Em desenvolvimento' },
  { range: '70 ~ 89', label: 'Bom' },
  { range: '90 ~ 100', label: 'Excelente' },
] as const;

const DiagnosticoPage = () => {
  const { data } = useQuery({
    queryKey: ['diagnostic-current'],
    queryFn: () => apiFetch<any>('/api/diagnostic/current'),
  });

  const auraScore = data?.auraScore?.score ?? 0;
  const isEstimated = data?.auraScore?.isEstimated ?? false;
  const usedOnboarding = data?.missingData?.hasOnboardingSnapshot && data?.missingData?.isFullyEstimated;

  const pillars = data?.auraScore?.pillars ?? {};
  const displayScores = PILLAR_KEYS.map((p) => ({
    ...p,
    raw: Number(pillars[p.key] ?? 0),
    display: pillarToDisplay(Number(pillars[p.key] ?? 0)),
  }));

  const avgDisplay =
    displayScores.length > 0
      ? displayScores.reduce((s, x) => s + x.display, 0) / displayScores.length
      : 0;

  const radarData = displayScores.map((p) => ({
    subject: p.short,
    fullLabel: p.label,
    value: p.display,
    trend: trendVsAverage(p.display, avgDisplay),
  }));

  const historyData = [
    { month: 'Out', score: 55 },
    { month: 'Nov', score: 58 },
    { month: 'Dez', score: 56 },
    { month: 'Jan', score: 60 },
    { month: 'Fev', score: 62 },
    { month: 'Mar', score: auraScore },
  ];

  const dimensions = [
    {
      label: 'Controle do Mês',
      value: pillars.control ?? 0,
      display: pillarToDisplay(pillars.control ?? 0),
      desc: 'Quanto o mês tende a fechar no azul ou no vermelho, considerando renda e gastos médios.',
    },
    {
      label: 'Resiliência e Reserva',
      value: pillars.resilience ?? 0,
      display: pillarToDisplay(pillars.resilience ?? 0),
      desc: 'Quantos meses de fôlego a sua reserva oferece frente às despesas atuais.',
    },
    {
      label: 'Dívida e Pressão',
      value: pillars.debt ?? 0,
      display: pillarToDisplay(pillars.debt ?? 0),
      desc: 'Peso das dívidas sobre a renda e risco de aperto financeiro.',
    },
    {
      label: 'Direção e Metas',
      value: pillars.direction ?? 0,
      display: pillarToDisplay(pillars.direction ?? 0),
      desc: 'Clareza de objetivos e compatibilidade entre metas e realidade atual.',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <motion.div {...anim(0)} className="text-center space-y-3">
        <h1 className="font-display text-3xl font-black tracking-tight">Diagnóstico de Saúde Financeira</h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Sua saúde financeira é medida pelos quatro pilares da Clareza (0–100 cada no mapa). O equilíbrio entre eles define sua resiliência.
        </p>
      </motion.div>

      {/* Score resumo compacto */}
      <motion.div {...anim(1)} className="card-solid rounded-2xl p-6 text-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Score Clareza geral</span>
        <p className={`text-5xl sm:text-6xl font-display font-black tabular-nums mt-1 ${getScoreColor(auraScore)}`}>
          {Math.round(auraScore)}
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          <span className={`font-semibold ${getScoreColor(auraScore)}`}>{getScoreLabel(auraScore)}</span>
        </p>
        {usedOnboarding && (
          <p className="text-[11px] text-amber-400 mt-2 max-w-lg mx-auto">
            Este diagnóstico inicial está baseado principalmente nas respostas do onboarding. Conforme você importar extratos e
            registrar movimentos reais, o score Clareza será refinado automaticamente.
          </p>
        )}
        {isEstimated && !usedOnboarding && (
          <p className="text-[11px] text-amber-400 mt-2">
            Score estimado com dados parciais. Quanto mais dados reais você cadastrar, mais preciso ficará o diagnóstico.
          </p>
        )}
      </motion.div>

      {/* MAPA DE DESEMPENHO — estilo referência */}
      <motion.div
        {...anim(2)}
        className="bg-card rounded-2xl border border-border/80 shadow-lg shadow-black/5 p-6 sm:p-8"
      >
        <h2 className="text-center font-display text-lg sm:text-xl font-bold tracking-wide text-primary mb-6">
          MAPA DE DESEMPENHO CLAREZA
        </h2>

        {/* Legenda em 2 colunas */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-w-md mx-auto mb-8 text-xs sm:text-sm text-muted-foreground">
          {LEGEND_RANGES.map((item) => (
            <div key={item.range} className="flex items-baseline justify-between gap-2 border-b border-border/50 pb-1.5">
              <span className="font-medium tabular-nums text-foreground/80">{item.range}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="h-[min(420px,85vw)] w-full max-w-[420px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="52%" outerRadius="68%" data={radarData}>
              <PolarGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.9}
                radialLines
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <PolarAngleAxis
                dataKey="subject"
                tick={({ payload, x, y, textAnchor }) => {
                  const row = radarData.find((r) => r.subject === payload.value);
                  if (!row) return null;
                  const t = row.trend;
                  const anchor = (textAnchor || 'middle') as 'start' | 'middle' | 'end';
                  const trendColor =
                    t.dir === 'up'
                      ? 'hsl(142 70% 40%)'
                      : t.dir === 'down'
                        ? 'hsl(0 70% 50%)'
                        : 'hsl(var(--muted-foreground))';
                  const trendText =
                    t.dir === 'flat' ? '—' : t.delta > 0 ? `+${t.delta}` : `${t.delta}`;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={-20}
                        textAnchor={anchor}
                        fill="hsl(var(--muted-foreground))"
                        fontSize={9}
                        fontWeight={500}
                        letterSpacing="0.06em"
                      >
                        {row.subject}
                      </text>
                      <text
                        x={0}
                        y={0}
                        dy={-2}
                        textAnchor={anchor}
                        fill="hsl(var(--foreground))"
                        fontSize={18}
                        fontWeight={700}
                      >
                        {row.value}
                      </text>
                      <text x={0} y={0} dy={14} textAnchor={anchor} fill={trendColor} fontSize={10} fontWeight={700}>
                        {trendText}
                      </text>
                    </g>
                  );
                }}
              />
              <Radar
                name="Pilares"
                dataKey="value"
                stroke="hsl(300 65% 55%)"
                strokeWidth={2}
                fill="hsl(280 55% 65%)"
                fillOpacity={0.35}
                dot={{ r: 3, fill: 'hsl(300 65% 50%)', strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4 max-w-md mx-auto">
          Indicadores em escala 0–100 (cada pilar Clareza original 0–25 foi convertido para 0–100). A tendência compara cada pilar à
          média dos quatro pilares.
        </p>
      </motion.div>

      {/* Barras por dimensão */}
      <motion.div {...anim(3)} className="space-y-5">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
          Detalhamento por pilar
        </h3>
        {dimensions.map((d, i) => (
          <div key={d.label} className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="font-semibold text-sm">{d.label}</span>
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                {d.display}/100 <span className="text-[10px] opacity-70">({Math.round(d.value)}/25)</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${d.display}%` }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                className={`h-full rounded-full ${
                  d.display >= 70 ? 'bg-success' : d.display >= 50 ? 'bg-warning' : 'bg-destructive'
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground">{d.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Evolução — só quando houver histórico real no futuro pode substituir */}
      <motion.div {...anim(4)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
        <h3 className="font-display font-semibold mb-2">Evolução do score geral</h3>
        <p className="text-xs text-muted-foreground mb-4">
          A linha do mês atual reflete o score Clareza atual; demais pontos são ilustrativos até termos histórico mensal.
        </p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 18%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(0, 0%, 55%)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(0, 0%, 9%)', border: '1px solid hsl(0, 0%, 18%)', borderRadius: 8 }}
                itemStyle={{ color: 'hsl(0, 0%, 100%)' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(300 65% 55%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(300 65% 55%)', r: 4 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Riscos e prioridades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...anim(5)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold mb-4 text-destructive">Principais Riscos</h3>
          <ul className="space-y-3">
            {data?.mainRisks?.map((r: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive mt-1.5" />
                <p className="text-sm text-foreground">{r}</p>
              </li>
            )) || (
              <p className="text-sm text-muted-foreground">Nenhum risco crítico identificado com os dados atuais.</p>
            )}
          </ul>
        </motion.div>
        <motion.div {...anim(6)} className="card-solid rounded-2xl p-6 hover:border-border transition-all duration-200">
          <h3 className="font-display font-semibold mb-4 text-success">Prioridades Imediatas</h3>
          <ul className="space-y-3">
            {data?.mainPriorities?.map((p: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-success mt-1.5" />
                <p className="text-sm text-foreground">{p}</p>
              </li>
            )) || (
              <p className="text-sm text-muted-foreground">Nenhuma prioridade urgente definida com os dados atuais.</p>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default DiagnosticoPage;
