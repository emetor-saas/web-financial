import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OnboardingPage from "@/pages/OnboardingPage";
import DashboardPage from "@/pages/DashboardPage";
import DiagnosticoPage from "@/pages/DiagnosticoPage";
import PlanoDeAcaoPage from "@/pages/PlanoDeAcaoPage";
import DividasPage from "@/pages/DividasPage";
import MetasPage from "@/pages/MetasPage";
import InsightsPage from "@/pages/InsightsPage";
import PerfilPage from "@/pages/PerfilPage";
import CasalPage from "@/pages/CasalPage";
import AdminPage from "@/pages/AdminPage";
import ChatPage from "@/pages/ChatPage";
import ExtratosPage from "@/pages/ExtratosPage";
import ExtratoJobPage from "@/pages/ExtratoJobPage";
import PlansPage from "@/pages/PlansPage";
import PreparandoExperienciaPage from "@/pages/PreparandoExperienciaPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="web-financial-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<RegisterPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/app" element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="diagnostico" element={<DiagnosticoPage />} />
              <Route path="plano-de-acao" element={<PlanoDeAcaoPage />} />
              <Route path="dividas" element={<DividasPage />} />
              <Route path="metas" element={<MetasPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="extratos" element={<ExtratosPage />} />
              <Route path="extratos/:id" element={<ExtratoJobPage />} />
              <Route path="planos" element={<PlansPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="casal" element={<CasalPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="preparando" element={<PreparandoExperienciaPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
