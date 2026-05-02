import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const queryClient = new QueryClient();

const SafeComponent = dynamic(() => Promise.resolve((props: AppProps) => <props.Component {...props.pageProps} />), {
  ssr: false,
});

function MyApp(props: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <SafeComponent {...props} />
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
