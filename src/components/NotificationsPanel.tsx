import { AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Alert } from '@/types';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  notifications: Alert[];
  onClose: () => void;
  className?: string;
}

const typeConfig = {
  info: { icon: Info, label: 'Info', className: 'text-muted-foreground bg-accent' },
  success: { icon: CheckCircle2, label: 'Sucesso', className: 'text-success bg-success/10' },
  warning: { icon: AlertTriangle, label: 'Atenção', className: 'text-warning bg-warning/10' },
  danger: { icon: AlertCircle, label: 'Urgente', className: 'text-destructive bg-destructive/10' },
} as const;

export const NotificationsPanel = ({ notifications, onClose, className }: NotificationsPanelProps) => {
  return (
    <div
      className={cn(
        'w-[min(100vw-2rem,380px)] max-h-[min(70vh,420px)] flex flex-col',
        'bg-card border border-border rounded-xl shadow-premium overflow-hidden',
        className
      )}
    >
      <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="font-display font-semibold text-foreground tracking-tight">Notificações</h2>
        {notifications.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground font-mono-nums">
            {notifications.length} {notifications.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {notifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
            <p className="text-xs text-muted-foreground mt-1">Você está em dia.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <li
                  key={n.id}
                  className="p-3 sm:p-4 hover:bg-muted/50 transition-colors duration-200"
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        config.className
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {n.description}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1.5 font-mono-nums">
                        {n.date}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
