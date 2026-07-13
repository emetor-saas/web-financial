import { cn } from '@/lib/utils';
import type { OnboardingQuestion } from '@/services/onboarding';

type Props = {
  question: OnboardingQuestion;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
};

export function OnboardingQuestionField({ question, value, onChange }: Props) {
  if (question.type === 'multi') {
    const selected = Array.isArray(value) ? value : [];
    const max = question.maxSelections ?? 3;
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
                  if (next.has(opt.id)) next.delete(opt.id);
                  else if (next.size < max) next.add(opt.id);
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
