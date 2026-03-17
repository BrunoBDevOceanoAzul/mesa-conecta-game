import { Lock, Sparkles, Gift, Crown, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { BoostEligibilityStatus } from "@/hooks/use-boost-eligibility";

interface BoostGateCardProps {
  status: BoostEligibilityStatus;
  userRole: string | null;
  founderFreeRemaining?: number;
  founderExpiresAt?: string | null;
  planName?: string | null;
}

export function BoostGateCard({ status, userRole, founderFreeRemaining = 0, founderExpiresAt, planName }: BoostGateCardProps) {
  const navigate = useNavigate();

  // Not eligible at all (player, brand, not logged in)
  if (status === "not_eligible") {
    return null; // Don't show anything for non-eligible roles
  }

  // No active plan
  if (status === "no_plan") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-5">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-lg font-display font-bold text-foreground mb-2">
          Destaque exclusivo para assinantes
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          O destaque de mesas e publicações está disponível para assinantes ativos.
          Ative seu plano para liberar recursos de crescimento dentro da HIVIUM.
        </p>
        <Button
          variant="gradient"
          size="lg"
          className="mt-6 gap-2"
          onClick={() => navigate("/#planos")}
        >
          <Crown className="h-4 w-4" /> Ver planos disponíveis
        </Button>
      </div>
    );
  }

  // Founder with free grants
  if (status === "eligible_founder_free") {
    const expiresFormatted = founderExpiresAt
      ? new Date(founderExpiresAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      : "";

    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/15 shrink-0">
            <Gift className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-display font-bold text-secondary">Founder Benefit ativo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você tem <span className="font-bold text-secondary">{founderFreeRemaining} destaque{founderFreeRemaining !== 1 ? "s" : ""} gratuito{founderFreeRemaining !== 1 ? "s" : ""}</span> restante{founderFreeRemaining !== 1 ? "s" : ""} este mês.
            </p>
            {expiresFormatted && (
              <p className="text-[11px] text-muted-foreground/70 mt-1">Benefício válido até {expiresFormatted}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Founder exhausted monthly grants
  if (status === "eligible_founder_exhausted") {
    return (
      <div className="rounded-2xl border border-secondary/20 bg-card p-5">
        <div className="flex items-center gap-3">
          <Gift className="h-5 w-5 text-secondary/60 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Destaques gratuitos esgotados este mês</p>
            <p className="text-xs text-muted-foreground mt-0.5">Você pode continuar destacando usando créditos da sua carteira.</p>
          </div>
        </div>
      </div>
    );
  }

  // Founder expired
  if (status === "eligible_founder_expired") {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-3">
          <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Seu benefício Founder expirou. Continue destacando suas mesas com créditos.
          </p>
        </div>
      </div>
    );
  }

  // eligible_with_plan — show a subtle ready state
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Destaque ativo</p>
          <p className="text-xs text-muted-foreground">
            Plano <span className="font-medium text-foreground">{planName}</span> — ferramentas de visibilidade liberadas.
          </p>
        </div>
      </div>
    </div>
  );
}
