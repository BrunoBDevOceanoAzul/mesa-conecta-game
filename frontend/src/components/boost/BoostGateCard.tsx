import { Lock, Sparkles, Gift, Crown, Store, ArrowRight } from "lucide-react";
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
    return null;
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
          Os recursos de destaque estão disponíveis para assinantes ativos.
          Ative seu plano para liberar ferramentas de crescimento dentro da HIVIUM.
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
            <h3 className="text-base font-display font-bold text-secondary">Benefício Founder ativo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você possui <span className="font-bold text-secondary">{founderFreeRemaining} destaque{founderFreeRemaining !== 1 ? "s" : ""} mensal{founderFreeRemaining !== 1 ? "is" : ""} de cortesia</span> durante os 3 primeiros meses.
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
            <p className="text-sm font-medium text-foreground">Sua cortesia mensal já foi utilizada.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Você ainda pode ativar novos destaques com créditos.</p>
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
            Seu benefício inicial foi concluído. Continue usando destaque por meio de créditos.
          </p>
        </div>
      </div>
    );
  }

  // Store with plan
  if (status === "eligible_store_with_plan") {
    return (
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <Store className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Destaque ativo para sua Luderia</p>
            <p className="text-xs text-muted-foreground">
              Plano <span className="font-medium text-foreground">{planName}</span> — dê mais visibilidade às suas mesas e publicações.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // eligible_with_plan — GM with plan, ready state
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Destaque ativo</p>
          <p className="text-xs text-muted-foreground">
            Plano <span className="font-medium text-foreground">{planName}</span> — ative destaque por 7 dias e amplie seu alcance dentro da HIVIUM.
          </p>
        </div>
      </div>
    </div>
  );
}