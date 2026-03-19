import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ErrorPage from "./pages/ErrorPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import PlayerDashboard from "./pages/PlayerDashboard";
import GMDashboard from "./pages/GMDashboard";
import StoreDashboard from "./pages/StoreDashboard";
import Feed from "./pages/Feed";
import PostDetail from "./pages/PostDetail";
import ExploreMesas from "./pages/ExploreMesas";
import TableDetail from "./pages/TableDetail";
import Checkout from "./pages/Checkout";
import BoostDashboard from "./pages/BoostDashboard";
import Billing from "./pages/Billing";
import OAuthCallback from "./pages/OAuthCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import MestrePublicProfile from "./pages/MestrePublicProfile";
import LojaPublicProfile from "./pages/LojaPublicProfile";
import Notifications from "./pages/Notifications";
import Interesse from "./pages/Interesse";
import BrandDashboard from "./pages/BrandDashboard";
import Messages from "./pages/Messages";
import Agenda from "./pages/Agenda";
import AdminPainel from "./pages/admin/AdminPainel";
import AdminInsights from "./pages/admin/AdminInsights";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCampaign from "./pages/admin/AdminCampaign";
import AdminReviews from "./pages/admin/AdminReviews";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/erro" element={<ErrorPage />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos" element={<TermsOfService />} />
              <Route path="/~oauth" element={<OAuthCallback />} />
              <Route path="/interesse" element={<Interesse />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/onboarding/:role" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard/jogador" element={<ProtectedRoute><PlayerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/mestre" element={<ProtectedRoute><GMDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/loja" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/marca" element={<ProtectedRoute allowedRoles={["brand"]}><BrandDashboard /></ProtectedRoute>} />
              <Route path="/boost" element={<ProtectedRoute allowedRoles={["gm", "store"]}><BoostDashboard /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/mensagens" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/post/:slug" element={<PostDetail />} />
              <Route path="/explorar" element={<ExploreMesas />} />
              <Route path="/buscar" element={<ExploreMesas />} />
              <Route path="/mesa/:id" element={<TableDetail />} />
              <Route path="/mestre/:slug" element={<MestrePublicProfile />} />
              <Route path="/loja/:slug" element={<LojaPublicProfile />} />
              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPainel /></ProtectedRoute>} />
              <Route path="/admin/insights" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInsights /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/campanha" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCampaign /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReviews /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
