import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import PlayerDashboard from "./pages/PlayerDashboard";
import GMDashboard from "./pages/GMDashboard";
import StoreDashboard from "./pages/StoreDashboard";
import Feed from "./pages/Feed";
import ExploreMesas from "./pages/ExploreMesas";
import TableDetail from "./pages/TableDetail";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/onboarding/:role" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard/jogador" element={<ProtectedRoute><PlayerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/mestre" element={<ProtectedRoute><GMDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/loja" element={<ProtectedRoute><StoreDashboard /></ProtectedRoute>} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/buscar" element={<TableSearch />} />
            <Route path="/mesa/:id" element={<TableDetail />} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
