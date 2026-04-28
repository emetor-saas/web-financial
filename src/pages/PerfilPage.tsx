import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { useEffect, useState } from 'react';
import { User, Bell, Shield, CreditCard, Target, Clock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchProfile, patchProfile } from '@/services/profile';
import { fetchHouseholdUsers } from '@/services/householdUsers';
import { fetchGoals } from '@/services/goals';
import { apiFetch } from '@/lib/apiClient';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type PerfilDiagnostic = {
  auraScore: { score: number; band: string };
  currentSituation: {
    avgIncome: number;
    totalDebt: number;
    goalsCount: number;
  };
};

function formatMemberSince(iso: string): string {
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PerfilPage = () => {
  const { isAuthenticated, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  const { data: diagnostic } = useQuery({
    queryKey: ['diagnostic-current-perfil'],
    queryFn: () => apiFetch<PerfilDiagnostic>('/api/diagnostic/current'),
    enabled: isAuthenticated,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    enabled: isAuthenticated,
  });

  const { data: householdUsers = [] } = useQuery({
    queryKey: ['household-users'],
    queryFn: fetchHouseholdUsers,
    enabled: isAuthenticated,
  });

  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    if (!profile) return;
    setFormData({ name: profile.name, email: profile.email });
  }, [profile?.id, profile?.name, profile?.email]);

  const tenantMembers = householdUsers.filter((u) => u.role !== 'MASTER');
  const isSharedAccount = tenantMembers.length >= 2;

  const score = diagnostic?.auraScore?.score != null ? Math.round(diagnostic.auraScore.score) : null;
  const avgIncome = diagnostic?.currentSituation?.avgIncome ?? 0;
  const totalDebt = diagnostic?.currentSituation?.totalDebt ?? 0;
  const activeGoalsCount = goals.filter((g) => !g.isAchieved).length;

  const saveMutation = useMutation({
    mutationFn: () =>
      patchProfile({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refreshUser();
      toast.success('Perfil atualizado.');
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar perfil');
    },
  });

  const handleSave = () => {
    if (formData.name.trim().length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('E-mail inválido.');
      return;
    }
    saveMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Faça login para ver seu perfil.
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-sm text-destructive">
        Não foi possível carregar seu perfil. Tente novamente mais tarde.
      </div>
    );
  }

  const displayName = profile.name;
  const planLabel = isSharedAccount ? 'Conta compartilhada' : 'Conta individual';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Seus dados e preferências.</p>
      </motion.div>

      <motion.div {...anim(1)} className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
          {displayName.charAt(0)}
        </div>
        <div>
          <h2 className="font-display font-bold text-xl">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{profile.household.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{planLabel}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
            <span>
              Score:{' '}
              <strong className="text-primary tabular-nums">
                {score != null ? score : '—'}
              </strong>
            </span>
            <span>
              Renda média:{' '}
              <strong className="tabular-nums">{formatCurrency(avgIncome)}</strong>
              <span className="text-muted-foreground text-xs font-normal"> (últimos 3 meses)</span>
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div {...anim(2)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <User size={16} /> Dados pessoais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Nome</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </motion.div>

      <motion.div {...anim(3)} className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Bell size={16} /> Notificações
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Alertas in-app e lembretes passam a aparecer no sino do topo quando forem gerados pelo sistema. Preferências
          granulares (e-mail, relatórios) serão configuráveis aqui em uma próxima versão.
        </p>
      </motion.div>

      <motion.div {...anim(4)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Shield size={16} /> Resumo financeiro
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Dívida total:</span>
            <strong className="tabular-nums">{formatCurrency(totalDebt)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Metas ativas:</span>
            <strong>{activeGoalsCount}</strong>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Clock size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Membro desde:</span>
            <strong>{formatMemberSince(profile.createdAt)}</strong>
          </div>
        </div>
      </motion.div>

      <motion.div {...anim(5)} className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </motion.div>
    </div>
  );
};

export default PerfilPage;
