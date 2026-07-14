export type NarrativeStage = 'dashboard' | 'diagnostico' | 'insights' | 'plano';

type OnboardingAnswers = {
  saldoMensal?: 'azul' | 'vermelho' | 'empate' | string;
  objetivosCurto?: string | string[];
  objetivosLongo?: string | string[];
  mapaDividas?: string;
  _display?: Record<string, string>;
};

export type DiagnosticNarrativeInput = {
  mainPriorities?: string[];
  actionPlan?: {
    today?: string[];
    next7Days?: string[];
  };
  onboardingAnswers?: OnboardingAnswers | null;
};

/** Onboarding v2 guarda arrays de IDs; v1 usava texto livre. */
function asDisplayText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const t = value.trim();
    return t || undefined;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }
  return undefined;
}

export function buildClientNarrative(input: DiagnosticNarrativeInput, stage: NarrativeStage) {
  const onboarding = input.onboardingAnswers;
  const display = onboarding?._display;

  const shortGoal =
    asDisplayText(display?.objetivosCurto) || asDisplayText(onboarding?.objetivosCurto);
  const longGoal =
    asDisplayText(display?.objetivosLongo) || asDisplayText(onboarding?.objetivosLongo);
  const debtContext =
    asDisplayText(display?.mapaDividas) || asDisplayText(onboarding?.mapaDividas);

  const contextParts: string[] = [];
  if (onboarding?.saldoMensal === 'vermelho') contextParts.push('você informou que o mês tende a fechar no vermelho');
  if (onboarding?.saldoMensal === 'azul') contextParts.push('você informou que já fecha o mês no azul');
  if (onboarding?.saldoMensal === 'empate') contextParts.push('você informou que o mês costuma fechar no zero');
  if (shortGoal) contextParts.push(`seu foco de curto prazo é "${shortGoal}"`);
  if (longGoal) contextParts.push(`seu objetivo de longo prazo é "${longGoal}"`);
  if (debtContext) contextParts.push(`você mapeou dívidas como "${debtContext}"`);

  const defaultContext = 'seguimos conectando seu diagnóstico inicial com seus dados reais';
  const context = contextParts.length > 0 ? contextParts.join(' · ') : defaultContext;

  const focus =
    input.mainPriorities?.[0] ||
    'organizar o fluxo do mês para aumentar previsibilidade e reduzir pressão financeira';
  const nextStep =
    input.actionPlan?.today?.[0] ||
    input.actionPlan?.next7Days?.[0] ||
    'executar uma ação prática ainda hoje para ganhar tração';

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
