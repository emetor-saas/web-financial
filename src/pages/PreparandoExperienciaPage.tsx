import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiClient';

const PreparandoExperienciaPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const warmup = async () => {
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['diagnostic-current-dashboard'],
          queryFn: () => apiFetch('/api/diagnostic/current'),
        }),
        queryClient.prefetchQuery({
          queryKey: ['diagnostic-current'],
          queryFn: () => apiFetch('/api/diagnostic/current'),
        }),
        queryClient.prefetchQuery({
          queryKey: ['dashboard-stats'],
          queryFn: () => apiFetch('/api/dashboard/stats'),
        }),
        queryClient.prefetchQuery({
          queryKey: ['journey-current'],
          queryFn: () => apiFetch('/api/journey/current'),
        }),
      ]);

      // Mantem breve espera para comunicar progresso ao usuario.
      await new Promise((resolve) => setTimeout(resolve, 2600));
      if (!active) return;
      navigate('/app/jornada', { replace: true });
    };

    void warmup();
    return () => {
      active = false;
    };
  }, [navigate, queryClient]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-solid rounded-3xl border border-border p-8 sm:p-10 max-w-2xl w-full text-center space-y-4"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          Estamos preparando sua experiência
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Estamos analisando sua saúde financeira para personalizar seu diagnóstico, prioridades e plano de ação.
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-primary font-medium">
          <Loader2 size={16} className="animate-spin" />
          Pensando na melhor estratégia para você...
        </div>
      </motion.div>
    </div>
  );
};

export default PreparandoExperienciaPage;
