import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileNav } from '@/components/MobileNav';
import { useQuery } from '@tanstack/react-query';
import { fetchOnboardingStatus } from '@/services/onboarding';
import { tenantCanUseApp } from '@/lib/billing';

export const AppLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const location = useLocation();

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: fetchOnboardingStatus,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const insideOnboarding = location.pathname.startsWith('/onboarding');
  const insidePreparing = location.pathname.startsWith('/app/preparando');
  const hasOnboarding = onboardingStatus?.hasOnboarding;

  // Se o usuário ainda não fez onboarding, força passar primeiro pelo fluxo
  if (isAuthenticated && onboardingStatus && !hasOnboarding && !insideOnboarding && !insidePreparing) {
    return <Navigate to="/onboarding" replace />;
  }

  // Trial de 1h encerrado sem assinatura: só planos (e master continua com acesso total)
  const onPlanos =
    location.pathname === '/app/planos' || location.pathname.startsWith('/app/planos/');
  const trialExpired = Boolean(isAuthenticated && hasOnboarding && user && !tenantCanUseApp(user));
  const trialEndsAtMs = user?.billing?.trialEndsAt ? new Date(user.billing.trialEndsAt).getTime() : null;
  const remainingMs = trialEndsAtMs ? trialEndsAtMs - nowMs : null;
  const onDemoWindow = Boolean(user?.billing?.inFreeTrial && remainingMs != null && remainingMs > 0);
  if (trialExpired && !onPlanos) {
    return <Navigate to="/app/planos" replace />;
  }

  const formatRemaining = (valueMs: number): string => {
    const totalMinutes = Math.max(0, Math.floor(valueMs / 60_000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  return (
    <div className="flex min-h-screen w-full min-h-[100dvh] bg-background bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]">
      {!isMobile && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">

        {trialExpired && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            Seu periodo de teste expirou. Escolha um plano para continuar usando os modulos da plataforma.
          </div>
        )}
        {onDemoWindow && remainingMs != null && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-900 dark:text-sky-100">
            <strong>Modo demonstracao ativo:</strong> faltam {formatRemaining(remainingMs)} para encerrar sua experiencia.
            Durante a demo, os dados exibidos podem ser dados de exemplo para apresentar a plataforma.
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden safe-area-inset">
          <Outlet />
        </main>
      </div>
      {isMobile && (
        <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      )}
    </div>
  );
};
