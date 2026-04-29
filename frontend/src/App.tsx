import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import HiveLayout from "@/layouts/HiveLayout";
import HivePage from "@/pages/Hive";
import Index from "@/pages/Index";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import OAuthCallback from "./pages/OAuthCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import BrandDashboard from "./pages/BrandDashboard";
import HiveAdmin from "./pages/HiveAdmin";
import ParaLojas from "./pages/ParaLojas";
import ParaMarcas from "./pages/ParaMarcas";
import QuemSomos from "./pages/QuemSomos";
import Contato from "./pages/Contato";
import Unsubscribe from "./pages/Unsubscribe";
import HelpCenter from "./pages/HelpCenter";
import FAQPage from "./pages/FAQPage";
import Interesse from "./pages/Interesse";
import CompletarPerfil from "./pages/CompletarPerfil";
import AdminPainel from "./pages/admin/AdminPainel";
import AdminInsights from "./pages/admin/AdminInsights";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCampaign from "./pages/admin/AdminCampaign";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSocialPublisher from "./pages/admin/AdminSocialPublisher";
import AdminFeedbackInsights from "./pages/admin/AdminFeedbackInsights";
import AdminCatalog from "./pages/admin/AdminCatalog";

const queryClient = new QueryClient();

function ProtectedRedirect({ to }: { to: string }) {
  return (
    <ProtectedRoute>
      <Navigate to={to} replace />
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public landing page */}
              <Route path="/" element={<Index />} />

              {/* Hive layout for authenticated users */}
              <Route element={<ProtectedRoute><HiveLayout /></ProtectedRoute>}>
                <Route path="/hive" element={<HivePage />} />
              </Route>

              {/* Redirects from legacy URLs to Hive */}
              <Route path="/feed" element={<ProtectedRedirect to="/hive?f=academy" />} />
              <Route path="/explorar" element={<ProtectedRedirect to="/hive?f=market" />} />
              <Route path="/buscar" element={<ProtectedRedirect to="/hive?f=market" />} />
              <Route path="/fichas" element={<ProtectedRedirect to="/hive?f=playground" />} />
              <Route path="/mensagens" element={<ProtectedRedirect to="/hive?f=network" />} />
              <Route path="/dashboard/jogador" element={<ProtectedRedirect to="/hive?f=home" />} />
              <Route path="/dashboard/mestre" element={<ProtectedRedirect to="/hive?f=home" />} />
              <Route path="/dashboard/loja" element={<ProtectedRedirect to="/hive?f=home" />} />
              <Route path="/perfil" element={<ProtectedRedirect to="/hive?f=home&overlay=profile" />} />
              <Route path="/editar-perfil" element={<ProtectedRedirect to="/hive?f=home&overlay=profile" />} />
              <Route path="/agenda" element={<ProtectedRedirect to="/hive?f=home&overlay=agenda" />} />
              <Route path="/notificacoes" element={<ProtectedRedirect to="/hive?f=home&overlay=notifications" />} />
              <Route path="/minhas-reservas" element={<ProtectedRedirect to="/hive?f=home&overlay=bookings" />} />
              <Route path="/favoritos" element={<ProtectedRedirect to="/hive?f=home&overlay=favorites" />} />
              <Route path="/conta" element={<ProtectedRedirect to="/hive?f=home&overlay=settings" />} />
              <Route path="/billing" element={<ProtectedRedirect to="/hive?f=market&overlay=billing" />} />
              <Route path="/checkout" element={<ProtectedRedirect to="/hive?f=market&overlay=checkout" />} />
              <Route path="/checkout/:planId" element={<ProtectedRedirect to="/hive?f=market&overlay=checkout" />} />
              <Route path="/precos" element={<ProtectedRedirect to="/hive?f=market&overlay=pricing" />} />
              <Route path="/boost" element={<ProtectedRedirect to="/hive?f=market&overlay=boost" />} />
              <Route path="/post/:slug" element={<ProtectedRedirect to="/hive?f=academy&overlay=post" />} />
              <Route path="/mestre/:slug" element={<ProtectedRedirect to="/hive?f=academy&overlay=mestre" />} />
              <Route path="/loja/:slug" element={<ProtectedRedirect to="/hive?f=academy&overlay=loja" />} />
              <Route path="/fichas/:id" element={<ProtectedRedirect to="/hive?f=playground&overlay=sheet" />} />
              <Route path="/mesa/:id/ficha" element={<ProtectedRedirect to="/hive?f=playground&overlay=sheet" />} />
              <Route path="/indicar" element={<ProtectedRedirect to="/hive?f=network&overlay=referral" />} />

              {/* Isolated flows */}
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/onboarding/:role" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/completar-perfil" element={<ProtectedRoute><CompletarPerfil /></ProtectedRoute>} />
              <Route path="/~oauth" element={<OAuthCallback />} />
              <Route path="/dashboard/marca" element={<ProtectedRoute allowedRoles={["brand"]}><BrandDashboard /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPainel /></ProtectedRoute>} />
              <Route path="/admin/insights" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInsights /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/campanha" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCampaign /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReviews /></ProtectedRoute>} />
              <Route path="/admin/social" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSocialPublisher /></ProtectedRoute>} />
              <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFeedbackInsights /></ProtectedRoute>} />
              <Route path="/admin/catalogo" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCatalog /></ProtectedRoute>} />
              <Route path="/hive_admin/:userId" element={<ProtectedRoute allowedRoles={["admin"]}><HiveAdmin /></ProtectedRoute>} />

              {/* Public pages */}
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos" element={<TermsOfService />} />
              <Route path="/ajuda" element={<HelpCenter />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/quem-somos" element={<QuemSomos />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/para-lojas" element={<ParaLojas />} />
              <Route path="/para-marcas" element={<ParaMarcas />} />
              <Route path="/interesse" element={<Interesse />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/erro" element={<ErrorPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
