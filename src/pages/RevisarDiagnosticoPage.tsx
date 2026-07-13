import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';
import { fetchOnboardingAnswers } from '@/services/actionPlan';

const LABELS: Record<string, string> = {
  rendaLiquida: 'Renda líquida mensal',
  custosFixos: 'Custos fixos',
  categoriaVariavel: 'Gastos variáveis críticos',
  saldoMensal: 'Como o mês fecha',
  situacaoDividas: 'Situação das dívidas',
  dividasEmAtraso: 'Dívidas em atraso',
  reservaEmergencia: 'Reserva de emergência',
  objetivosCurto: 'Objetivos de curto prazo',
  objetivosLongo: 'Objetivos de longo prazo',
  perfilRisco: 'Perfil de risco',
  bombasProgramadas: 'Grandes gastos previstos',
  mapaDividas: 'Mapa de dívidas',
};

export default function RevisarDiagnosticoPage() {
  const { data: answers, isLoading } = useQuery({
    queryKey: ['onboarding-answers-review'],
    queryFn: fetchOnboardingAnswers,
  });

  if (isLoading) {
    return <p className="p-8 text-muted-foreground text-sm">Carregando diagnóstico...</p>;
  }

  if (!answers) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <p className="text-muted-foreground">Você ainda não fez o diagnóstico inicial.</p>
        <Link to="/onboarding" className="text-primary font-semibold text-sm">
          Fazer diagnóstico
        </Link>
      </div>
    );
  }

  const display =
    answers._display && typeof answers._display === 'object'
      ? (answers._display as Record<string, string>)
      : null;

  const entries = display
    ? Object.entries(display).filter(([, v]) => v?.trim())
    : Object.entries(answers).filter(
        ([key, v]) =>
          !key.startsWith('_') &&
          key !== 'version' &&
          v != null &&
          String(v).trim() !== '' &&
          !Array.isArray(v),
      );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Diagnóstico</p>
        <h1 className="font-display text-2xl font-black tracking-tight">O que você nos contou</h1>
        <p className="text-sm text-muted-foreground">
          Esta é uma leitura do seu diagnóstico — sem alterar respostas por engano. Para atualizar, use o botão abaixo.
        </p>
      </motion.header>

      <div className="card-solid rounded-2xl border border-border divide-y divide-border">
        {entries.map(([key, value]) => (
          <div key={key} className="p-4 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {LABELS[key] ?? key}
            </p>
            <p className="text-sm whitespace-pre-wrap">{String(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/diagnostico"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
        >
          <FileText size={14} />
          Ver análise completa
          <ArrowRight size={14} />
        </Link>
        <Link
          to="/onboarding?atualizar=1"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold"
        >
          Atualizar diagnóstico
        </Link>
      </div>
    </div>
  );
}
