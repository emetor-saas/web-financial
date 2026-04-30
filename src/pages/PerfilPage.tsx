import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { type ChangeEvent, useEffect, useState } from 'react';
import { User, Bell, Shield, CreditCard, Target, Clock, Camera } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchProfile, patchProfile, uploadProfileAvatar } from '@/services/profile';
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

function maskPhoneBr(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    age: '',
    city: '',
    phone: '',
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      name: profile.name,
      email: profile.email,
      gender: profile.gender ?? '',
      age: profile.age != null ? String(profile.age) : '',
      city: profile.city ?? '',
      phone: profile.phone ?? '',
    });
  }, [profile]);

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
        gender:
          formData.gender === ''
            ? null
            : (formData.gender as 'female' | 'male' | 'non_binary' | 'prefer_not_to_say'),
        age: formData.age.trim() === '' ? null : Number(formData.age),
        city: formData.city.trim() === '' ? null : formData.city.trim(),
        phone: formData.phone.trim() === '' ? null : formData.phone.trim(),
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

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadProfileAvatar(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refreshUser();
      toast.success('Foto de perfil atualizada.');
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Erro ao enviar foto');
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
    if (formData.age.trim() !== '') {
      const age = Number(formData.age);
      if (!Number.isFinite(age) || age < 13 || age > 120) {
        toast.error('Idade deve estar entre 13 e 120 anos.');
        return;
      }
    }
    saveMutation.mutate();
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter até 5MB.');
      return;
    }
    avatarMutation.mutate(file);
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
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={`Foto de ${displayName}`}
              className="w-24 h-24 rounded-full object-cover object-center border-2 border-border shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-3xl font-bold text-primary">
              {displayName.charAt(0)}
            </div>
          )}
          <label
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-90 border-2 border-card"
            title="Enviar nova foto"
          >
            <Camera size={16} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={avatarMutation.isPending}
            />
          </label>
        </div>
        <div>
          <h2 className="font-display font-bold text-xl">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{profile.household.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{planLabel}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
            <span>
              Score Clareza:{' '}
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
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Gênero</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Prefiro não informar</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
              <option value="prefer_not_to_say">Outro / não informar</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Idade</label>
            <input
              type="number"
              min={13}
              max={120}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Cidade</label>
            <input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Celular</label>
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: maskPhoneBr(e.target.value) })}
              placeholder="(11) 99999-9999"
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
