import { useConnectedAccount } from "@/hooks/use-connected-account";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, CheckCircle2, Clock, AlertTriangle, ArrowRight, Loader2, ExternalLink,
} from "lucide-react";

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  not_started: { label: "Não configurada", color: "bg-muted text-muted-foreground border-border", icon: <Wallet className="h-3.5 w-3.5" /> },
  pending: { label: "Pendente de ativação", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25", icon: <Clock className="h-3.5 w-3.5" /> },
  submitted: { label: "Em análise", color: "bg-blue-500/15 text-blue-400 border-blue-500/25", icon: <Clock className="h-3.5 w-3.5" /> },
  verified: { label: "Pronta para receber", color: "bg-green-500/15 text-green-400 border-green-500/25", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  restricted: { label: "Restrita", color: "bg-orange-500/15 text-orange-400 border-orange-500/25", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejeitada", color: "bg-red-500/15 text-red-400 border-red-500/25", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
};

export function ConnectStatusBlock() {
  const { loading, account, creating, isReady, isPending, needsOnboarding, createOrGetOnboardingLink } = useConnectedAccount();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-3" />
        <div className="h-4 w-48 bg-muted rounded" />
      </div>
    );
  }

  const status = account?.onboarding_status || "not_started";
  const cfg = statusLabels[status] || statusLabels.not_started;

  async function handleSetup() {
    const url = await createOrGetOnboardingLink();
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-secondary" />
              Conta de Recebimento
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isReady
                ? "Sua conta está pronta para receber pagamentos das reservas."
                : isPending
                ? "Conclua a configuração para começar a receber pelas reservas."
                : "Ative seu recebimento para receber pelas reservas na plataforma."}
            </p>
          </div>
          <Badge variant="outline" className={`${cfg.color} gap-1.5 px-2.5 py-1 text-[10px]`}>
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>

        {/* Status details */}
        {account && (
          <div className="grid grid-cols-3 gap-3">
            <StatusDot label="Cobranças" active={account.charges_enabled} />
            <StatusDot label="Saques" active={account.payouts_enabled} />
            <StatusDot label="Verificação" active={account.details_submitted} />
          </div>
        )}

        {/* CTA */}
        {!isReady && (
          <Button
            variant={needsOnboarding ? "hero" : "outline"}
            size="sm"
            className="w-full gap-2"
            onClick={handleSetup}
            disabled={creating}
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Configurando…</>
            ) : needsOnboarding ? (
              <><ArrowRight className="h-4 w-4" /> Ative seu recebimento</>
            ) : (
              <><ExternalLink className="h-4 w-4" /> Concluir configuração de recebimento</>
            )}
          </Button>
        )}

        {isReady && (
          <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <p className="text-xs text-green-400">
              Sua conta está pronta para receber. Pagamentos das reservas serão transferidos automaticamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border px-3 py-2">
      <span className={`h-2 w-2 rounded-full ${active ? "bg-green-400" : "bg-muted-foreground/40"}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
