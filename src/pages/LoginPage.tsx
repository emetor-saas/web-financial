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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow-primary">
            <BrainCircuit size={32} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">AURA</h1>
            <p className="text-muted-foreground text-sm mt-1">Diagnóstico financeiro inteligente</p>
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => handleLogin(p.type)}
              className="w-full flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-xl p-4 transition-all duration-200 hover:shadow-glow-primary group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
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
