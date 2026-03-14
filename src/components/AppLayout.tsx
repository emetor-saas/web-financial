import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { Topbar } from '@/components/Topbar';
import { MobileNav } from '@/components/MobileNav';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
