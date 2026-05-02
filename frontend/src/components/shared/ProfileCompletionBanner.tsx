import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileData {
  city?: string | null;
  bio?: string | null;
  preferred_systems?: string[] | null;
  play_style?: string[] | null;
  avatar_url?: string | null;
}

export function ProfileCompletionBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || dismissed) return;
    const key = `hivium_profile_banner_${user.id}`;
    if (sessionStorage.getItem(key) === "dismissed") {
      setDismissed(true);
      return;
    }

    supabase
      .from("profiles")
      .select("city, bio, preferred_systems, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const p = data as any;
        const fields = [p.city, p.bio, p.preferred_systems?.length, p.avatar_url];
        const filled = fields.filter(Boolean).length;
        const pct = Math.round((filled / fields.length) * 100);
        setPercent(pct);
        if (pct < 80) setVisible(true);
      });
  }, [user?.id, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (user) sessionStorage.setItem(`hivium_profile_banner_${user.id}`, "dismissed");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6"
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Complete seu perfil e receba recomendações melhores
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seu perfil está {percent}% completo — adicione mais informações para melhorar sua experiência.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary text-xs h-7 px-3"
                  onClick={() => router.push("/onboarding")}
                >
                  Completar
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
