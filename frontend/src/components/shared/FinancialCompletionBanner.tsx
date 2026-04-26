import { useAuth } from "@/contexts/AuthContext";
import { useFinancialReadiness, type FinancialRole } from "@/hooks/use-financial-readiness";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { FinancialDataForm } from "@/components/checkout/FinancialDataForm";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  role: FinancialRole;
}

export function FinancialCompletionBanner({ role }: Props) {
  const { user } = useAuth();
  const { loading, isReady, completionPercent, missingFields, refetch } = useFinancialReadiness(role);
  const [showForm, setShowForm] = useState(false);

  if (loading || !user || isReady) return null;

  const isReceiver = role !== "player";
  const title = isReceiver
    ? "Ative sua conta financeira para receber pagamentos"
    : "Complete seus dados para pagamentos";
  const desc = isReceiver
    ? "Preencha seus dados financeiros para publicar mesas pagas e receber repasses."
    : "Adicione seu CPF/CNPJ para poder reservar mesas e assinar planos.";

  return (
    <>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
          <div className="flex items-center gap-2">
            <Progress value={completionPercent} className="h-1.5 flex-1 max-w-[200px]" />
            <span className="text-[10px] text-muted-foreground font-medium">{completionPercent}%</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
          onClick={() => setShowForm(true)}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Completar dados
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Dados financeiros
            </DialogTitle>
            <DialogDescription>
              {isReceiver
                ? "Preencha para ativar recebimentos na plataforma."
                : "Precisamos do seu CPF/CNPJ para processar pagamentos."}
            </DialogDescription>
          </DialogHeader>
          <FinancialDataForm
            role={role}
            missingFields={missingFields}
            onSaved={() => { setShowForm(false); refetch(); }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
