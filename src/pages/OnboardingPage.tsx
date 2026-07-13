import { useState } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingQuestionField } from '@/components/onboarding/OnboardingQuestionField';
import {
  fetchOnboardingSchema,
  isStepComplete,
  submitOnboarding,
  type OnboardingAnswersV2,
} from '@/services/onboarding';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { delay: i * 0.05, duration: 0.35 },
});

export default function OnboardingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdate = searchParams.get('atualizar') === '1';
  const queryClient = useQueryClient();
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<OnboardingAnswersV2>({});

  const { data: schema, isLoading } = useQuery({
    queryKey: ['onboarding-schema'],
    queryFn: fetchOnboardingSchema,
  });

  const updateAnswer = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await submitOnboarding(answers);
      queryClient.setQueryData(['onboarding-status'], {
        hasOnboarding: true,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Diagnóstico concluído! Preparando sua experiência.');
      navigate('/app/preparando', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o diagnóstico.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isLoading || !schema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-muted-foreground animate-pulse">Carregando diagnóstico...</p>
      </div>
    );
  }

  const steps = schema.steps;
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const canContinue = isStepComplete(step, answers);

  return (
    <div className="min-h-screen bg-white text-foreground font-sans flex flex-col">
      <header className="w-full bg-[#C7C6CA]/20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between">
          <div className="font-bold text-lg tracking-tight text-gray-900">Clareza</div>
          <div className="flex items-center gap-4">
            <span className="uppercase tracking-widest text-[10px] font-bold text-gray-400">
              PASSO {stepIndex + 1} DE {steps.length}
            </span>
            <div className="relative w-16 sm:w-20 h-[3px] bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                className="absolute top-0 left-0 h-full bg-black rounded-full"
              />
            </div>
          </div>
        </div>
      </header>

      {isUpdate && (
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pt-4">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Você está <strong>atualizando</strong> seu diagnóstico. As respostas anteriores serão substituídas.
          </p>
        </div>
      )}

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 flex flex-col">
        <div className="text-center space-y-3 mb-10">
          <motion.h1 {...anim(0)} className="text-3xl sm:text-[2rem] font-bold tracking-tight text-gray-900">
            {step.title}
          </motion.h1>
          <motion.p {...anim(0)} className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {step.subtitle}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 flex-1"
          >
            {step.questions.map((question, i) => (
              <motion.div
                key={question.id}
                {...anim(i + 1)}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_4px_40px_rgb(0,0,0,0.03)] border border-gray-50"
              >
                <div className="space-y-1.5 mb-5">
                  <h3 className="text-[13px] font-bold uppercase tracking-wide text-gray-900">
                    {question.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{question.description}</p>
                </div>
                <OnboardingQuestionField
                  question={question}
                  value={answers[question.id]}
                  onChange={(v) => updateAnswer(question.id, v)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <motion.div {...anim(3)} className="flex items-center justify-between mt-12 pb-16">
          <button
            type="button"
            onClick={() => setStepIndex((s) => s - 1)}
            className={`inline-flex items-center gap-2 text-[13px] font-medium text-gray-500 hover:text-black transition-colors ${
              stepIndex === 0 || submitting ? 'invisible' : ''
            }`}
          >
            <ArrowLeft size={16} />
            VOLTAR
          </button>

          <button
            type="button"
            disabled={!canContinue || submitting}
            onClick={() => (isLast ? handleFinish() : setStepIndex((s) => s + 1))}
            className="inline-flex items-center gap-3 rounded-full bg-black text-white px-8 py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-all"
          >
            {submitting ? 'Salvando...' : isLast ? 'VER MEU DIAGNÓSTICO' : 'CONTINUAR'}
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </main>
    </div>
  );
}
