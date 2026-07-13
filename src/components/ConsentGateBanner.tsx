import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchConsents, grantConsent } from '@/services/privacy';

const PURPOSE_LABELS: Record<string, string> = {
  ai_chat: 'Chat com IA',
  statement_import: 'Importação de extratos',
  financial_mentoring: 'Mentoria financeira',
};

export function ConsentGateBanner({
  purpose,
  title,
  description,
}: {
  purpose: 'ai_chat' | 'statement_import' | 'financial_mentoring';
  title: string;
  description: string;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['privacy-consents'],
    queryFn: fetchConsents,
  });

  const grantMutation = useMutation({
    mutationFn: () => grantConsent(purpose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
      toast.success('Consentimento registrado. Pode continuar.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = (data?.consents ?? []).some((c) => c.purpose === purpose && !c.revokedAt);
  if (isLoading || active) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Finalidade: {PURPOSE_LABELS[purpose] ?? purpose}. Gerencie também em{' '}
          <Link to="/app/perfil" className="underline underline-offset-2">
            Perfil → Privacidade
          </Link>
          .
        </p>
      </div>
      <button
        type="button"
        className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
        disabled={grantMutation.isPending}
        onClick={() => grantMutation.mutate()}
      >
        {grantMutation.isPending ? 'Salvando…' : 'Autorizar e continuar'}
      </button>
    </div>
  );
}

export function useHasConsent(purpose: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['privacy-consents'],
    queryFn: fetchConsents,
  });
  const active = (data?.consents ?? []).some((c) => c.purpose === purpose && !c.revokedAt);
  return { hasConsent: active, isLoading };
}
