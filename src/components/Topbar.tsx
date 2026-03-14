import { useAuth } from '@/context/AuthContext';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ProfileType } from '@/types';

export const Topbar = () => {
  const { profileType, switchProfile, userName } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profiles: { label: string; type: ProfileType }[] = [
    { label: 'Solteiro — Rafael', type: 'SINGLE' },
    { label: 'Casal — Marina & Lucas', type: 'COUPLE' },
    { label: 'Admin Master', type: 'ADMIN' },
  ];

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-2 bg-accent rounded-md px-3 py-1.5 w-64">
        <Search size={14} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 bg-accent px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {userName.charAt(0)}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{userName}</span>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-premium z-50 py-1">
                <p className="px-3 py-2 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Trocar Perfil Demo</p>
                {profiles.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => { switchProfile(p.type); setShowProfileMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
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
