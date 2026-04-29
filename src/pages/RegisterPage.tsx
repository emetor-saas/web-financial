import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Home, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { registerAccount } from '@/services/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !householdName || !email || !password || loading) return;
    setLoading(true);
    try {
      await registerAccount({
        name,
        householdName,
        email,
        password,
        language: 'pt-BR',
      });

      toast.success('Conta criada com sucesso.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente novamente.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.05),transparent)] flex items-start sm:items-center justify-center p-3 sm:p-6 safe-area-inset overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm px-4 py-5 sm:px-6 sm:py-7 space-y-5 sm:space-y-7 mt-3 sm:mt-0"
      >
        <div className="text-center space-y-3 sm:space-y-5">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Criar conta
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1.5">
              Monte sua conta financeira para você ou para o casal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Seu nome
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card/60 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <User size={16} className="text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rafael Martins"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Nome da conta / família
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card/60 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <Home size={16} className="text-muted-foreground" />
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Casa Martins"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card/60 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <Mail size={16} className="text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Senha
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card/60 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <Lock size={16} className="text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

