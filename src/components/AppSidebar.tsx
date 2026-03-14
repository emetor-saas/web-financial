import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Activity, ShieldCheck, CreditCard, Target,
  BrainCircuit, User, Users, Settings, LogOut,   ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Chat IA', path: '/app/chat', icon: Sparkles, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Diagnóstico', path: '/app/diagnostico', icon: Activity, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Plano de Ação', path: '/app/plano-de-acao', icon: ShieldCheck, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Dívidas', path: '/app/dividas', icon: CreditCard, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Metas', path: '/app/metas', icon: Target, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Insights IA', path: '/app/insights', icon: BrainCircuit, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Espaço Casal', path: '/app/casal', icon: Users, roles: ['COUPLE'] },
  { label: 'Admin Master', path: '/app/admin', icon: Settings, roles: ['ADMIN'] },
  { label: 'Perfil', path: '/app/perfil', icon: User, roles: ['SINGLE', 'COUPLE'] },
];

export const AppSidebar = () => {
  const { profileType, logout, userName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = NAV_ITEMS.filter(item => profileType && item.roles.includes(profileType));

  return (
    <aside className={cn(
      "h-screen sticky top-0 flex flex-col bg-card/95 backdrop-blur-xl border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Link to="/app/dashboard" className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-primary">
            <BrainCircuit size={18} className="text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display font-bold text-lg text-foreground tracking-tight">AURA</span>}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Logado como</p>
            <p className="text-sm font-medium text-foreground truncate font-mono-nums">{userName}</p>
          </div>
        )}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2 w-full text-muted-foreground hover:text-destructive hover:bg-accent rounded-xl transition-all duration-200 text-sm"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
