import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const { loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;
    setLoading(true);
    try {
      await loginWithCredentials(email, password);
      navigate('/app/minha-casa', { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível entrar. Verifique credenciais.';
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
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">Clareza</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
                placeholder="••••••••"
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
