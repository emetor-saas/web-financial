import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Zap, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const PlanoDeAcaoPage = () => {
  const { data } = useQuery({
    queryKey: ['diagnostic-current'],
    queryFn: () => apiFetch<any>('/api/diagnostic/current'),
  });

  const actions =
    [
      ...(data?.actionPlan?.today ?? []).map((title: string) => ({
        id: `today-${title}`,
        bucket: 'Hoje',
        title,
      })),
      ...(data?.actionPlan?.next7Days ?? []).map((title: string) => ({
        id: `7d-${title}`,
        bucket: 'Próximos 7 dias',
        title,
      })),
      ...(data?.actionPlan?.next30Days ?? []).map((title: string) => ({
        id: `30d-${title}`,
        bucket: 'Próximos 30 dias',
        title,
      })),
      ...(data?.actionPlan?.next90Days ?? []).map((title: string) => ({
        id: `90d-${title}`,
        bucket: 'Próximos 90 dias',
        title,
      })),
    ] as { id: string; bucket: string; title: string }[];

  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'today' | '7d' | '30d' | '90d'>('all');

  const toggleAction = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered =
    filter === 'all'
      ? actions
      : actions.filter(a =>
          filter === 'today'
            ? a.bucket === 'Hoje'
            : filter === '7d'
              ? a.bucket === 'Próximos 7 dias'
              : filter === '30d'
                ? a.bucket === 'Próximos 30 dias'
                : a.bucket === 'Próximos 90 dias',
        );

  const completedCount = actions.filter(a => completedIds.has(a.id)).length;
  const progress = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Plano de Ação — 30 Dias</h1>
        <p className="text-muted-foreground text-sm mt-1">Ações priorizadas para melhorar sua saúde financeira.</p>
      </motion.div>

      {/* Progress */}
      <motion.div {...anim(1)} className="bg-card border border-border rounded-xl p-6 shadow-premium">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold">Progresso Geral</span>
          <span className="text-2xl font-display font-bold text-primary tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{completedCount} de {actions.length} ações concluídas</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'today', '7d', '30d', '90d'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all'
              ? 'Todas'
              : f === 'today'
                ? 'Hoje'
                : f === '7d'
                  ? 'Próx. 7 dias'
                  : f === '30d'
                    ? 'Próx. 30 dias'
                    : 'Próx. 90 dias'}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {filtered.map((action, i) => (
          <motion.div
            key={action.id}
            {...anim(2 + i)}
            className={`bg-card border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 ${
              completedIds.has(action.id) ? 'border-border/50 opacity-60' : 'border-border'
            }`}
          >
            <div className="flex items-start gap-4">
              <button onClick={() => toggleAction(action.id)} className="mt-0.5 flex-shrink-0">
                {completedIds.has(action.id)
                  ? <CheckCircle2 size={20} className="text-success" />
                  : <Circle size={20} className="text-muted-foreground hover:text-primary transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className={`font-semibold text-sm ${completedIds.has(action.id) ? 'line-through' : ''}`}>{action.title}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded border bg-accent text-muted-foreground">
                    {action.bucket}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Ação sugerida automaticamente com base no seu diagnóstico.
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap size={12} className="text-primary" /> Diagnóstico</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {action.bucket}</span>
                  <span className="flex items-center gap-1"><ArrowUp size={12} /> Impacto alto</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlanoDeAcaoPage;
