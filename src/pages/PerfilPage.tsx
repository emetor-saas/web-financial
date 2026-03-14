import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { useState } from 'react';
import { User, Bell, Shield, CreditCard, Target, Clock } from 'lucide-react';

const anim = (i: number) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const PerfilPage = () => {
  const { profileType, singleProfile, coupleProfile } = useAuth();
  const isCouple = profileType === 'COUPLE';
  const name = isCouple ? coupleProfile.name : singleProfile.name;
  const income = isCouple ? coupleProfile.metrics.jointIncome : singleProfile.metrics.income;
  const score = isCouple ? coupleProfile.score : singleProfile.score;

  const [formData, setFormData] = useState({
    name: isCouple ? 'Marina Silva' : 'Rafael Martins',
    email: isCouple ? 'marina@email.com' : 'rafael@email.com',
    phone: '(11) 99876-5432',
    notifications: true,
    weeklyReport: true,
    alertThreshold: 'medium',
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <motion.div {...anim(0)}>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Seus dados e preferências.</p>
      </motion.div>

      {/* Profile Card */}
      <motion.div {...anim(1)} className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
          {name.charAt(0)}
        </div>
        <div>
          <h2 className="font-display font-bold text-xl">{name}</h2>
          <p className="text-sm text-muted-foreground">{isCouple ? 'Plano Casal' : 'Plano Individual'}</p>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span>Score: <strong className="text-primary tabular-nums">{score}</strong></span>
            <span>Renda: <strong className="tabular-nums">{formatCurrency(income)}</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div {...anim(2)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><User size={16} /> Dados Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Nome</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">E-mail</label>
            <input
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase">Telefone</label>
            <input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </motion.div>

      {/* Preferences */}
      <motion.div {...anim(3)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><Bell size={16} /> Notificações</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Alertas em tempo real</span>
            <div className={`w-10 h-5 rounded-full transition-colors ${formData.notifications ? 'bg-primary' : 'bg-accent'} relative`}
              onClick={() => setFormData({ ...formData, notifications: !formData.notifications })}>
              <div className={`w-4 h-4 bg-foreground rounded-full absolute top-0.5 transition-all ${formData.notifications ? 'left-5.5 right-0.5' : 'left-0.5'}`}
                style={{ left: formData.notifications ? '22px' : '2px' }} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Relatório semanal</span>
            <div className={`w-10 h-5 rounded-full transition-colors ${formData.weeklyReport ? 'bg-primary' : 'bg-accent'} relative`}
              onClick={() => setFormData({ ...formData, weeklyReport: !formData.weeklyReport })}>
              <div className={`w-4 h-4 bg-foreground rounded-full absolute top-0.5 transition-all`}
                style={{ left: formData.weeklyReport ? '22px' : '2px' }} />
            </div>
          </label>
        </div>
      </motion.div>

      {/* Financial Summary */}
      <motion.div {...anim(4)} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-display font-semibold flex items-center gap-2"><Shield size={16} /> Resumo Financeiro</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2"><CreditCard size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Dívida Total:</span><strong className="tabular-nums">{formatCurrency(isCouple ? coupleProfile.metrics.totalDebt : singleProfile.metrics.totalDebt)}</strong></div>
          <div className="flex items-center gap-2"><Target size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Metas Ativas:</span><strong>{(isCouple ? coupleProfile.goals : singleProfile.goals).length}</strong></div>
          <div className="flex items-center gap-2"><Clock size={14} className="text-muted-foreground" /><span className="text-muted-foreground">Membro desde:</span><strong>Jan 2026</strong></div>
        </div>
      </motion.div>

      <motion.div {...anim(5)} className="flex justify-end">
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
          Salvar Alterações
        </button>
      </motion.div>
    </div>
  );
};

export default PerfilPage;
