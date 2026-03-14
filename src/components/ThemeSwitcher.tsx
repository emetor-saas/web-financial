import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const options = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'dark' as const, label: 'Escuro', icon: Moon },
  { value: 'system' as const, label: 'Automático', icon: Monitor },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = theme ?? 'system';
  const effectiveTheme = resolvedTheme ?? 'dark';
  const Icon = options.find((o) => o.value === current)?.icon ?? Monitor;

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Tema">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-xl transition-all duration-200',
            'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
          aria-label="Alternar tema (atual: tema do sistema)"
        >
          <Icon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {options.map(({ value, label, icon: OptionIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'cursor-pointer',
              current === value && 'bg-accent text-accent-foreground'
            )}
          >
            <OptionIcon className="mr-2 h-4 w-4" />
            {label}
            {current === value && (
              <span className="ml-auto text-xs text-muted-foreground">
                {value === 'system' && effectiveTheme === 'light' && '(claro)'}
                {value === 'system' && effectiveTheme === 'dark' && '(escuro)'}
                {value !== 'system' && '•'}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
