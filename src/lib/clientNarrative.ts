export type NarrativeStage = 'dashboard' | 'diagnostico' | 'insights' | 'plano';

type OnboardingAnswers = {
  saldoMensal?: 'azul' | 'vermelho' | '';
  objetivosCurto?: string;
  objetivosLongo?: string;
  mapaDividas?: string;
};

export type DiagnosticNarrativeInput = {
  mainPriorities?: string[];
  actionPlan?: {
    today?: string[];
    next7Days?: string[];
  };
  onboardingAnswers?: OnboardingAnswers | null;
};

export function buildClientNarrative(input: DiagnosticNarrativeInput, stage: NarrativeStage) {
  const onboarding = input.onboardingAnswers;
  const shortGoal = onboarding?.objetivosCurto?.trim();
  const longGoal = onboarding?.objetivosLongo?.trim();
  const debtContext = onboarding?.mapaDividas?.trim();

  const contextParts: string[] = [];
  if (onboarding?.saldoMensal === 'vermelho') contextParts.push('você informou que o mês tende a fechar no vermelho');
  if (onboarding?.saldoMensal === 'azul') contextParts.push('você informou que já fecha o mês no azul');
  if (shortGoal) contextParts.push(`seu foco de curto prazo é "${shortGoal}"`);
  if (longGoal) contextParts.push(`seu objetivo de longo prazo é "${longGoal}"`);
  if (debtContext) contextParts.push(`você mapeou dívidas como "${debtContext}"`);

  const defaultContext = 'seguimos conectando seu diagnóstico inicial com seus dados reais';
  const context = contextParts.length > 0 ? contextParts.join(' · ') : defaultContext;

  const focus =
    input.mainPriorities?.[0] ||
    'organizar o fluxo do mês para aumentar previsibilidade e reduzir pressão financeira';
  const nextStep = input.actionPlan?.today?.[0] || input.actionPlan?.next7Days?.[0] || 'executar uma ação prática ainda hoje para ganhar tração';

  const stageTitle =
    stage === 'dashboard'
      ? 'Narrativa financeira do momento'
      : stage === 'diagnostico'
        ? 'Narrativa do seu diagnóstico'
        : stage === 'insights'
          ? 'Narrativa dos seus insights'
          : 'Narrativa do seu plano de ação';

  return { stageTitle, context, focus, nextStep };
}
