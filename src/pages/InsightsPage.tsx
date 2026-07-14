import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Zap,
  TrendingUp,
  AlertTriangle,
  Eye,
  BarChart3,
  Clock,
  Target,
  ArrowRight,
} from 'lucide-react';
import { getSeverityColor } from '@/utils/formatters';
import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '@/services/alerts';
import { apiFetch } from '@/lib/apiClient';
import { buildClientNarrative } from '@/lib/clientNarrative';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.25 },
});

const categoryIcons: Record<string, typeof Zap> = {
  economy: Zap,
  risk: AlertTriangle,
  behavior: Eye,
  trend: TrendingUp,
  forecast: BarChart3,
  goal: Target,
  diagnosis: BrainCircuit,
};

const categoryLabels: Record<string, string> = {
  economy: 'Economia',
  risk: 'Risco',
  behavior: 'Comportamento',
  trend: 'Tendência',
  forecast: 'Previsão',
  goal: 'Metas',
  diagnosis: 'Diagnóstico',
};

const timeLabels: Record<string, string> = {
  '7d': '7 dias',
  '15d': '15 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};

type InsightCard = {
  id: string;
  title: string;
  text: string;
  severity: string;
  category: string;
  impact: string;
  timeframe: string;
  action: string;
};

type SkillDiagnosis = {
  state?: { code?: string; label_pt?: string };
  priority?: {
    title?: string;
    reason?: string;
    time_horizon?: string;
  };
  findings?: Array<{
    type?: string;
    statement?: string;
    client_relevance?: string;
    confidence?: number;
  }>;
  escalation_flags?: string[];
};

const InsightsPage = () => {
  const { data } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
  });
  const { data: diagnostic } = useQuery({
    queryKey: ['diagnostic-current-insights'],
    queryFn: () => apiFetch<any>('/api/diagnostic/current'),
  });

  const skill = diagnostic?.skillDiagnosis as SkillDiagnosis | null | undefined;
  const narrative = buildClientNarrative(diagnostic ?? {}, 'insights');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const insights: InsightCard[] = useMemo(() => {
    const cards: InsightCard[] = [];

    if (skill?.priority?.title) {
      cards.push({
        id: 'skill-priority',
        title: skill.priority.title,
        text: skill.priority.reason || narrative.focus,
        severity: skill.escalation_flags?.length ? 'high' : 'medium',
        category: 'diagnosis',
        impact: skill.escalation_flags?.length ? 'Alto' : 'Médio',
        timeframe: skill.priority.time_horizon || '30d',
        action:
          diagnostic?.actionPlan?.today?.[0] ||
          diagnostic?.actionPlan?.next7Days?.[0] ||
          'Transforme esta prioridade em uma ação concreta esta semana.',
      });
    }

    for (const [idx, finding] of (skill?.findings ?? []).entries()) {
      if (!finding.statement) continue;
      const isGoal =
        finding.statement.toLowerCase().includes('meta') ||
        finding.client_relevance?.toLowerCase().includes('meta');
      cards.push({
        id: `finding-${idx}`,
        title:
          finding.type === 'fact'
            ? 'O que os dados mostram'
            : finding.type === 'inference'
              ? 'Leitura do mentor'
              : 'Hipótese a validar',
        text: finding.statement,
        severity: finding.confidence != null && finding.confidence >= 0.85 ? 'medium' : 'low',
        category: isGoal ? 'goal' : 'diagnosis',
        impact: isGoal ? 'Alto' : 'Médio',
        timeframe: '30d',
        action:
          finding.client_relevance ||
          diagnostic?.actionPlan?.next7Days?.[idx] ||
          'Use este achado para ajustar o próximo passo do plano.',
      });
    }

    const alertCards =
      data?.alerts
        .filter((a) => a.id !== 'base-ok')
        .map((a) => ({
          id: a.id,
          title: a.title,
          text: a.description,
          severity:
            a.severity === 'critical'
              ? 'critical'
              : a.severity === 'high'
                ? 'high'
                : a.severity === 'medium'
                  ? 'medium'
                  : 'low',
          category:
            a.category === 'goal'
              ? 'goal'
              : a.type === 'danger'
                ? 'risk'
                : a.type === 'warning'
                  ? 'trend'
                  : 'economy',
          impact:
            a.severity === 'critical' || a.severity === 'high'
              ? 'Alto'
              : a.severity === 'medium'
                ? 'Médio'
                : 'Baixo',
          timeframe: a.horizon === 'short' ? '7d' : a.horizon === 'medium' ? '15d' : '30d',
          action:
            a.category === 'goal'
              ? 'Revise aporte e prazo da meta em risco.'
              : a.horizon === 'short'
                ? 'Reserve alguns minutos ainda hoje para uma decisão pequena e concreta.'
                : 'Ajuste limites e acompanhe nas próximas semanas.',
        })) ?? [];

    cards.push(...alertCards);

    if (cards.length === 0) {
      for (const [idx, title] of (diagnostic?.mainPriorities ?? []).entries()) {
        cards.push({
          id: `diag-${idx}`,
          title,
          text: diagnostic?.summaryExecutive?.[Math.min(idx, 2)] ?? 'Prioridade do diagnóstico atual.',
          severity: idx === 0 ? 'high' : 'medium',
          category: 'behavior',
          impact: idx === 0 ? 'Alto' : 'Médio',
          timeframe: idx === 0 ? '7d' : '30d',
          action:
            diagnostic?.actionPlan?.today?.[idx] ||
            diagnostic?.actionPlan?.next7Days?.[idx] ||
            'Transforme esta recomendação em uma ação objetiva ainda esta semana.',
        });
      }
    }

    // Dedup por título
    const seen = new Set<string>();
    return cards.filter((c) => {
      const key = c.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data?.alerts, diagnostic, narrative.focus, skill]);

  const filtered = activeFilter === 'all' ? insights : insights.filter((i) => i.category === activeFilter);
  const categories = ['all', ...Array.from(new Set(insights.map((i) => i.category)))];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <motion.div {...anim(0)} className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 border border-primary/20 rounded-xl flex items-center justify-center">
          <BrainCircuit size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Central de Insights
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Diagnóstico Skill, achados e alertas operacionais da casa.
          </p>
        </div>
      </motion.div>

      {skill?.state && (
        <motion.div {...anim(0)} className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Estado financeiro
              </p>
              <h2 className="font-display text-lg font-semibold mt-0.5">
                {skill.state.code}: {skill.state.label_pt}
              </h2>
            </div>
            <Link
              to="/app/metas"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Ver metas <ArrowRight size={14} />
            </Link>
          </div>
          {skill.priority?.title && (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Prioridade:</strong> {skill.priority.title}
            </p>
          )}
        </motion.div>
      )}

      <motion.div {...anim(0)} className="card-solid rounded-2xl p-5 space-y-2">
        <h3 className="font-display font-semibold">{narrative.stageTitle}</h3>
        <p className="text-sm text-muted-foreground">
          <strong>Contexto:</strong> {narrative.context}.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Foco agora:</strong> {narrative.focus}.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>Próximo passo:</strong> {narrative.nextStep}.
        </p>
      </motion.div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveFilter(c)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              activeFilter === c
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {c === 'all' ? 'Todos' : categoryLabels[c] || c}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Ainda sem insights suficientes. Complete o diagnóstico ou cadastre uma meta.
          </div>
        )}
        {filtered.map((insight, i) => {
          const Icon = categoryIcons[insight.category] || Zap;
          return (
            <motion.div
              key={insight.id}
              {...anim(1 + i)}
              className={`border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        insight.severity === 'critical' || insight.severity === 'high'
                          ? 'bg-destructive/20 text-destructive'
                          : insight.severity === 'medium'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {insight.severity === 'critical'
                        ? 'Crítico'
                        : insight.severity === 'high'
                          ? 'Alto'
                          : insight.severity === 'medium'
                            ? 'Moderado'
                            : 'Baixo'}
                    </span>
                    {categoryLabels[insight.category] && (
                      <span className="text-xs text-muted-foreground">{categoryLabels[insight.category]}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{insight.text}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Zap size={12} className="text-primary" /> Impacto:{' '}
                      <strong className="text-foreground">{insight.impact}</strong>
                    </span>
                    {insight.timeframe && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {timeLabels[insight.timeframe] || insight.timeframe}
                      </span>
                    )}
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <p className="text-xs text-accent-foreground">
                      <strong>Ação sugerida:</strong> {insight.action}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsPage;
