import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Gift, PartyPopper, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const COUPON_CODE = "PERFIL25";

export function ProfileCouponBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [couponClaimed, setCouponClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    const key = `hivium_coupon_banner_${user.id}`;
    if (localStorage.getItem(key) === "claimed" || localStorage.getItem(key) === "dismissed") {
      setDismissed(true);
      return;
    }

    supabase
      .from("profiles")
      .select("city, bio, preferred_systems, avatar_url, onboarding_completed, role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (!data.role) return;

        const d = data as any;
        const fields = [d.city, d.bio, d.preferred_systems?.length, d.avatar_url];
        const filled = fields.filter(Boolean).length;
        const pct = Math.round((filled / fields.length) * 100);

        if (pct >= 80) {
          setProfileComplete(true);
        }
        setVisible(true);
      });
  }, [user?.id, dismissed]);

  const handleClaim = () => {
    if (!user) return;
    navigator.clipboard.writeText(COUPON_CODE);
    toast.success(`Cupom ${COUPON_CODE} copiado!`, {
      description: "Use na hora de assinar para ganhar 25% de desconto.",
    });
    setCouponClaimed(true);
    localStorage.setItem(`hivium_coupon_banner_${user.id}`, "claimed");
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (user) localStorage.setItem(`hivium_coupon_banner_${user.id}`, "dismissed");
  };

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative rounded-xl border border-secondary/30 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 p-5 mb-6 overflow-hidden"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {profileComplete ? (
            /* Profile complete — show coupon */
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                <PartyPopper className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  🎉 Perfil completo! Seu cupom está liberado
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Use o código abaixo na sua primeira assinatura e ganhe <strong className="text-secondary">25% de desconto</strong>.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {couponClaimed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary">
                      <Check className="h-3.5 w-3.5" /> Copiado!
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClaim}
                      className="text-xs h-8 px-4 border-secondary/30 hover:bg-secondary/10"
                    >
                      <Gift className="h-3.5 w-3.5 mr-1.5" />
                      Copiar cupom: <span className="font-mono font-bold ml-1">{COUPON_CODE}</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-3 text-primary"
                    onClick={() => router.push("/billing")}
                  >
                    Ver planos
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Profile incomplete — motivate */
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Complete seu perfil e ganhe 25% na primeira assinatura
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Finalize as informações do seu perfil para desbloquear um cupom exclusivo de desconto.
                </p>
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary text-xs h-8 px-4"
                    onClick={() => router.push("/onboarding")}
                  >
                    Completar perfil →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
