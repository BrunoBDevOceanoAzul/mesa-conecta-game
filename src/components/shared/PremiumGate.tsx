import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePrivileges } from "@/hooks/use-privileges";

interface PremiumGateProps {
  /** Feature name shown in the title */
  feature: string;
  /** Extra description below title */
  description?: string;
  /** If true, render children. If false, render the gate. */
  allowed: boolean;
  /** Whether the subscription data is still loading */
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps premium content and shows a blocking overlay when the user
 * doesn't have an active subscription.
 * Admin and Advisor always bypass the gate.
 */
export function PremiumGate({ feature, description, allowed, loading, children }: PremiumGateProps) {
  const navigate = useNavigate();
  const { isSuperUser } = usePrivileges();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-10 text-center animate-pulse">
        <div className="mx-auto h-10 w-10 rounded-xl bg-muted mb-3" />
        <div className="mx-auto h-4 w-40 rounded bg-muted mb-2" />
        <div className="mx-auto h-3 w-56 rounded bg-muted" />
      </div>
    );
  }

  // Super users (admin/advisor) always see premium content
  if (allowed || isSuperUser) return <>{children}</>;

  return (
    <div className="relative rounded-2xl border border-border bg-card overflow-hidden">
      {/* Blurred placeholder */}
      <div className="pointer-events-none select-none blur-[6px] opacity-30 p-6">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center max-w-sm px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-display font-bold text-foreground mb-2">
            {feature}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {description || "Este recurso faz parte dos planos ativos da HIVIUM. Ative seu plano para liberar recursos de operação e crescimento."}
          </p>
          <Button variant="gradient" size="sm" className="gap-2" onClick={() => navigate("/billing")}>
            <Sparkles className="h-4 w-4" /> Ver planos disponíveis
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline banner for premium features — lighter than PremiumGate.
 */
export function PremiumBanner({ message, ctaLabel }: { message?: string; ctaLabel?: string }) {
  const navigate = useNavigate();
  const { isSuperUser } = usePrivileges();

  // Don't show upgrade banners to super users
  if (isSuperUser) return null;

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 flex items-center gap-3">
      <Crown className="h-5 w-5 text-primary shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">
        {message || "Ative seu plano para desbloquear este recurso."}
      </p>
      <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/billing")}>
        {ctaLabel || "Ativar plano"} <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}
