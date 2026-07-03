import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Gauge, Boxes, Sparkles, TrendingUp, Shield, Scale, Rocket, FileSignature, Info, BarChart2 } from 'lucide-react';
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
  { id: 1, title: 'Clareza' },
  { id: 2, title: 'Controle' },
  { id: 3, title: 'Segurança' },
  { id: 4, title: 'Visão' },
  { id: 5, title: 'Riscos' },
] as const;

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

const InputCard = ({ title, description, children, animIndex = 0 }: { title: string; description: string; children: React.ReactNode; animIndex?: number }) => (
  <motion.div
    {...anim(animIndex)}
    className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50"
  >
    <div className="space-y-1.5 mb-6">
      <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
    {children}
  </motion.div>
);

const OnboardingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdate = searchParams.get('atualizar') === '1';
  const queryClient = useQueryClient();
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
      queryClient.setQueryData(['onboarding-status'], {
        hasOnboarding: true,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Diagnóstico inicial concluído. Vamos preparar sua experiência personalizada.');
      navigate('/app/preparando', { replace: true });
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
    <div className="min-h-screen bg-white text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#C7C6CA]/20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight text-gray-900">
            Clareza
          </div>
          <div className="flex items-center gap-4">
            <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">
              PASSO {step} DE {steps.length}
            </span>
            <div className="relative w-16 sm:w-20 h-[3px] bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${(step / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="absolute top-0 left-0 h-full bg-black rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      {isUpdate && (
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-4">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Você está <strong>atualizando</strong> seu diagnóstico. As respostas anteriores serão substituídas ao concluir.
          </p>
        </div>
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
        <div className="text-center space-y-3 mb-12">
          <motion.h1 {...anim(0)} className="text-3xl sm:text-[2rem] font-bold tracking-tight text-gray-900">
            Vamos entender sua casa financeira
          </motion.h1>
          <motion.p {...anim(0)} className="text-[13px] sm:text-sm text-gray-500 max-w-[460px] mx-auto leading-relaxed">
            {step === 1
              ? "A clareza sobre suas obrigações e sua segurança é o primeiro passo para o crescimento patrimonial sólido."
              : step === 2
                ? "Vamos identificar os principais pontos de pressão no seu orçamento para construir recomendações mais personalizadas."
                : step === 3
                  ? "Conhecer suas obrigações e sua reserva de emergência nos ajuda a criar recomendações mais seguras e realistas."
                  : step === 4
                    ? "Para criar um plano financeiro personalizado, precisamos entender seus objetivos de curto e longo prazo."
                    : "Entender sua tolerância a riscos e seus compromissos futuros permite construir recomendações mais alinhadas à sua realidade."}
          </motion.p>
        </div>

        <div className="space-y-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {step === 1 && (
                <>
                  <InputCard
                    title="Renda líquida média mensal"
                    description="Informe sua renda líquida mensal (valor recebido após descontos de impostos, INSS e outros encargos)."
                    animIndex={1}
                  >
                    <input
                      type="text"
                      value={answers.rendaLiquida}
                      onChange={(e) => update({ rendaLiquida: e.target.value })}
                      placeholder="Ex.: R$ 7.850,00"
                      className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </InputCard>

                  <InputCard
                    title="3 maiores custos fixos"
                    description="Informe seus principais gastos mensais recorrentes."
                    animIndex={2}
                  >
                    <textarea
                      value={answers.custosFixos}
                      onChange={(e) => update({ custosFixos: e.target.value })}
                      rows={2}
                      placeholder="Ex.: Aluguel (R$ 1.500), Internet (R$ 120), Plano de Saúde (R$ 450), Academia (R$ 100)"
                      className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    />
                  </InputCard>
                </>
              )}

              {step === 2 && (
                <>
                  <InputCard
                    title="Categoria que mais estoura no variável"
                    description="Liste todas as suas pendências atuais para que possamos traçar uma estratégia de quitação."
                    animIndex={1}
                  >
                    <textarea
                      value={answers.categoriaVariavel}
                      onChange={(e) => update({ categoriaVariavel: e.target.value })}
                      rows={2}
                      className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    />
                  </InputCard>

                  <motion.div {...anim(2)} className="space-y-4 pt-2">
                    <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">
                      Normalmente o mês fecha
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <button
                        type="button"
                        onClick={() => update({ saldoMensal: 'azul' })}
                        className={`flex items-center justify-between p-6 rounded-[2rem] transition-all border ${answers.saldoMensal === 'azul'
                          ? 'bg-white border-black shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
                          : 'bg-white border-transparent hover:bg-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                          }`}
                      >
                        <div className="text-left">
                          <span className="block font-bold text-gray-900 text-sm mb-1">No azul</span>
                          <span className="block text-xs text-gray-500">(sobra um pouco)</span>
                        </div>
                        <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${answers.saldoMensal === 'azul' ? 'border-black' : 'border-gray-300'}`}>
                          {answers.saldoMensal === 'azul' && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => update({ saldoMensal: 'vermelho' })}
                        className={`flex items-center justify-between p-6 rounded-[2rem] transition-all border ${answers.saldoMensal === 'vermelho'
                          ? 'bg-white border-black shadow-[0_8px_30px_rgb(0,0,0,0.08)]'
                          : 'bg-white border-transparent hover:bg-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                          }`}
                      >
                        <div className="text-left">
                          <span className="block font-bold text-gray-900 text-sm mb-1">No vermelho</span>
                          <span className="block text-xs text-gray-500">(falta ou aperta)</span>
                        </div>
                        <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${answers.saldoMensal === 'vermelho' ? 'border-black' : 'border-gray-300'}`}>
                          {answers.saldoMensal === 'vermelho' && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}

              {step === 3 && (
                <>
                  <InputCard
                    title="Dívidas (saldo, parcela, juros, atraso)"
                    description="Liste todas as suas pendências atuais para que possamos traçar uma estratégia de quitação."
                    animIndex={1}
                  >
                    <textarea
                      value={answers.mapaDividas}
                      onChange={(e) => update({ mapaDividas: e.target.value })}
                      rows={3}
                      placeholder="Ex.: Cartão X R$ 3.200 (14% a.m., em dia), Empréstimo Y R$ 8.000 (2,5% a.m., 2 parcelas em atraso)..."
                      className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    />
                  </InputCard>

                  <InputCard
                    title="Reserva de emergência (valor e onde está)"
                    description="Sua rede de segurança para imprevistos. Quanto você tem disponível hoje para liquidez imediata?"
                    animIndex={2}
                  >
                    <textarea
                      value={answers.reservaEmergencia}
                      onChange={(e) => update({ reservaEmergencia: e.target.value })}
                      rows={2}
                      placeholder="Ex.: R$ 1.500 na poupança do Banco X"
                      className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                    />
                  </InputCard>
                </>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div {...anim(1)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900">
                          <Gauge size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-full px-3 py-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Curto Prazo</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-6 flex-1">
                        <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">Objetivos de até 12 meses</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Foque em conquistas imediatas, segurança e organização de fluxo de caixa.</p>
                      </div>
                      <textarea
                        value={answers.objetivosCurto}
                        onChange={(e) => update({ objetivosCurto: e.target.value })}
                        rows={3}
                        placeholder="Ex.: Sair do cheque especial, montar reserva de R$ 3.000, quitar cartão..."
                        className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                      />
                    </motion.div>

                    <motion.div {...anim(2)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-900">
                          <Boxes size={16} />
                        </div>
                        <div className="bg-gray-100 rounded-full px-3 py-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Médio Prazo</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-6 flex-1">
                        <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">Objetivos de 2 a 5 anos</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Planeje marcos significativos que exigem aportes consistentes e estratégia.</p>
                      </div>
                      <textarea
                        value={answers.objetivosLongo}
                        onChange={(e) => update({ objetivosLongo: e.target.value })}
                        rows={3}
                        placeholder="Ex.: Dar entrada em um imóvel, fazer uma viagem grande, trocar de carro..."
                        className="w-full bg-[#F7F3F2] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none"
                      />
                    </motion.div>
                  </div>

                  <motion.div {...anim(3)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 relative overflow-hidden">
                    <div className="relative z-10 space-y-1">
                      <p className="text-[13px] sm:text-sm font-bold text-gray-900">&quot;A clareza é a base de toda riqueza duradoura.&quot;</p>
                      <p className="text-[13px] sm:text-sm text-gray-500 max-w-md">Definir seus prazos permite que nosso motor de inteligência otimize a liquidez dos seus ativos.</p>
                    </div>
                    <Sparkles className="absolute bottom-6 right-6 text-gray-100" size={64} strokeWidth={1} />
                  </motion.div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div {...anim(1)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                          <TrendingUp size={16} />
                        </div>
                        <h3 className="text-[13px] sm:text-sm font-bold uppercase tracking-wide text-gray-900">Como você reage a quedas e riscos?</h3>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed mb-6">Sua reação emocional durante a volatilidade do mercado define sua estratégia de longo prazo.</p>
                      <div className="flex flex-col gap-3 flex-1 justify-center">
                        {[
                          { id: 'baixo', label: 'Prefiro segurança', icon: Shield },
                          { id: 'moderado', label: 'Equilíbrio', icon: Scale },
                          { id: 'alto', label: 'Aceito mais risco', icon: Rocket },
                        ].map((risk) => {
                          const Icon = risk.icon;
                          const isSelected = answers.perfilRisco === risk.id;
                          return (
                            <button
                              key={risk.id}
                              type="button"
                              onClick={() => update({ perfilRisco: risk.id as any })}
                              className={`flex items-center gap-3 px-5 py-3.5 rounded-full text-sm font-medium transition-all w-3/4 sm:w-full ${isSelected
                                ? 'bg-black text-white shadow-md'
                                : 'bg-[#F4F4F5] text-gray-700 hover:bg-[#EAEAEB]'
                                }`}
                            >
                              <Icon size={18} className={isSelected ? 'text-white' : 'text-gray-500'} />
                              {risk.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>

                    <motion.div {...anim(2)} className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-800 shrink-0">
                          <FileSignature size={16} />
                        </div>
                        <h3 className="text-[13px] sm:text-sm font-bold text-gray-900">Grandes gastos futuros</h3>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed mb-6">Liste gastos grandes previstos para os próximos 24 meses.</p>
                      <textarea
                        value={answers.bombasProgramadas}
                        onChange={(e) => update({ bombasProgramadas: e.target.value })}
                        rows={3}
                        placeholder="Ex.: casamento em 8 meses, reforma em 1 ano, chegada de filho..."
                        className="w-full bg-[#F4F4F5] rounded-2xl px-5 py-4 text-sm font-medium outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-black/5 transition-all resize-none mb-4"
                      />
                      <div className="bg-[#FAF5F3] rounded-2xl p-4 flex gap-3">
                        <Info size={18} className="text-gray-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">Projetar essas despesas evita que você precise liquidar investimentos em momentos desfavoráveis.</p>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div {...anim(3)} className="bg-white rounded-3xl p-6 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 shrink-0 border border-gray-100">
                      <BarChart2 size={24} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recomendação automatizada</span>
                      <span className="block text-sm font-medium text-gray-900">Analisando seu perfil em tempo real.</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div {...anim(3)} className="flex items-center justify-between mt-12 pb-16">
          <button
            type="button"
            onClick={handlePrev}
            className={`inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-black transition-colors ${step === 1 || submitting ? 'invisible' : ''
              }`}
          >
            <ArrowLeft size={16} />
            VOLTAR
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="inline-flex items-center gap-3 rounded-full bg-black text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {step < steps.length ? 'CONTINUAR' : 'VER MEU DIAGNÓSTICO'}
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default OnboardingPage;
