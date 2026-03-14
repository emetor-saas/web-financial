import { useAuth } from '@/context/AuthContext';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ProfileType } from '@/types';
import type { Alert } from '@/types';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

interface TopbarProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export const Topbar = ({ showMenuButton, onMenuClick }: TopbarProps) => {
  const { profileType, switchProfile, userName, singleProfile, coupleProfile, adminProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications: Alert[] = useMemo(() => {
    if (profileType === 'SINGLE') return singleProfile.alerts;
    if (profileType === 'COUPLE') return coupleProfile.alerts;
    if (profileType === 'ADMIN') {
      return adminProfile.tickets.slice(0, 5).map((t) => ({
        id: t.id,
        title: t.subject,
        description: `${t.user} — ${t.status === 'open' ? 'Aberto' : t.status === 'in-progress' ? 'Em andamento' : 'Resolvido'}`,
        type: (t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'info') as Alert['type'],
        date: t.date.split('/').slice(0, 2).reverse().join('/'),
      }));
    }
    return [];
  }, [profileType, singleProfile.alerts, coupleProfile.alerts, adminProfile.tickets]);

  const unreadCount = notifications.length;

  const profiles: { label: string; type: ProfileType }[] = [
    { label: 'Solteiro — Rafael', type: 'SINGLE' },
    { label: 'Casal — Marina & Lucas', type: 'COUPLE' },
    { label: 'Admin Master', type: 'ADMIN' },
  ];

  return (
    <header className="h-14 min-h-[56px] border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-30 safe-area-inset-top">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex-shrink-0 p-2.5 -ml-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        )}
        {/* Search - hidden on small mobile, optional on larger */}
        <div className="hidden sm:flex flex-1 max-w-[200px] md:max-w-[240px] md:w-64 flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-3 py-2 transition-all duration-200 focus-within:border-ring focus-within:bg-muted/80">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full min-w-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <ThemeSwitcher />
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((v) => !v)}
            className={cn(
              'relative p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all duration-200',
              showNotifications
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            aria-label={unreadCount ? `${unreadCount} notificações não lidas` : 'Notificações'}
            aria-expanded={showNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 flex items-center justify-center">
                <span className="bg-primary rounded-full ring-2 ring-card w-2 h-2" />
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificationsPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            </>
          )}
        </div>

        {/* Profile Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 bg-muted/60 border border-border px-2 sm:px-3 py-2 rounded-xl hover:bg-accent transition-all duration-200 min-h-[44px]"
          >
            <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono-nums flex-shrink-0">
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline truncate max-w-[120px]">{userName}</span>
            <ChevronDown size={14} className="text-muted-foreground hidden sm:block flex-shrink-0" />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-premium z-50 py-1">
                <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Trocar Perfil Demo</p>
                {profiles.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => { switchProfile(p.type); setShowProfileMenu(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg mx-1 transition-all duration-200 ${
                      profileType === p.type ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
