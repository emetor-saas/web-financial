import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Activity, ShieldCheck, CreditCard, Target,
  BrainCircuit, User, Users, Settings, LogOut, Sparkles, FileUp, Crown, Lock, List, Castle, Calculator, Tags,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { tenantCanUseChat } from '@/lib/billing';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { label: 'Minha Casa', path: '/app/minha-casa', icon: Castle, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Chat IA', path: '/app/chat', icon: Sparkles, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Diagnóstico', path: '/app/diagnostico', icon: Activity, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Plano de Ação', path: '/app/plano-de-acao', icon: ShieldCheck, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Dívidas', path: '/app/dividas', icon: CreditCard, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Simuladores', path: '/app/simuladores', icon: Calculator, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Metas', path: '/app/metas', icon: Target, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Insights IA', path: '/app/insights', icon: BrainCircuit, roles: ['SINGLE', 'COUPLE'] },
  { label: 'Lançamentos', path: '/app/lancamentos', icon: List, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Categorias', path: '/app/categorias', icon: Tags, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Importar extrato', path: '/app/extratos', icon: FileUp, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Planos', path: '/app/planos', icon: Crown, roles: ['SINGLE', 'COUPLE', 'ADMIN'] },
  { label: 'Espaço Casal', path: '/app/casal', icon: Users, roles: ['SINGLE', 'COUPLE'], requiresMultiTenant: true },
  { label: 'Admin Master', path: '/app/admin', icon: Settings, roles: ['ADMIN'] },
  { label: 'Perfil', path: '/app/perfil', icon: User, roles: ['SINGLE', 'COUPLE'] },
] as const;

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileNav = ({ open, onOpenChange }: MobileNavProps) => {
  const { profileType, logout, userName, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!profileType || !item.roles.includes(profileType)) return false;
    if ('requiresMultiTenant' in item && item.requiresMultiTenant) {
      const n = user?.household?.tenantMemberCount;
      if (n == null || n < 2) return false;
    }
    return true;
  });
  const chatLocked = !tenantCanUseChat(user);

  const handleClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(85vw,320px)] border-r border-border bg-card/98 backdrop-blur-xl p-0 flex flex-col pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)]"
      >
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-primary">
            <BrainCircuit size={20} className="text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">Clareza</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
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
                    handleClose();
                    navigate('/app/planos');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-all duration-200 text-muted-foreground hover:bg-accent border border-dashed border-border/70"
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400">
                    <Lock size={12} />
                    Bloqueado
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium min-h-[44px] transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                )}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Logado como</p>
            <p className="text-sm font-medium text-foreground truncate font-mono-nums">{userName}</p>
          </div>
          <button
            onClick={() => { logout(); handleClose(); navigate('/login'); }}
            className="flex items-center gap-3 px-3 py-3 w-full text-muted-foreground hover:text-destructive hover:bg-accent rounded-xl transition-all duration-200 text-sm min-h-[44px]"
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
