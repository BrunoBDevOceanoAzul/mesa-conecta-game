import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {this.props.fallbackMessage || "Ocorreu um erro inesperado. Tente recarregar a página."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.replace("/")}
              >
                <Home className="h-4 w-4" />
                Início
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
