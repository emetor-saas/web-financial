import type { AiAssistantResponse } from '@/services/aiAssistant';

type MentorPayload = NonNullable<AiAssistantResponse['mentor']>;

export function MentorStructuredCards({ mentor }: { mentor: MentorPayload }) {
  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
      <div className="rounded-xl bg-background/60 border border-border px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ação (7 dias)</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{mentor.primary_action.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{mentor.primary_action.completion_criteria}</p>
      </div>
      {mentor.thirty_day_plan.length > 0 && (
        <div className="rounded-xl bg-background/60 border border-border px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plano 30 dias</p>
          <ol className="mt-1 space-y-1 list-decimal list-inside">
            {mentor.thirty_day_plan.map((step, i) => (
              <li key={i} className="text-xs text-foreground">
                {step.step}
              </li>
            ))}
          </ol>
        </div>
      )}
      {mentor.questions.length > 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Perguntas</p>
          {mentor.questions.map((q, i) => (
            <p key={i} className="text-xs text-foreground mt-1">
              {q}
            </p>
          ))}
        </div>
      )}
      {mentor.disclosures?.[0] && (
        <p className="text-[10px] text-muted-foreground italic">{mentor.disclosures[0]}</p>
      )}
    </div>
  );
}
