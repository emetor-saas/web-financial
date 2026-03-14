import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BrainCircuit, User, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ProfileType } from '@/types';

const profiles: { type: ProfileType; label: string; desc: string; icon: typeof User }[] = [
  { type: 'SINGLE', label: 'Solteiro', desc: 'Rafael Martins — 29 anos', icon: User },
  { type: 'COUPLE', label: 'Casal', desc: 'Marina & Lucas', icon: Users },
  { type: 'ADMIN', label: 'Admin Master', desc: 'Painel administrativo', icon: ShieldCheck },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (type: ProfileType) => {
    login(type);
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.05),transparent)] flex items-center justify-center p-4 sm:p-6 safe-area-inset">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-10"
      >
        {/* Logo */}
        <div className="text-center space-y-5">
          <div className="w-[72px] h-[72px] bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow-primary border border-primary/20">
            <BrainCircuit size={32} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-black text-foreground tracking-tight">AURA</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Diagnóstico financeiro inteligente</p>
          </div>
        </div>

        {/* Profile Selection */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold text-center">
            Selecione um perfil demo
          </p>
          {profiles.map((p, i) => (
            <motion.button
              key={p.type}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.25 }}
              onClick={() => handleLogin(p.type)}
              className="w-full flex items-center gap-4 card-glass hover:border-border hover:bg-accent/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-glow-primary group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200 border border-primary/10">
                <p.icon size={22} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{p.label}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Ambiente de demonstração com dados simulados
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
