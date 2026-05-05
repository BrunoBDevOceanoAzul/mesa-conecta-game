import type { AppProps } from 'next/app';
import "@/index.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const PUBLIC_ROUTE_PATTERNS = [
  /^\/(?:Index)?$/,
  /^\/Login$/,
  /^\/Signup$/,
  /^\/Onboarding$/,
  /^\/CompletarPerfil$/,
  /^\/OAuthCallback$/,
  /^\/ResetPassword$/,
  /^\/PrivacyPolicy$/,
  /^\/TermsOfService$/,
  /^\/Unsubscribe$/,
  /^\/Contato$/,
  /^\/FAQPage$/,
  /^\/Interesse$/,
  /^\/ParaLojas$/,
  /^\/ParaMarcas$/,
  /^\/QuemSomos$/,
  /^\/PricingPage$/,
  /^\/404$/,
  /^\/_error$/,
];

const HIVE_ROUTE_PATTERNS = [
  /^\/hive$/,
];

const AUTHENTICATED_ROUTE_REDIRECTS: Record<string, string> = {
  "/": "/hive",
  "/Index": "/hive",
  "/explorar": "/hive?f=market",
  "/ExploreMesas": "/hive?f=market",
  "/buscar": "/hive?f=market",
  "/Feed": "/hive?f=academy",
  "/feed": "/hive?f=academy",
  "/Billing": "/hive?f=market&overlay=billing",
  "/billing": "/hive?f=market&overlay=billing",
  "/Agenda": "/hive?f=home&overlay=agenda",
  "/agenda": "/hive?f=home&overlay=agenda",
  "/MyBookings": "/hive?f=network&overlay=bookings",
  "/minhas-reservas": "/hive?f=network&overlay=bookings",
  "/Favorites": "/hive?f=network&overlay=favorites",
  "/favoritos": "/hive?f=network&overlay=favorites",
  "/Notifications": "/hive?f=network&overlay=notifications",
  "/notificacoes": "/hive?f=network&overlay=notifications",
  "/Messages": "/hive?f=network",
  "/mensagens": "/hive?f=network",
  "/CharacterSheets": "/hive?f=playground&overlay=sheet",
  "/fichas": "/hive?f=playground&overlay=sheet",
  "/PricingPage": "/hive?f=market&overlay=pricing",
  "/precos": "/hive?f=market&overlay=pricing",
  "/AccountSettings": "/hive?f=home&overlay=settings",
  "/conta": "/hive?f=home&overlay=settings",
  "/EditProfile": "/hive?f=home&overlay=profile",
  "/editar-perfil": "/hive?f=home&overlay=profile",
  "/BoostDashboard": "/hive?f=market&overlay=boost",
  "/boost": "/hive?f=market&overlay=boost",
  "/Checkout": "/hive?f=market&overlay=checkout",
};

function isRouteMatch(pathname: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(pathname));
}

function AuthenticatedHiveRoot({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const isHiveRoute = isRouteMatch(router.pathname, HIVE_ROUTE_PATTERNS);
  const isPublicRoute = isRouteMatch(router.pathname, PUBLIC_ROUTE_PATTERNS);
  const nextHiveRoute = AUTHENTICATED_ROUTE_REDIRECTS[router.pathname];
  const shouldStayOnIsolatedPublicRoute = isPublicRoute && !nextHiveRoute;
  const shouldRedirectToHive = Boolean(!loading && user && nextHiveRoute && !isHiveRoute && !shouldStayOnIsolatedPublicRoute);

  useEffect(() => {
    if (shouldRedirectToHive) {
      router.replace(nextHiveRoute);
    }
  }, [nextHiveRoute, router, shouldRedirectToHive]);

  if (!shouldRedirectToHive) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <AuthenticatedHiveRoot>
              <Component {...pageProps} />
            </AuthenticatedHiveRoot>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
