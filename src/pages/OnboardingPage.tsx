import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiClient';

type Answers = {
  rendaLiquida: string;
  custosFixos: string;
  categoriaVariavel: string;
  saldoMensal: 'azul' | 'vermelho' | '';
  mapaDividas: string;
  reservaEmergencia: string;
  objetivosCurto: string;
  objetivosLongo: string;
  perfilRisco: 'baixo' | 'moderado' | 'alto' | '';
  bombasProgramadas: string;
};

const steps = [
  { id: 1, title: 'Renda e custos fixos' },
  { id: 2, title: 'Gastos variáveis e saldo' },
  { id: 3, title: 'Dívidas e reserva' },
  { id: 4, title: 'Metas e objetivos' },
  { id: 5, title: 'Risco e futuras despesas' },
] as const;

const anim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04 },
});

const OnboardingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    rendaLiquida: '',
    custosFixos: '',
    categoriaVariavel: '',
    saldoMensal: '',
    mapaDividas: '',
    reservaEmergencia: '',
    objetivosCurto: '',
    objetivosLongo: '',
    perfilRisco: '',
    bombasProgramadas: '',
  });

  const progress = (step / steps.length) * 100;

  const update = (patch: Partial<Answers>) =>
    setAnswers((prev) => ({ ...prev, ...patch }));

  const handleNext = () => {
    if (step < steps.length) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/api/onboarding', {
        method: 'POST',
        body: JSON.stringify(answers),
      });
      toast.success('Diagnóstico inicial registrado. Agora vamos para a leitura detalhada.');
      navigate('/app/diagnostico', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar seu diagnóstico inicial. Tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center p-4 sm:p-6">
      <motion.div
        {...anim(0)}
        className="w-full max-w-2xl bg-card/70 border border-border rounded-3xl shadow-xl p-5 sm:p-8 space-y-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Diagnóstico Clareza
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              Vamos entender sua casa financeira
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl">
              São 5 blocos rápidos, com 2 perguntas por etapa. Use estimativas
              sinceras — não precisa ser perfeito, precisa ser verdadeiro.
            </p>
          </div>
          <CheckCircle2 className="hidden sm:block text-primary" size={32} />
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {step} de {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-primary rounded-full"
            />
          </div>
        </div>

        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {steps[step - 1]?.title}
        </div>

        {/* Step content */}
        <div className="space-y-4">
          {step === 1 && (
            <>
              <motion.div {...anim(1)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Renda líquida média mensal
                </label>
                <input
                  type="text"
                  value={answers.rendaLiquida}
                  onChange={(e) => update({ rendaLiquida: e.target.value })}
                  placeholder="Ex.: R$ 4.800 por mês"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                />
              </motion.div>
              <motion.div {...anim(2)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  3 maiores custos fixos
                </label>
                <textarea
                  value={answers.custosFixos}
                  onChange={(e) => update({ custosFixos: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Aluguel R$ 1.800, Mercado fixo R$ 900, Escola R$ 600"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
            </>
          )}

          {step === 2 && (
            <>
              <motion.div {...anim(1)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Categoria que mais estoura no variável
                </label>
                <input
                  type="text"
                  value={answers.categoriaVariavel}
                  onChange={(e) => update({ categoriaVariavel: e.target.value })}
                  placeholder="Ex.: iFood, Mercado, Lazer, Transporte..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm"
                />
              </motion.div>
              <motion.div {...anim(2)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Normalmente o mês fecha
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update({ saldoMensal: 'azul' })}
                    className={`px-3 py-2 rounded-xl text-sm border ${
                      answers.saldoMensal === 'azul'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    No azul (sobra um pouco)
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ saldoMensal: 'vermelho' })}
                    className={`px-3 py-2 rounded-xl text-sm border ${
                      answers.saldoMensal === 'vermelho'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    No vermelho (falta ou aperta)
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {step === 3 && (
            <>
              <motion.div {...anim(1)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Dívidas (saldo, parcela, juros, atraso)
                </label>
                <textarea
                  value={answers.mapaDividas}
                  onChange={(e) => update({ mapaDividas: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Cartão X R$ 3.200 (14% a.m., em dia), Empréstimo Y R$ 8.000 (2,5% a.m., 2 parcelas em atraso)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
              <motion.div {...anim(2)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Reserva de emergência (valor e onde está)
                </label>
                <textarea
                  value={answers.reservaEmergencia}
                  onChange={(e) => update({ reservaEmergencia: e.target.value })}
                  rows={3}
                  placeholder="Ex.: R$ 1.500 na poupança do Banco X"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
            </>
          )}

          {step === 4 && (
            <>
              <motion.div {...anim(1)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Objetivos de até 12 meses
                </label>
                <textarea
                  value={answers.objetivosCurto}
                  onChange={(e) => update({ objetivosCurto: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Sair do cheque especial, montar reserva de R$ 3.000, quitar cartão..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
              <motion.div {...anim(2)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Objetivos de 2 a 5 anos
                </label>
                <textarea
                  value={answers.objetivosLongo}
                  onChange={(e) => update({ objetivosLongo: e.target.value })}
                  rows={3}
                  placeholder="Ex.: Dar entrada em um imóvel, fazer uma viagem grande, trocar de carro..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
            </>
          )}

          {step === 5 && (
            <>
              <motion.div {...anim(1)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Como você reage a quedas e riscos?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => update({ perfilRisco: 'baixo' })}
                    className={`px-3 py-2 rounded-xl text-xs border ${
                      answers.perfilRisco === 'baixo'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Prefiro segurança
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ perfilRisco: 'moderado' })}
                    className={`px-3 py-2 rounded-xl text-xs border ${
                      answers.perfilRisco === 'moderado'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Equilíbrio
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ perfilRisco: 'alto' })}
                    className={`px-3 py-2 rounded-xl text-xs border ${
                      answers.perfilRisco === 'alto'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    Aceito mais risco
                  </button>
                </div>
              </motion.div>
              <motion.div {...anim(2)} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Bombas programadas (gastos grandes previstos)
                </label>
                <textarea
                  value={answers.bombasProgramadas}
                  onChange={(e) => update({ bombasProgramadas: e.target.value })}
                  rows={3}
                  placeholder="Ex.: casamento em 8 meses, reforma em 1 ano, chegada de filho..."
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background outline-none text-sm resize-none"
                />
              </motion.div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || submitting}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-60"
          >
            {step < steps.length ? 'Continuar' : 'Ver meu diagnóstico'}
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;

