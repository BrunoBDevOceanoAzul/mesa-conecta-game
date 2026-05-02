import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, ExternalLink } from "lucide-react";
import { useRouter } from "next/router";

interface Ambassador {
  id: string;
  name: string;
  role_label: string;
  avatar_url: string | null;
  profile_slug: string | null;
  profile_type: string | null;
  sort_order: number;
}

export function AmbassadorsSection() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("ambassadors")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setAmbassadors(data as Ambassador[]);
      });
  }, []);

  if (ambassadors.length === 0) return null;

  const roleColor = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes("mestre") || lower.includes("gm")) return "bg-amber-500/15 text-amber-400";
    if (lower.includes("loja") || lower.includes("store")) return "bg-emerald-500/15 text-emerald-400";
    if (lower.includes("jogador") || lower.includes("player")) return "bg-sky-500/15 text-sky-400";
    return "bg-primary/15 text-primary";
  };

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Subtle bg pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="container mx-auto max-w-5xl px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            <Users className="h-3.5 w-3.5" />
            Comunidade
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground text-wrap-balance">
            Embaixadores da HIVIUM
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm sm:text-base">
            Mestres, lojas e jogadores que fazem parte da nossa comunidade e ajudam a construir o ecossistema.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {ambassadors.map((amb, i) => (
            <motion.button
              key={amb.id}
              initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: 0.08 * i,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => {
                if (amb.profile_slug && amb.profile_type) {
                  router.push(`/${amb.profile_type === "store" ? "loja" : "mestre"}/${amb.profile_slug}`);
                }
              }}
              className={`group relative rounded-2xl border border-border/60 bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.97] ${
                amb.profile_slug ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Avatar */}
              <div className="mx-auto mb-3 h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-border/40 group-hover:border-primary/40 transition-colors bg-muted">
                {amb.avatar_url ? (
                  <img
                    src={amb.avatar_url}
                    alt={amb.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                    {amb.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold text-foreground truncate">{amb.name}</p>
              <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${roleColor(amb.role_label)}`}>
                {amb.role_label}
              </span>

              {amb.profile_slug && (
                <ExternalLink className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
