import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { listPublicPlans, createCheckout, createBillingPortalSession, syncBillingFromStripe } from '@/services/plans';
import {
  listMasterPlans,
  createMasterPlan,
  updateMasterPlan,
} from '@/services/masterPlans';
import { toast } from 'sonner';
import { CreditCard, Crown, ExternalLink, Loader2, Plus, CheckCircle2 } from 'lucide-react';

function formatPrice(amountInCents: number, currency: string) {
  if (amountInCents === 0) return 'Gratuito';
  return (amountInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

const PlansPage = () => {
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER';
  return isMaster ? <MasterPlansSection /> : <TenantPlansSection />;
};

type BillingPm = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

function formatBillingCardLabel(pm: BillingPm) {
  const brand = pm.brand ? pm.brand.replace(/_/g, ' ') : 'Cartão';
  if (pm.last4) return `${brand} •••• ${pm.last4}`;
  return brand;
}

const TenantPlansSection = () => {
  const { refreshUser, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans-public'],
    queryFn: listPublicPlans,
  });

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (!checkout) return;
    const sessionId = searchParams.get('session_id') || undefined;
    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    next.delete('session_id');
    setSearchParams(next, { replace: true });

    if (checkout === 'success') {
      void (async () => {
        try {
          const sync = await syncBillingFromStripe(sessionId);
          await refreshUser();
          if (sync.synced) {
            toast.success('Assinatura confirmada. Seu acesso foi liberado.');
          } else {
            toast.message(
              'Pagamento recebido. Se o acesso ainda não liberar em instantes, use “Atualizar assinatura” abaixo.',
            );
          }
        } catch (err) {
          await refreshUser();
          toast.message(
            err instanceof Error
              ? err.message
              : 'Pagamento recebido. Atualizando status da assinatura…',
          );
        }
      })();
    } else if (checkout === 'cancel') {
      toast.message('Checkout cancelado. Você pode tentar de novo quando quiser.');
    }
  }, [searchParams, setSearchParams, refreshUser]);

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => createCheckout(priceId),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar checkout.');
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => createBillingPortalSession(),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao abrir o portal de assinatura.');
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncBillingFromStripe(),
    onSuccess: async (sync) => {
      await refreshUser();
      if (sync.synced) {
        toast.success('Assinatura atualizada. Acesso liberado.');
      } else {
        toast.message('Ainda não encontramos assinatura ativa na Stripe para esta conta.');
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar assinatura.');
    },
  });

  const openBillingPortalInNewTab = () => {
    void (async () => {
      // Abrir cedo (gesto do usuário) sem noopener — senão a aba fica em about:blank
      // e o browser devolve null / impede navegar para o Stripe.
      const tab = window.open('about:blank', '_blank');
      try {
        const res = await portalMutation.mutateAsync();
        if (!res.url) {
          tab?.close();
          toast.error('Não foi possível abrir o portal.');
          return;
        }
        if (tab && !tab.closed) {
          tab.location.href = res.url;
          try {
            tab.opener = null;
          } catch {
            /* ignore */
          }
        } else {
          window.location.assign(res.url);
        }
      } catch {
        tab?.close();
      }
    })();
  };

  const openCheckoutInNewTab = (priceId: string) => {
    void (async () => {
      const tab = window.open('about:blank', '_blank');
      try {
        const res = await checkoutMutation.mutateAsync(priceId);
        if (!res.url) {
          tab?.close();
          toast.error('Não foi possível abrir o checkout.');
          return;
        }
        if (tab && !tab.closed) {
          tab.location.href = res.url;
          try {
            tab.opener = null;
          } catch {
            /* ignore */
          }
        } else {
          // Popup bloqueado: mesmo fluxo Stripe na guia atual
          window.location.assign(res.url);
        }
      } catch {
        tab?.close();
      }
    })();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="space-y-2">
        <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
          <CreditCard size={20} />
          Planos e Assinatura
        </h1>
        <p className="text-muted-foreground text-sm">
          Escolha o plano que melhor se encaixa na sua jornada financeira.
        </p>
        <p className="text-xs text-amber-600/90 dark:text-amber-400/90 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2">
          Novos cadastros têm <strong>1 hora</strong> de teste gratuito do app (trial da conta). Planos pagos
          podem incluir dias de trial adicionais no Stripe — veja a descrição de cada plano.
        </p>
        {user?.household?.billingPaymentMethod && (
          <p className="text-xs text-muted-foreground rounded-xl border border-border bg-muted/20 px-3 py-2 flex items-center gap-2">
            <CreditCard size={14} className="text-primary shrink-0" />
            <span>
              Pagamento da assinatura:{' '}
              <strong className="text-foreground">{formatBillingCardLabel(user.household.billingPaymentMethod)}</strong>
              {user.household.billingPaymentMethod.expMonth != null &&
                user.household.billingPaymentMethod.expYear != null && (
                  <>
                    {' '}
                    (validade {String(user.household.billingPaymentMethod.expMonth).padStart(2, '0')}/
                    {user.household.billingPaymentMethod.expYear})
                  </>
                )}
            </span>
          </p>
        )}

        {user?.household?.subscriptionStatus === 'CANCELED' && !user?.billing?.hasPaidSubscription && (
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 space-y-1">
            <h2 className="font-display font-semibold text-sm tracking-tight">Assinatura cancelada</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Não há cobranças futuras. Para voltar a usar o app com plano pago, contrate um plano abaixo.
            </p>
          </div>
        )}

        {user?.billing?.hasPaidSubscription && user?.household?.canceledAt && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 space-y-3">
            <div className="space-y-1">
              <h2 className="font-display font-semibold text-sm tracking-tight">Cancelamento agendado</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sua assinatura foi cancelada na Stripe. O acesso continua até{' '}
                <strong className="text-foreground font-medium">
                  {user.household.nextBillingDate
                    ? new Date(user.household.nextBillingDate).toLocaleDateString('pt-BR')
                    : 'o fim do período já pago'}
                </strong>
                . Não haverá nova cobrança.
              </p>
            </div>
            <button
              type="button"
              disabled={portalMutation.isPending}
              onClick={openBillingPortalInNewTab}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/50 disabled:opacity-60 transition-colors"
            >
              {portalMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin shrink-0" />
                  Abrindo portal...
                </>
              ) : (
                <>
                  <ExternalLink size={14} className="shrink-0" />
                  Gerenciar assinatura (reativar)
                </>
              )}
            </button>
          </div>
        )}

        {user?.billing?.hasPaidSubscription && !user?.household?.canceledAt && (
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-4 space-y-3">
            <div className="space-y-1">
              <h2 className="font-display font-semibold text-sm tracking-tight">Sua assinatura</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pelo portal seguro da Stripe você pode atualizar o cartão, ver faturas e{' '}
                <strong className="text-foreground font-medium">cancelar a assinatura</strong> quando quiser (o
                acesso segue até o fim do período já pago, conforme as regras do seu plano).
              </p>
            </div>
            <button
              type="button"
              disabled={portalMutation.isPending}
              onClick={openBillingPortalInNewTab}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted/50 disabled:opacity-60 transition-colors"
            >
              {portalMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin shrink-0" />
                  Abrindo portal...
                </>
              ) : (
                <>
                  <ExternalLink size={14} className="shrink-0" />
                  Gerenciar ou cancelar assinatura
                </>
              )}
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Status da Stripe e do app desatualizados (pagamento ou cancelamento)? Atualize a assinatura.
          </p>
          <button
            type="button"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 disabled:opacity-60"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin shrink-0" />
                Atualizando...
              </>
            ) : (
              'Atualizar assinatura'
            )}
          </button>
        </div>
      </header>

      {isLoading || !plans ? (
        <p className="text-sm text-muted-foreground">Carregando planos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isFree = plan.amountInCents === 0;
            const hasPaid = Boolean(user?.billing?.hasPaidSubscription);
            const currentPlanCode = user?.household?.planCode?.trim().toLowerCase() || null;
            const paidPlans = plans.filter((p) => p.amountInCents > 0);
            const matchesCode =
              Boolean(currentPlanCode) && plan.code.trim().toLowerCase() === currentPlanCode;
            // Com um único plano pago e assinatura ativa, trata como plano atual mesmo se planCode estiver desatualizado.
            const isCurrentPlan =
              hasPaid &&
              !isFree &&
              (matchesCode || (paidPlans.length === 1 && plan.amountInCents > 0));
            const cancelScheduled = Boolean(user?.household?.canceledAt);

            return (
              <div
                key={plan.id}
                className={`card-solid rounded-2xl p-5 flex flex-col justify-between border transition-all duration-200 ${
                  isCurrentPlan
                    ? 'border-primary/50 ring-1 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-semibold tracking-tight">{plan.name}</h2>
                    {isCurrentPlan ? (
                      <span className="text-[10px] font-semibold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                        Seu plano
                      </span>
                    ) : isFree ? (
                      <span className="text-[10px] font-semibold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Gratuito
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Assinatura
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  )}
                  <p className="text-xl font-display font-bold mt-2">
                    {formatPrice(plan.amountInCents, plan.currency)}
                    {plan.interval === 'month' && (
                      <span className="text-xs text-muted-foreground"> / mês</span>
                    )}
                  </p>
                  {plan.trialDays != null && plan.trialDays > 0 && !isCurrentPlan && (
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                      <Crown size={12} /> {plan.trialDays} dias de teste grátis
                    </p>
                  )}
                </div>
                {isFree ? (
                  <p className="mt-4 text-[11px] text-muted-foreground rounded-xl border border-border bg-muted/30 px-3 py-2">
                    O acesso inicial é o trial de 1 hora. Não há plano gratuito permanente para tenants — escolha
                    um plano pago para continuar após o teste.
                  </p>
                ) : isCurrentPlan ? (
                  <p className="mt-4 text-[11px] text-muted-foreground rounded-xl border border-primary/25 bg-primary/5 px-3 py-2">
                    {cancelScheduled
                      ? 'Este é o seu plano atual (cancelamento já agendado). Use o portal acima para reativar ou gerenciar.'
                      : 'Você já tem este plano ativo. Para trocar de cartão ou cancelar, use o portal da assinatura acima.'}
                  </p>
                ) : hasPaid ? (
                  <p className="mt-4 text-[11px] text-muted-foreground rounded-xl border border-border bg-muted/30 px-3 py-2">
                    Você já possui uma assinatura ativa. Para mudar de plano, use o portal da Stripe acima.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={checkoutMutation.isPending || !plan.stripePriceId}
                    onClick={() => plan.stripePriceId && openCheckoutInNewTab(plan.stripePriceId)}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-primary/90 disabled:opacity-60"
                  >
                    {checkoutMutation.isPending ? 'Redirecionando...' : 'Contratar plano'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MasterPlansSection = () => {
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['master-plans'],
    queryFn: listMasterPlans,
  });

  const createMutation = useMutation({
    mutationFn: createMasterPlan,
    onSuccess: () => {
      toast.success('Plano criado com sucesso.');
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar plano.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateMasterPlan(id, payload),
    onSuccess: () => {
      toast.success('Plano atualizado.');
      refetch();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar plano.');
    },
  });

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editTrialDays, setEditTrialDays] = useState('');
  const [editSortOrder, setEditSortOrder] = useState('');

  const startEdit = (plan: (typeof sortedPlans)[0]) => {
    setEditingId(plan.id);
    setEditName(plan.name);
    setEditDescription(plan.description ?? '');
    setEditPrice(String(plan.amountInCents / 100));
    setEditTrialDays(plan.trialDays != null ? String(plan.trialDays) : '');
    setEditSortOrder(String(plan.sortOrder));
  };

  const saveEdit = (id: string) => {
    const amount = Math.round(Number(editPrice.replace(',', '.')) * 100);
    updateMutation.mutate({
      id,
      payload: {
        name: editName,
        description: editDescription || null,
        amountInCents: Number.isNaN(amount) ? undefined : amount,
        trialDays: editTrialDays ? Number(editTrialDays) : null,
        sortOrder: Number(editSortOrder) || 0,
      },
    });
    setEditingId(null);
  };

  const sortedPlans = useMemo(
    () => (plans ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;
    const amount = Math.round(Number(newPrice.replace(',', '.')) * 100);
    createMutation.mutate({
      code: newCode,
      name: newName,
      description: undefined,
      interval: 'month',
      intervalCount: 1,
      amountInCents: Number.isNaN(amount) ? 0 : amount,
      currency: 'brl',
      sortOrder: (plans?.length ?? 0) + 1,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="space-y-2">
        <h1 className="font-display text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
          <Crown size={20} />
          Gerenciar Planos (Master)
        </h1>
        <p className="text-muted-foreground text-sm">
          Crie e organize os planos de assinatura que os clientes podem contratar.
        </p>
      </header>

      <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
          <Plus size={16} />
          Novo plano
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground uppercase font-semibold">
              Código
            </label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="starter"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              required
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] text-muted-foreground uppercase font-semibold">
              Nome
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Starter"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground uppercase font-semibold">
              Preço (R$ / mês)
            </label>
            <input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/60"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="md:col-span-4 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow hover:bg-primary/90 disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Criando...
              </>
            ) : (
              <>
                <Plus size={14} className="mr-2" />
                Criar plano
              </>
            )}
          </button>
        </form>
      </section>

      <section className="card-solid rounded-2xl p-4 sm:p-6 space-y-3">
        <h2 className="font-display font-semibold tracking-tight flex items-center gap-2">
          <CheckCircle2 size={16} />
          Planos cadastrados
        </h2>
        {isLoading || !sortedPlans.length ? (
          <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {sortedPlans.map((plan) => (
              <div
                key={plan.id}
                className="border border-border rounded-xl px-3 py-3 bg-card space-y-3"
              >
                {editingId === plan.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded-lg border border-border px-2 py-1.5 text-sm" placeholder="Nome" />
                    <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="rounded-lg border border-border px-2 py-1.5 text-sm" placeholder="Preço R$" />
                    <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="md:col-span-2 rounded-lg border border-border px-2 py-1.5 text-sm" placeholder="Descrição" />
                    <input value={editTrialDays} onChange={(e) => setEditTrialDays(e.target.value)} className="rounded-lg border border-border px-2 py-1.5 text-sm" placeholder="Dias de trial" />
                    <input value={editSortOrder} onChange={(e) => setEditSortOrder(e.target.value)} className="rounded-lg border border-border px-2 py-1.5 text-sm" placeholder="Ordem" />
                    <div className="md:col-span-2 flex gap-2">
                      <button type="button" onClick={() => saveEdit(plan.id)} className="text-xs font-semibold text-primary">Salvar</button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-xs text-muted-foreground">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {plan.name}{' '}
                        {!plan.isActive && (
                          <span className="text-[10px] uppercase text-destructive ml-1">inativo</span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {plan.code} • {formatPrice(plan.amountInCents, plan.currency)} /{' '}
                        {plan.interval === 'month' ? 'mês' : plan.interval}
                        {plan.description ? ` — ${plan.description}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button" onClick={() => startEdit(plan)} className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-accent">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            id: plan.id,
                            payload: { isActive: !plan.isActive },
                          })
                        }
                        className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
                      >
                        {plan.isActive ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PlansPage;

