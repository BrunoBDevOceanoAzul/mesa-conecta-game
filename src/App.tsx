import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import PlayerDashboard from "./pages/PlayerDashboard";
import GMDashboard from "./pages/GMDashboard";
import StoreDashboard from "./pages/StoreDashboard";
import Feed from "./pages/Feed";
import TableSearch from "./pages/TableSearch";
import TableDetail from "./pages/TableDetail";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/onboarding/:role" element={<Onboarding />} />
          <Route path="/dashboard/jogador" element={<PlayerDashboard />} />
          <Route path="/dashboard/mestre" element={<GMDashboard />} />
          <Route path="/dashboard/loja" element={<StoreDashboard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/buscar" element={<TableSearch />} />
          <Route path="/mesa/:id" element={<TableDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
