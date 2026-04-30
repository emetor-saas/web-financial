import { useAuth } from '@/context/AuthContext';
import { Search, Bell, ChevronDown, Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Alert } from '@/types';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { fetchInAppAlerts } from '@/services/notifications';
import { useIsMobile } from '@/hooks/use-mobile';

/** Reativar quando existir pesquisa global ligada à API. */
const SHOW_TOPBAR_SEARCH = false;

interface TopbarProps {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export const Topbar = ({ showMenuButton, onMenuClick }: TopbarProps) => {
  const { logout, userName, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const canLoadNotifications = isAuthenticated && Boolean(user?.householdId);

  const { data: notificationsFromApi } = useQuery({
    queryKey: ['in-app-notifications', user?.householdId],
    queryFn: () => fetchInAppAlerts({ limit: 50 }),
    enabled: canLoadNotifications,
    staleTime: 60_000,
    retry: 1,
  });

  const notifications: Alert[] = canLoadNotifications ? (notificationsFromApi ?? []) : [];

  const unreadCount = notifications.length;

  const displayName = userName || user?.email || 'Conta';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

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
        {SHOW_TOPBAR_SEARCH ? (
          <div className="hidden sm:flex flex-1 max-w-[200px] md:max-w-[240px] md:w-64 flex items-center gap-2 bg-muted/60 border border-border rounded-xl px-3 py-2 transition-all duration-200 focus-within:border-ring focus-within:bg-muted/80">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              type="search"
              placeholder="Buscar..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full min-w-0"
            />
          </div>
        ) : null}
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
              <div
                className={cn(
                  'z-50',
                  isMobile
                    ? 'fixed left-2 right-2 top-[68px]'
                    : 'absolute right-0 top-full mt-2'
                )}
              >
                <NotificationsPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  className={isMobile ? 'w-full max-h-[65vh]' : undefined}
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
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={`Avatar de ${displayName}`}
                className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg object-cover object-center border border-border flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono-nums flex-shrink-0">
                {initial}
              </div>
            )}
            <span className="text-sm font-medium text-foreground hidden sm:inline truncate max-w-[120px]">{displayName}</span>
            <ChevronDown size={14} className="text-muted-foreground hidden sm:block flex-shrink-0" />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-premium z-50 py-1">
                <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Conta</p>
                <Link
                  to="/app/perfil"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm rounded-lg mx-1 text-foreground hover:bg-accent transition-colors"
                >
                  <User size={16} className="text-muted-foreground" />
                  Meu perfil
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm rounded-lg mx-1 text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut size={16} className="text-muted-foreground" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
