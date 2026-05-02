import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { bookingsApi } from "@/lib/api";
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
    mesa_type?: string;
    board_game_id?: string | null;
    system?: string;
    start_at?: string;
    end_at?: string | null;
    city?: string | null;
    venue?: string | null;
    format?: string;
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
  const router = useRouter();

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
  const isBoardGame = mesa.mesa_type === "community" || !!mesa.board_game_id;

  const loadData = useCallback(async () => {
    if (!user || !open) return;
    setPaymentResult(null);
    setPixCopied(false);

    // For free boardgames, skip all plan/limit checks — go straight to confirm
    if (isBoardGame && !isPaidMesa) {
      setStep("confirm");
      return;
    }

    setStep("loading");

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
  }, [user, open, isSuperUser, isBoardGame, isPaidMesa]);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

    // Free mesa: direct booking via API (transação atômica)
    const handleFreeBook = async () => {
      if (!user) return;
      setSubmitting(true);

      try {
        await bookingsApi.create({
          gameTableId: mesa.id,
          seatsReserved: 1,
          amount: "0",
          currency: "BRL",
          sourceType: "organic",
        });

      setStep("success");
      toast({ title: "Vaga reservada! 🎉", description: `Você está na mesa "${mesa.title}"` });
    } catch (err: any) {
      console.error("[BookingFlow] Booking error:", err);
      const msg = err?.message || "";
      if (msg.includes("already has") || msg.includes("duplicate")) {
        toast({ title: "Já reservado", description: "Você já tem uma reserva nesta mesa.", variant: "destructive" });
        onOpenChange(false);
        return;
      }
      if (msg.includes("Not enough")) {
        setErrorMsg("Não há vagas disponíveis nesta mesa.");
      } else {
        setErrorMsg(msg || "Erro ao reservar vaga");
      }
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
      // Use fetch directly to avoid SDK swallowing non-2xx response bodies
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-booking-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey || "",
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ mesa_id: mesa.id, billing_type: "PIX" }),
      });

      const data = await response.json();

      // Handle business errors from the response body
      const errorCode = data?.error_code || data?.error;
      if (errorCode === "MISSING_CPF_CNPJ" || errorCode === "missing_cpf_cnpj") {
        setStep("collect_cpf");
        return;
      }
      if (errorCode === "ASAAS_NOT_ALLOWED_IP") {
        throw new Error(data?.message || "Operadora bloqueando por IP.");
      }
      if (!response.ok || data?.error) {
        throw new Error(data?.message || data?.error || "Erro ao criar pagamento");
      }

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
    router.push(`/checkout?plan=${planCode}&role=player`);
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
                {isBoardGame ? (
                  <Sparkles className="h-5 w-5 text-secondary" />
                ) : isPaidMesa ? (
                  <CreditCard className="h-5 w-5 text-primary" />
                ) : (
                  <Ticket className="h-5 w-5 text-primary" />
                )}
                {isBoardGame
                  ? (isPaidMesa ? "Garantir vaga" : "Bora jogar? 🎲")
                  : (isPaidMesa ? "Reservar & Pagar" : "Confirmar Reserva")}
              </DialogTitle>
              {!isBoardGame && (
                <DialogDescription>
                  Você está reservando uma vaga na mesa <strong>{mesa.title}</strong>
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Boardgame: ultra-compact summary */}
              {isBoardGame ? (
                <div className="rounded-xl bg-muted/50 border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🎲</div>
                    <div>
                      <h3 className="font-display font-bold text-foreground text-base">{mesa.system || mesa.title}</h3>
                      {mesa.start_at && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(mesa.start_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                          {" · "}
                          {new Date(mesa.start_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(mesa.venue || mesa.city) && (
                      <span className="flex items-center gap-1">📍 {mesa.venue || mesa.city}</span>
                    )}
                    <span className="flex items-center gap-1">👥 {mesa.seats_available} vaga{mesa.seats_available !== 1 ? "s" : ""}</span>
                    {mesa.min_price > 0 && (
                      <span className="font-semibold text-foreground">R$ {mesa.min_price.toFixed(2).replace(".", ",")}</span>
                    )}
                  </div>
                </div>
              ) : (
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
              )}

              {isPaidMesa && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <QrCode className="h-3.5 w-3.5" />
                    Pagamento via PIX — instantâneo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isBoardGame
                      ? "Vaga confirmada na hora após o pagamento."
                      : "Ao confirmar, será gerado um QR Code PIX para pagamento. Sua vaga será confirmada automaticamente após o pagamento."}
                  </p>
                </div>
              )}

              {!isBoardGame && !isSuperUser && remainingSlots !== null && (
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
                variant={isBoardGame ? "hero" : "gradient"}
                size="lg"
                className="w-full gap-2"
                disabled={submitting}
                onClick={handleBook}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPaidMesa ? (
                  <QrCode className="h-4 w-4" />
                ) : isBoardGame ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting
                  ? "Processando…"
                  : isPaidMesa
                  ? `Pagar R$ ${mesa.min_price.toFixed(2).replace(".", ",")} via PIX`
                  : isBoardGame
                  ? "Confirmar presença"
                  : "Confirmar Reserva"}
              </Button>

              {isBoardGame && !isPaidMesa && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Sem cobrança • você pode cancelar a qualquer momento
                </p>
              )}
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
                {isBoardGame
                  ? <>Você está na partida <strong>{mesa.title}</strong>. Nos vemos lá! 🎲</>
                  : <>Você está confirmado na mesa <strong>{mesa.title}</strong>. Prepare-se para a aventura!</>}
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
