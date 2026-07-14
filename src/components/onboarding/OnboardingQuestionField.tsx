import { cn } from '@/lib/utils';
import type { OnboardingGoalDetailDraft, OnboardingQuestion } from '@/services/onboarding';

type Props = {
  question: OnboardingQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  /** Detalhes valor/prazo por opção (quando withTargetDetails). */
  goalDetails?: Record<string, OnboardingGoalDetailDraft>;
  onGoalDetailsChange?: (next: Record<string, OnboardingGoalDetailDraft>) => void;
};

export function OnboardingQuestionField({
  question,
  value,
  onChange,
  goalDetails = {},
  onGoalDetailsChange,
}: Props) {
  if (question.type === 'multi') {
    const selected = Array.isArray(value) ? value : [];
    const max = question.maxSelections ?? 3;
    const withDetails = Boolean(question.withTargetDetails);

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          Selecione até {max} · {selected.length}/{max}
        </p>
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => {
            const active = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const next = new Set(selected);
                  if (next.has(opt.id)) {
                    next.delete(opt.id);
                    if (withDetails && onGoalDetailsChange) {
                      const copy = { ...goalDetails };
                      delete copy[opt.id];
                      onGoalDetailsChange(copy);
                    }
                  } else if (next.size < max) {
                    next.add(opt.id);
                    if (withDetails && onGoalDetailsChange && !goalDetails[opt.id]) {
                      onGoalDetailsChange({
                        ...goalDetails,
                        [opt.id]: { targetAmount: '', months: '' },
                      });
                    }
                  }
                  onChange([...next]);
                }}
                className={cn(
                  'px-4 py-2.5 rounded-full text-sm font-medium border transition-all',
                  active
                    ? 'bg-black text-white border-black'
                    : 'bg-[#F7F3F2] text-gray-700 border-transparent hover:bg-[#EAEAEB]',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {withDetails && selected.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-gray-500">
              Informe o valor alvo e o prazo em meses de cada objetivo selecionado.
            </p>
            {selected.map((id) => {
              const opt = question.options.find((o) => o.id === id);
              const detail = goalDetails[id] ?? { targetAmount: '', months: '' };
              return (
                <div
                  key={id}
                  className="rounded-2xl border border-gray-100 bg-[#F7F3F2]/60 p-4 space-y-2"
                >
                  <p className="text-sm font-semibold text-gray-900">{opt?.label ?? id}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium text-gray-500">Valor alvo (R$)</span>
                      <input
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        inputMode="decimal"
                        placeholder="Ex.: 15000"
                        value={detail.targetAmount}
                        onChange={(e) =>
                          onGoalDetailsChange?.({
                            ...goalDetails,
                            [id]: { ...detail, targetAmount: e.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-medium text-gray-500">Prazo (meses)</span>
                      <input
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        inputMode="numeric"
                        placeholder="Ex.: 12"
                        value={detail.months}
                        onChange={(e) =>
                          onGoalDetailsChange?.({
                            ...goalDetails,
                            [id]: { ...detail, months: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-2', question.type === 'band' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
      {question.options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-left text-sm font-medium border transition-all',
              active
                ? 'bg-black text-white border-black shadow-md'
                : 'bg-[#F7F3F2] text-gray-800 border-transparent hover:bg-[#EAEAEB]',
            )}
          >
            <span>{opt.label}</span>
            <span
              className={cn(
                'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center',
                active ? 'border-white' : 'border-gray-300',
              )}
            >
              {active && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
