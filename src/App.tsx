import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";

// Eager load only the absolute minimum
import Index from "./pages/Index";
import Login from "./pages/Login";

// Lazy load all other pages for better performance
const Install = lazy(() => import("./pages/Install"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Setup = lazy(() => import("./pages/Setup"));

// Lazy load other pages for better performance
const Demo = lazy(() => import("./pages/Demo"));
const DemoView = lazy(() => import("./pages/DemoView"));
const QRCodePage = lazy(() => import("./pages/QRCode"));
const LeitorQRCode = lazy(() => import("./pages/LeitorQRCode"));
const Escalas = lazy(() => import("./pages/Escalas"));
const Registro = lazy(() => import("./pages/Registro"));
const RegistrosDia = lazy(() => import("./pages/RegistrosDia"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Historico = lazy(() => import("./pages/Historico"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Justificativas = lazy(() => import("./pages/Justificativas"));
const Funcionarios = lazy(() => import("./pages/Funcionarios"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Aprovacoes = lazy(() => import("./pages/Aprovacoes"));
const Unidades = lazy(() => import("./pages/Unidades"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Dispositivos = lazy(() => import("./pages/Dispositivos"));
const Seguranca = lazy(() => import("./pages/Seguranca"));
const Suporte = lazy(() => import("./pages/Suporte"));
const SuporteAdmin = lazy(() => import("./pages/SuporteAdmin"));
const SeedData = lazy(() => import("./pages/SeedData"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - increased for less refetching
      gcTime: 30 * 60 * 1000, // 30 minutes - keep cache longer
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/install" element={<Install />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/demo/:role" element={<DemoView />} />
                
                {/* Common routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/qrcode" element={<ProtectedRoute allowedRoles={['professor', 'outro']}><QRCodePage /></ProtectedRoute>} />
                <Route path="/registro" element={<ProtectedRoute><Registro /></ProtectedRoute>} />
                <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/justificativas" element={<ProtectedRoute><Justificativas /></ProtectedRoute>} />
                
                {/* Director routes - only director can read QR codes */}
                <Route path="/leitor" element={<ProtectedRoute allowedRoles={['diretor', 'desenvolvedor']}><LeitorQRCode /></ProtectedRoute>} />
                
                {/* Registros do dia - admin can view daily records */}
                <Route path="/registros-dia" element={<ProtectedRoute allowedRoles={['administrador', 'desenvolvedor']}><RegistrosDia /></ProtectedRoute>} />
                
                {/* Escalas - coordenador, admin and developer */}
                <Route path="/escalas" element={<ProtectedRoute allowedRoles={['coordenador', 'administrador', 'desenvolvedor']}><Escalas /></ProtectedRoute>} />
                
                {/* Calendar - director, admin and developer */}
                <Route path="/calendario" element={<ProtectedRoute allowedRoles={['diretor', 'administrador', 'desenvolvedor']}><Calendario /></ProtectedRoute>} />
                
                {/* Funcionarios - viewing only for director, coordinator, secretary */}
                <Route path="/funcionarios" element={<ProtectedRoute allowedRoles={['diretor', 'coordenador', 'secretario', 'administrador', 'desenvolvedor']}><Funcionarios /></ProtectedRoute>} />
                
                {/* Reports - filtered by unit for director, coordinator, secretary */}
                <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['diretor', 'coordenador', 'secretario', 'administrador', 'desenvolvedor']}><Relatorios /></ProtectedRoute>} />
                
                <Route path="/aprovacoes" element={<ProtectedRoute allowedRoles={['diretor', 'coordenador', 'administrador', 'desenvolvedor']}><Aprovacoes /></ProtectedRoute>} />
                <Route path="/unidades" element={<ProtectedRoute allowedRoles={['diretor', 'administrador', 'desenvolvedor']}><Unidades /></ProtectedRoute>} />
                
                {/* Admin and Developer routes - director cannot add users */}
                <Route path="/usuarios" element={<ProtectedRoute allowedRoles={['administrador', 'desenvolvedor']}><Usuarios /></ProtectedRoute>} />
                <Route path="/dispositivos" element={<ProtectedRoute allowedRoles={['administrador', 'desenvolvedor']}><Dispositivos /></ProtectedRoute>} />
                <Route path="/seguranca" element={<ProtectedRoute allowedRoles={['administrador', 'desenvolvedor']}><Seguranca /></ProtectedRoute>} />
                
                {/* Support routes */}
                <Route path="/suporte" element={<ProtectedRoute allowedRoles={['professor', 'diretor', 'coordenador', 'secretario', 'administrador', 'outro']}><Suporte /></ProtectedRoute>} />
                <Route path="/suporte-admin" element={<ProtectedRoute allowedRoles={['desenvolvedor']}><SuporteAdmin /></ProtectedRoute>} />
                <Route path="/seed-data" element={<ProtectedRoute allowedRoles={['desenvolvedor']}><SeedData /></ProtectedRoute>} />
                <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['desenvolvedor', 'administrador']}><AuditLogs /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
