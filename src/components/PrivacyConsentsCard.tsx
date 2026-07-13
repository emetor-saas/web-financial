import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { fetchConsents, grantConsent, revokeConsent } from '@/services/privacy';

const PURPOSES: { id: string; label: string; description: string }[] = [
  {
    id: 'financial_mentoring',
    label: 'Mentoria financeira',
    description: 'Diagnóstico, prioridades e plano de ação.',
  },
  {
    id: 'ai_chat',
    label: 'Chat com IA',
    description: 'Conversas com o mentor Clareza.',
  },
  {
    id: 'statement_import',
    label: 'Importação de extratos',
    description: 'Processamento de OFX/CSV/PDF enviados por você.',
  },
  {
    id: 'open_finance',
    label: 'Open Finance',
    description: 'Conexões via Belvo com consentimento oficial do banco.',
  },
  {
    id: 'analytics_pseudonymized',
    label: 'Analytics pseudonimizados',
    description: 'Melhoria do produto sem identificar você diretamente.',
  },
];

export function PrivacyConsentsCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['privacy-consents'],
    queryFn: fetchConsents,
  });

  const grantMutation = useMutation({
    mutationFn: (purpose: string) => grantConsent(purpose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
      toast.success('Consentimento registrado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeConsent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
      toast.success('Consentimento revogado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const consents = data?.consents ?? [];

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <h3 className="font-display font-semibold flex items-center gap-2">
        <Shield size={16} /> Privacidade e LGPD
      </h3>
      <p className="text-sm text-muted-foreground">
        Você controla as finalidades de tratamento. Política Skill {data?.policyVersion ?? '…'}.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="space-y-3">
          {PURPOSES.map((p) => {
            const active = consents.find((c) => c.purpose === p.id && !c.revokedAt);
            return (
              <li
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between border border-border/70 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                  {active && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Ativo desde {new Date(active.grantedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {active ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-destructive hover:underline"
                    onClick={() => revokeMutation.mutate(active.id)}
                    disabled={revokeMutation.isPending}
                  >
                    Revogar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => grantMutation.mutate(p.id)}
                    disabled={grantMutation.isPending}
                  >
                    Autorizar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
