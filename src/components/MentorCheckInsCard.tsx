import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchCheckIns, respondCheckIn } from '@/services/checkIns';

export function MentorCheckInsCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-check-ins'],
    queryFn: fetchCheckIns,
  });

  const mutation = useMutation({
    mutationFn: respondCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-check-ins'] });
      toast.success('Check-in registrado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (data?.checkIns ?? []).filter((c) => c.status === 'pending');
  if (isLoading) return null;
  if (pending.length === 0) return null;

  return (
    <div className="card-solid rounded-2xl p-4 sm:p-6 space-y-3 border border-primary/20">
      <h3 className="font-display font-semibold">Check-ins da ação (7 dias)</h3>
      <p className="text-sm text-muted-foreground">
        Como foi a ação combinada com o mentor? Isso alimenta a memória longitudinal.
      </p>
      <ul className="space-y-3">
        {pending.map((c) => (
          <li key={c.id} className="border border-border rounded-xl p-3 space-y-2">
            <p className="text-sm font-medium">{c.actionTitle}</p>
            <p className="text-[10px] text-muted-foreground">
              Prazo {new Date(c.dueAt).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ checkInId: c.id, status: 'done' })}
              >
                Concluí
              </button>
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ checkInId: c.id, status: 'partial' })}
              >
                Parcial
              </button>
              <button
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ checkInId: c.id, status: 'skipped' })}
              >
                Não fiz
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
