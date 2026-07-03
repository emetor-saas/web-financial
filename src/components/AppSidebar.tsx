import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Activity, ShieldCheck, CreditCard, Target,
  BrainCircuit, User, Users, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles, FileUp, Crown, Lock, ChevronUp, Compass, List,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { tenantCanUseChat } from '@/lib/billing';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { label: 'Minha Jornada', path: '/app/jornada', icon: Compass, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Chat IA', path: '/app/chat', icon: Sparkles, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Diagnóstico', path: '/app/diagnostico', icon: Activity, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Plano de Ação', path: '/app/plano-de-acao', icon: ShieldCheck, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Dívidas', path: '/app/dividas', icon: CreditCard, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Metas', path: '/app/metas', icon: Target, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Insights IA', path: '/app/insights', icon: BrainCircuit, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Lançamentos', path: '/app/lancamentos', icon: List, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Importar extrato', path: '/app/extratos', icon: FileUp, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Planos', path: '/app/planos', icon: Crown, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Espaço Casal', path: '/app/casal', icon: Users, roles: ['SINGLE', 'COUPLE'], requiresMultiTenant: true },
  { label: 'Admin Master', path: '/app/admin', icon: Settings, roles: ['ADMIN'] },
  { label: 'Perfil', path: '/app/perfil', icon: User, roles: ['SINGLE', 'COUPLE'] },
] as const;

export const AppSidebar = () => {
  const { profileType, logout, userName, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!profileType || !(item.roles as ReadonlyArray<string>).includes(profileType)) return false;
    if ('requiresMultiTenant' in item && item.requiresMultiTenant) {
      const n = user?.household?.tenantMemberCount;
      if (n == null || n < 2) return false;
    }
    return true;
  });
  const chatLocked = !tenantCanUseChat(user);

  return (
    <aside className={cn(
      "h-screen sticky top-0 flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="px-4 py-5 flex items-center justify-between border-b border-border">
        <Link to="/app/jornada" className="flex flex-col gap-0 transition-opacity duration-200 hover:opacity-80">
          {!collapsed && (
            <>
              <span className="font-display font-black text-base text-foreground tracking-tight leading-none">CLAREZA</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight mt-0.5">Planejamento Financeiro</span>
            </>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BrainCircuit size={16} className="text-primary-foreground" />
            </div>
          )}
        </Link>
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive =
            location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          const isLockedChat = item.path === '/app/chat' && chatLocked;
          if (isLockedChat) {
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  toast.message('Chat IA disponível no plano pago.', {
                    description: 'Contrate um plano para liberar o aconselhamento com IA.',
                  });
                  navigate('/app/planos');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent border border-dashed border-border/70"
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400">
                    <Lock size={12} />
                    Bloqueado
                  </span>
                )}
              </button>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon size={17} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-3">
        {!collapsed && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-accent transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {userName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">Logado como</p>
                <p className="text-xs font-semibold text-foreground truncate mt-0.5">{userName}</p>
              </div>
              <ChevronUp
                size={14}
                className={cn(
                  'text-muted-foreground shrink-0 transition-transform duration-200',
                  showProfileMenu ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-xl shadow-premium z-50 py-1 overflow-hidden">
                  <p className="px-3 py-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Conta</p>
                  <Link
                    to="/app/perfil"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User size={15} className="text-muted-foreground" />
                    Meu perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <LogOut size={15} className="text-muted-foreground" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <Link
          to="/app/lancamentos"
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all duration-200',
            collapsed && 'px-2'
          )}
        >
          {!collapsed ? 'Lançamentos' : <List size={16} />}
        </Link>
      </div>
    </aside>
  );
};
