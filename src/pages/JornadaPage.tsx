import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Sparkles,
  FileUp,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { fetchJourneyCurrent, type JourneyStep, type JourneyStepStatus } from '@/services/journey';
import { getScoreColor, getScoreLabel } from '@/utils/formatters';
import { MonthlyHealthReportDialog } from '@/components/MonthlyHealthReportDialog';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.3 },
});

const STEP_ICONS: Record<string, typeof Sparkles> = {
  diagnostico: Sparkles,
  extrato: FileUp,
  situacao: Activity,
  prioridades: Target,
  acao: Zap,
};

function statusLabel(status: JourneyStepStatus): string {
  if (status === 'completed') return 'Concluído';
  if (status === 'in_progress') return 'Em andamento';
  if (status === 'current') return 'Próximo passo';
  return 'Pendente';
}

function StepCard({ step, index }: { step: JourneyStep; index: number }) {
  const Icon = STEP_ICONS[step.id] ?? Circle;
  const isActive = step.status === 'current' || step.status === 'in_progress';

  return (
    <motion.div
      {...anim(index)}
      className={cn(
        'card-solid rounded-2xl p-4 sm:p-5 border transition-colors',
        isActive ? 'border-primary/40 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            step.status === 'completed' && 'bg-emerald-500/15 text-emerald-600',
            isActive && 'bg-primary/15 text-primary',
            step.status === 'pending' && 'bg-muted text-muted-foreground',
          )}
        >
          {step.status === 'completed' ? (
            <CheckCircle2 size={20} />
          ) : step.status === 'in_progress' ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Icon size={20} />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Passo {step.order}
            </span>
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                step.status === 'completed' && 'bg-emerald-500/15 text-emerald-600',
                isActive && 'bg-primary/15 text-primary',
                step.status === 'pending' && 'bg-muted text-muted-foreground',
              )}
            >
              {statusLabel(step.status)}
            </span>
          </div>

          <h2 className="font-display font-semibold text-lg tracking-tight">{step.title}</h2>
          <p className="text-sm text-muted-foreground">{step.description}</p>

          {step.meta?.pendingJob && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Há um extrato sendo processado. Aguarde ou abra para revisar.
            </p>
          )}

          {step.items && step.items.length > 0 && (
            <ol className="list-decimal list-inside text-sm space-y-1 text-foreground">
              {step.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          )}

          {step.action && (
            <p className="text-sm font-medium text-foreground border-l-2 border-primary pl-3">
              {step.action}
            </p>
          )}

          <Link
            to={step.cta.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-1"
          >
            {step.cta.label}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function JornadaPage() {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['journey-current'],
    queryFn: fetchJourneyCurrent,
  });

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <motion.header {...anim(0)} className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Sua jornada</p>
        <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight">Clareza da sua casa</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{data.headline}</p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">Score</span>
            <span className={cn('text-3xl font-black font-mono', getScoreColor(data.auraScore))}>
              {data.auraScore}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{getScoreLabel(data.auraScore)}</span>
          </div>
          <div className="h-10 w-px bg-border hidden sm:block" />
          <div className="text-xs text-muted-foreground">
            {data.hasImportedTransactions ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Dados dos extratos importados
              </span>
            ) : data.hasOnboarding ? (
              <span>Baseado no diagnóstico. Importe extratos para dados reais</span>
            ) : (
              <span>Comece pelo diagnóstico inicial</span>
            )}
          </div>
        </div>
      </motion.header>

      {data.summaryExecutive.length > 0 && (
        <motion.div {...anim(1)} className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {data.summaryExecutive.join(' ')}
        </motion.div>
      )}

      {(user?.household?.tenantMemberCount ?? 0) < 2 && (
        <motion.div {...anim(1.2)} className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">Gestão em casal</p>
          <p className="text-xs text-muted-foreground mt-1">
            Convide seu parceiro(a) em Perfil → membros para liberar o Espaço Casal com visão compartilhada.
          </p>
          <Link to="/app/perfil" className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2 hover:underline">
            Ir para perfil <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {data.proactiveAlerts.length > 0 && (
        <motion.div {...anim(1.5)} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={16} />
            <h2 className="text-sm font-semibold">Clareza detectou</h2>
          </div>
          <ul className="space-y-2">
            {data.proactiveAlerts.map((alert) => (
              <li key={alert.id} className="text-sm">
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
              </li>
            ))}
          </ul>
          <Link to="/app/insights" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Ver todos os insights
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      <div className="space-y-4">
        {data.steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index + 2} />
        ))}
      </div>

      <motion.div {...anim(7)} className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <FileText size={14} />
          Relatório do mês
        </button>
        <Link
          to="/app/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Ver números do mês
          <ArrowRight size={14} />
        </Link>
        <Link
          to="/app/chat"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90"
        >
          Falar com a Clareza
          <Sparkles size={14} />
        </Link>
      </motion.div>

      <MonthlyHealthReportDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
