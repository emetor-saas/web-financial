import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { Topbar } from '@/components/Topbar';
import { MobileNav } from '@/components/MobileNav';
import { useQuery } from '@tanstack/react-query';
import { fetchOnboardingStatus } from '@/services/onboarding';
import { tenantCanUseApp } from '@/lib/billing';

export const AppLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: fetchOnboardingStatus,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const insideOnboarding = location.pathname.startsWith('/onboarding');
  const hasOnboarding = onboardingStatus?.hasOnboarding;

  // Se o usuário ainda não fez onboarding, força passar primeiro pelo fluxo
  if (isAuthenticated && onboardingStatus && !hasOnboarding && !insideOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Trial de 1h encerrado sem assinatura: só planos (e master continua com acesso total)
  const onPlanos =
    location.pathname === '/app/planos' || location.pathname.startsWith('/app/planos/');
  if (isAuthenticated && hasOnboarding && user && !tenantCanUseApp(user) && !onPlanos) {
    return <Navigate to="/app/planos" replace />;
  }

  return (
    <div className="flex min-h-screen w-full min-h-[100dvh] bg-background bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]">
      {!isMobile && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar
          showMenuButton={isMobile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 lg:py-8 safe-area-inset">
          <Outlet />
        </main>
      </div>
      {isMobile && (
        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      )}
    </div>
  );
};
