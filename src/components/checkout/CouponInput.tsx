import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Loader2, CheckCircle2, XCircle, Percent, DollarSign } from "lucide-react";

interface ValidatedCoupon {
  id: string;
  public_code: string;
  discount_type: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string;
  duration_type: string;
  duration_in_months: number | null;
  stripe_promotion_code_id: string | null;
}

interface CouponInputProps {
  planId?: string;
  onCouponApplied: (coupon: ValidatedCoupon | null) => void;
}

export function CouponInput({ planId, onCouponApplied }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleValidate() {
    if (!code.trim()) return;
    setValidating(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke("validate-coupon", {
      body: { code: code.trim(), plan_id: planId },
    });

    setValidating(false);

    if (fnError) {
      setError("Erro ao validar cupom. Tente novamente.");
      return;
    }

    if (data?.valid && data.coupon) {
      setAppliedCoupon(data.coupon);
      onCouponApplied(data.coupon);
      setError(null);
    } else {
      setError(data?.reason || "Cupom inválido.");
      setAppliedCoupon(null);
      onCouponApplied(null);
    }
  }

  function handleRemove() {
    setAppliedCoupon(null);
    setCode("");
    setError(null);
    onCouponApplied(null);
  }

  if (appliedCoupon) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Cupom aplicado</span>
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/25 gap-1">
              {appliedCoupon.discount_type === "percent" ? (
                <><Percent className="h-2.5 w-2.5" /> {appliedCoupon.percent_off}% OFF</>
              ) : (
                <><DollarSign className="h-2.5 w-2.5" /> R${((appliedCoupon.amount_off || 0) / 100).toFixed(2)} OFF</>
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{appliedCoupon.public_code}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={handleRemove}>
          Remover
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Código do cupom"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            className="pl-10 uppercase"
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />
        </div>
        <Button variant="outline" size="default" onClick={handleValidate} disabled={validating || !code.trim()}>
          {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <XCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}
