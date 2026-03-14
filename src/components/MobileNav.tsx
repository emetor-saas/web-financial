import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Activity, ShieldCheck, CreditCard, Target,
  BrainCircuit, User, Users, Settings, LogOut, Sparkles,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileNav = ({ open, onOpenChange }: MobileNavProps) => {
  const { profileType, logout, userName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const filteredItems = NAV_ITEMS.filter(item => profileType && item.roles.includes(profileType));

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
          <span className="font-display font-bold text-lg text-foreground tracking-tight">AURA</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
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
