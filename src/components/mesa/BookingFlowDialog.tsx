import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePrivileges } from "@/hooks/use-privileges";
import { useFinancialReadiness } from "@/hooks/use-financial-readiness";
import { useToast } from "@/hooks/use-toast";
import { FinancialDataForm } from "@/components/checkout/FinancialDataForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Check, Sparkles, Crown, Ticket, ArrowRight, AlertTriangle, CreditCard, Copy, QrCode, ExternalLink,
} from "lucide-react";

interface BookingFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesa: {
    id: string;
    title: string;
    gm_id: string;
    gm_name: string;
    min_price: number;
    seats_available: number;
    seats_total: number;
  };
}

interface PlayerPlan {
  code: string;
  name: string;
  reservation_limit: number | null;
  price_monthly: number;
  stripe_price_id: string | null;
}

interface PaymentResult {
  booking_id: string;
  asaas_id: string;
  status: string;
  billing_type: string;
  invoice_url: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  pix_expiration: string | null;
  due_date: string;
  amount: number;
}

type FlowStep = "loading" | "confirm" | "limit_reached" | "collect_cpf" | "payment" | "success" | "error";

export function BookingFlowDialog({ open, onOpenChange, mesa }: BookingFlowDialogProps) {
  const { user } = useAuth();
  const { isSuperUser } = usePrivileges();
  const { isReady: isFinancialReady, missingFields, refetch: refetchFinancial } = useFinancialReadiness("player");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<FlowStep>("loading");
  const [bookingCount, setBookingCount] = useState(0);
  const [reservationLimit, setReservationLimit] = useState<number | null>(null);
  const [playerPlans, setPlayerPlans] = useState<PlayerPlan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  const isPaidMesa = mesa.min_price > 0;

  const loadData = useCallback(async () => {
    if (!user || !open) return;
    setStep("loading");
    setPaymentResult(null);
    setPixCopied(false);

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [bookingsRes, subRes, plansRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("player_user_id", user.id)
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd),
        supabase
          .from("asaas_subscriptions")
          .select("billing_product_id, status, next_due_date")
          .eq("user_id", user.id)
          .eq("status", "ACTIVE")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("billing_products")
          .select("code, name, price_cents, feature_flags, stripe_price_id")
          .eq("is_active", true)
          .eq("target_role", "player")
          .eq("product_type", "subscription")
          .order("sort_order"),
      ]);

      const count = bookingsRes.count ?? 0;
      setBookingCount(count);

      let limit: number | null = null;
      const sub = subRes.data;

      if (sub && sub.billing_product_id) {
        const { data: planData } = await supabase
          .from("billing_products")
          .select("name, feature_flags")
          .eq("id", sub.billing_product_id)
          .maybeSingle();

        if (planData) {
          setCurrentPlanName(planData.name);
          const flags = planData.feature_flags as Record<string, unknown> | null;
          if (flags?.reservation_limit && typeof flags.reservation_limit === "number") {
            limit = flags.reservation_limit;
          }
        }
      } else {
        limit = 1;
        setCurrentPlanName(null);
      }

      setReservationLimit(limit);

      const parsed: PlayerPlan[] = ((plansRes.data || []) as any[])
        .filter((p: any) => p.price_cents > 0)
        .map((p: any) => ({
          code: p.code,
          name: p.name,
          reservation_limit: (p.feature_flags as any)?.reservation_limit ?? null,
          price_monthly: p.price_cents,
          stripe_price_id: p.stripe_price_id,
        }));
      setPlayerPlans(parsed);

      if (isSuperUser) {
        setStep("confirm");
        return;
      }

      if (limit === -1 || limit === null) {
        setStep("confirm");
      } else if (count >= limit) {
        setStep("limit_reached");
      } else {
        setStep("confirm");
      }
    } catch (err) {
      console.error("[BookingFlow] Error loading data:", err);
      setErrorMsg("Erro ao carregar dados. Tente novamente.");
      setStep("error");
    }
  }, [user, open, isSuperUser]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  // Free mesa: direct booking
  const handleFreeBook = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("bookings")
        .select("id")
        .eq("game_table_id", mesa.id)
        .eq("player_user_id", user.id)
        .neq("status", "canceled")
        .maybeSingle();

      if (existing) {
        toast({ title: "Já reservado", description: "Você já tem uma reserva nesta mesa.", variant: "destructive" });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase.from("bookings").insert({
        game_table_id: mesa.id,
        player_user_id: user.id,
        gm_user_id: mesa.gm_id,
        seats_reserved: 1,
        status: "confirmed",
        amount: 0,
        currency: "brl",
        payment_status: isSuperUser ? "bypassed" : "free",
        source_type: "platform",
        booked_at: new Date().toISOString(),
      });

      if (error) throw error;

      await supabase
        .from("mesas")
        .update({ seats_available: mesa.seats_available - 1 })
        .eq("id", mesa.id);

      setStep("success");
      toast({ title: "Vaga reservada! 🎉", description: `Você está na mesa "${mesa.title}"` });
    } catch (err: any) {
      console.error("[BookingFlow] Booking error:", err);
      setErrorMsg(err?.message || "Erro ao reservar vaga");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  // Paid mesa: Asaas payment (PIX by default)
  const handlePaidBook = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-booking-checkout", {
        body: { mesa_id: mesa.id, billing_type: "PIX" },
      });

      // Handle structured missing CPF error (422 returned as FunctionsHttpError)
      if (error) {
        // supabase.functions.invoke puts 4xx/5xx body in `data` when available
        const errorBody = data || {};
        const errorCode = errorBody?.error_code || errorBody?.error;
        if (errorCode === "MISSING_CPF_CNPJ" || errorCode === "missing_cpf_cnpj") {
          setStep("collect_cpf");
          return;
        }
        // Also check if the error message itself hints at missing CPF
        const msg = error?.message || "";
        if (msg.includes("non-2xx") || msg.includes("422")) {
          // Likely a CPF issue that wasn't parsed — fallback to collect_cpf
          setStep("collect_cpf");
          return;
        }
        throw new Error(errorBody?.message || error.message || "Erro ao criar pagamento");
      }
      if (data?.error_code === "MISSING_CPF_CNPJ" || data?.error === "missing_cpf_cnpj") {
        setStep("collect_cpf");
        return;
      }
      if (data?.error) throw new Error(data.message || data.error);

      setPaymentResult(data as PaymentResult);
      setStep("payment");
      toast({ title: "Pagamento criado!", description: "Escaneie o QR Code ou copie o código PIX." });
    } catch (err: any) {
      console.error("[BookingFlow] Checkout error:", err);
      setErrorMsg(err?.message || "Erro ao iniciar pagamento. Tente novamente.");
      setStep("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBook = () => {
    if (isPaidMesa) {
      // Pre-check financial readiness before calling edge function
      if (!isFinancialReady) {
        setStep("collect_cpf");
        return;
      }
      handlePaidBook();
    } else {
      handleFreeBook();
    }
  };

  const handleCopyPix = () => {
    if (paymentResult?.pix_copy_paste) {
      navigator.clipboard.writeText(paymentResult.pix_copy_paste);
      setPixCopied(true);
      toast({ title: "Código PIX copiado!" });
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const handleUpgrade = (planCode: string) => {
    onOpenChange(false);
    navigate(`/checkout?plan=${planCode}&role=player`);
  };

  const remainingSlots = reservationLimit && reservationLimit > 0 ? Math.max(0, reservationLimit - bookingCount) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando sua conta…</p>
          </div>
        )}

        {/* Confirm booking */}
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                {isPaidMesa ? (
                  <CreditCard className="h-5 w-5 text-primary" />
                ) : (
                  <Ticket className="h-5 w-5 text-primary" />
                )}
                {isPaidMesa ? "Reservar & Pagar" : "Confirmar Reserva"}
              </DialogTitle>
              <DialogDescription>
                Você está reservando uma vaga na mesa <strong>{mesa.title}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mesa</span>
                  <span className="font-medium text-foreground">{mesa.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mestre</span>
                  <span className="font-medium text-foreground">{mesa.gm_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-medium text-foreground">
                    {mesa.min_price === 0 ? "Grátis" : `R$ ${mesa.min_price.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
              </div>

              {isPaidMesa && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    Pagamento via PIX — instantâneo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ao confirmar, será gerado um QR Code PIX para pagamento. Sua vaga será confirmada automaticamente após o pagamento.
                  </p>
                </div>
              )}

              {!isSuperUser && remainingSlots !== null && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">
                    {remainingSlots - 1 === 0
                      ? "Esta é sua última reserva gratuita deste mês"
                      : `Você ainda tem ${remainingSlots - 1} reserva(s) disponíveis este mês`}
                  </span>
                </div>
              )}

              {isSuperUser && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Crown className="h-3 w-3" /> Admin — sem limites
                </Badge>
              )}

              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
                disabled={submitting}
                onClick={handleBook}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPaidMesa ? (
                  <QrCode className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting
                  ? "Gerando pagamento…"
                  : isPaidMesa
                  ? `Pagar R$ ${mesa.min_price.toFixed(2).replace(".", ",")} via PIX`
                  : "Confirmar Reserva"}
              </Button>
            </div>
          </>
        )}

        {/* PIX Payment step */}
        {step === "payment" && paymentResult && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-primary">
                <QrCode className="h-5 w-5" />
                Pague com PIX
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code ou copie o código para pagar R$ {paymentResult.amount.toFixed(2).replace(".", ",")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* QR Code */}
              {paymentResult.pix_qr_code && (
                <div className="flex justify-center">
                  <div className="rounded-xl border border-border bg-white p-4">
                    <img
                      src={`data:image/png;base64,${paymentResult.pix_qr_code}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Copy PIX code */}
              {paymentResult.pix_copy_paste && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={paymentResult.pix_copy_paste}
                      className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 border border-border truncate text-foreground"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPix}
                      className="gap-1.5 shrink-0"
                    >
                      {pixCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {pixCopied ? "Copiado!" : "Copiar"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Invoice link fallback */}
              {paymentResult.invoice_url && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(paymentResult.invoice_url!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir fatura completa
                </Button>
              )}

              <div className="rounded-xl bg-secondary/10 border border-secondary/20 p-3 space-y-1">
                <p className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Confirmação automática
                </p>
                <p className="text-xs text-muted-foreground">
                  Após o pagamento, sua vaga será confirmada automaticamente. Você receberá uma notificação.
                </p>
              </div>

              {paymentResult.pix_expiration && (
                <p className="text-xs text-muted-foreground text-center">
                  ⏰ PIX válido até {new Date(paymentResult.pix_expiration).toLocaleString("pt-BR")}
                </p>
              )}

              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Fechar — já paguei
              </Button>
            </div>
          </>
        )}

        {/* Collect financial data */}
        {step === "collect_cpf" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Ative seus pagamentos
              </DialogTitle>
              <DialogDescription>
                Para reservar <strong>{mesa.title}</strong>, precisamos de alguns dados exigidos pela operadora de pagamento. Você só precisa preencher isso uma vez.
              </DialogDescription>
            </DialogHeader>
            <FinancialDataForm
              role="player"
              missingFields={missingFields}
              onSaved={() => {
                refetchFinancial();
                toast({ title: "Dados salvos! ✅", description: "Continuando com o pagamento…" });
                handlePaidBook();
              }}
              onCancel={() => onOpenChange(false)}
            />
          </>
        )}

        {/* Limit reached */}
        {step === "limit_reached" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Limite de reservas atingido
              </DialogTitle>
              <DialogDescription>
                {currentPlanName
                  ? `Seu plano ${currentPlanName} permite ${reservationLimit} reserva(s)/mês e você já usou todas.`
                  : `Você já usou sua reserva gratuita deste mês.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Faça upgrade para continuar jogando! Confira os planos disponíveis:
              </p>

              <div className="space-y-2">
                {playerPlans
                  .filter((p) => {
                    if (!reservationLimit) return true;
                    return (p.reservation_limit ?? 0) > reservationLimit || p.reservation_limit === -1;
                  })
                  .map((plan) => (
                    <button
                      key={plan.code}
                      onClick={() => handleUpgrade(plan.code)}
                      className="w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all p-4 text-left flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plan.reservation_limit === -1
                            ? "Reservas ilimitadas"
                            : `Até ${plan.reservation_limit} reservas/mês`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-bold text-primary">
                          R${(plan.price_monthly / 100).toFixed(2).replace(".", ",")}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
              </div>

              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Voltar
              </Button>
            </div>
          </>
        )}

        {/* Success */}
        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2 text-secondary">
                <Check className="h-5 w-5" />
                Vaga reservada!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Você está confirmado na mesa <strong>{mesa.title}</strong>. Prepare-se para a aventura!
              </p>
              <Button variant="hero" onClick={() => onOpenChange(false)}>
                Entendido
              </Button>
            </div>
          </>
        )}

        {/* Error */}
        {step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-destructive">Erro</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                <Button className="flex-1" onClick={loadData}>
                  Tentar novamente
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
