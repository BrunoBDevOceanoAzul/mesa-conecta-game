import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Crown, Store, Megaphone, Loader2, ArrowRight, Swords, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { resolveRedirect } from "@/lib/auth-redirect";
import logoImg from "@/assets/hivium-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

interface RoleOption {
  id: string;
  role: string;       // saved to DB as primary_role
  canPlay: boolean;
  canGm: boolean;
  icon: typeof Gamepad2;
  label: string;
  desc: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "player",
    role: "player",
    canPlay: true,
    canGm: false,
    icon: Gamepad2,
    label: "Jogador",
    desc: "Quero encontrar mesas, campanhas e grupos para jogar.",
  },
  {
    id: "gm",
    role: "gm",
    canPlay: false,
    canGm: true,
    icon: Crown,
    label: "Mestre",
    desc: "Quero criar mesas, conduzir sessões e encontrar jogadores.",
  },
  {
    id: "gm_player",
    role: "gm",
    canPlay: true,
    canGm: true,
    icon: Swords,
    label: "Mestre que também joga",
    desc: "Quero mestrar, mas também participar de mesas como jogador.",
  },
  {
    id: "player_gm",
    role: "player",
    canPlay: true,
    canGm: true,
    icon: Users,
    label: "Jogador que também mestra",
    desc: "Jogo com frequência, mas também posso abrir mesas como mestre.",
  },
];

const roleToDash: Record<string, string> = {
  player: "/onboarding/jogador",
  gm: "/onboarding/mestre",
  store: "/onboarding/loja",
  brand: "/dashboard/marca",
};

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "role">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("role");
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/~oauth",
      });
      if (result?.error) {
        toast({ title: "Erro com Google", description: "Falha na autenticação. Tente novamente.", variant: "destructive" });
        setGoogleLoading(false);
        return;
      }
      if (!result?.redirected) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dest = await resolveRedirect(user.id, user.user_metadata?.role);
          navigate(dest);
        }
      }
    } catch {
      toast({ title: "Erro com Google", description: "Falha na autenticação. Tente novamente.", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSelect = async (option: RoleOption) => {
    setSelectedId(option.id);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: option.role,
          can_play: option.canPlay,
          can_gm: option.canGm,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      setSelectedId(null);
      return;
    }

    if (data.user && !data.session) {
      toast({ title: "Verifique seu email ✉️", description: "Enviamos um link de confirmação para " + email });
      setLoading(false);
      return;
    }

    if (data.session) {
      // Update profile with can_play/can_gm
      await supabase
        .from("profiles")
        .update({ can_play: option.canPlay, can_gm: option.canGm } as any)
        .eq("user_id", data.user!.id);

      navigate(roleToDash[option.role] || "/onboarding/jogador");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2.5 mb-8">
            <img src={logoImg} alt="HIVIUM" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-base gradient-text">HIVIUM</span>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {step === "info" ? "Crie sua conta" : "Como você quer usar a HIVIUM?"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "info"
              ? "Junte-se ao ecossistema tabletop mais inteligente do Brasil."
              : "Escolha o que melhor te define. Isso personaliza toda a experiência."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "info" ? (
            <motion.div key="info" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <Button
                variant="outline"
                className="w-full mb-5 gap-2 h-11"
                onClick={handleGoogleSignup}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
                Continuar com Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground/60">ou</span></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="field-label">Nome</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" placeholder="Seu nome ou apelido" required />
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="seu@email.com" required />
                </div>
                <div>
                  <label className="field-label">Senha</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
                <Button variant="default" className="w-full h-11" type="submit">
                  Continuar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="role" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <div className="grid gap-3">
                {roleOptions.map((opt, i) => {
                  const isSelected = selectedId === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => handleRoleSelect(opt)}
                      disabled={loading}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                        isSelected
                          ? "border-primary bg-primary/8 shadow-[0_0_20px_hsl(var(--primary)_/_0.1)]"
                          : "border-border/60 bg-card/50 hover:border-primary/30 hover:bg-card/80",
                        loading && !isSelected && "opacity-50 pointer-events-none"
                      )}
                    >
                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-3 right-3 h-5 w-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/20"
                      )}>
                        {isSelected && (
                          loading
                            ? <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                            : <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                        )}
                      </div>

                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
                        isSelected
                          ? "bg-primary/15 text-primary shadow-[0_0_15px_hsl(var(--primary)_/_0.12)]"
                          : "bg-primary/8 text-primary group-hover:bg-primary/12"
                      )}>
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-display font-bold text-foreground text-[15px]">{opt.label}</h3>
                        <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Extra roles link */}
              <p className="text-center text-[11px] text-muted-foreground/60 mt-4">
                Lojas e marcas?{" "}
                <button
                  onClick={() => {/* Could expand to show store/brand options */}}
                  className="text-primary/70 hover:text-primary underline"
                >
                  Clique aqui
                </button>
              </p>

              <button onClick={() => setStep("info")} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors block mx-auto">
                ← Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Entrar</button>
        </p>
      </div>
    </div>
  );
}
