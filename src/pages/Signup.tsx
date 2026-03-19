import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Crown, Store, Megaphone, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { resolveRedirect } from "@/lib/auth-redirect";
import type { UserRole } from "@/data/mock";
import logoImg from "@/assets/hivium-logo.png";
import { motion, AnimatePresence } from "framer-motion";

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

const roles: { role: UserRole; icon: typeof Gamepad2; label: string; desc: string }[] = [
  { role: "player", icon: Gamepad2, label: "Jogador", desc: "Encontrar e jogar em mesas" },
  { role: "gm", icon: Crown, label: "Mestre", desc: "Narrar e gerenciar mesas" },
  { role: "store", icon: Store, label: "Luderia", desc: "Organizar eventos e mesas" },
  { role: "brand", icon: Megaphone, label: "Marca", desc: "Anunciar para a comunidade" },
];

const roleToDash: Record<UserRole, string> = {
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
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
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
      // Popup flow completed
      if (!result?.redirected) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const dest = await resolveRedirect(user.id, user.user_metadata?.role);
          navigate(dest);
        }
      }
      // If redirected, OAuthCallback handles everything
    } catch {
      toast({ title: "Erro com Google", description: "Falha na autenticação. Tente novamente.", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      setLoading(false);
      setSelectedRole(null);
      return;
    }

    if (data.user && !data.session) {
      toast({ title: "Verifique seu email ✉️", description: "Enviamos um link de confirmação para " + email });
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate(roleToDash[role]);
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
            {step === "info" ? "Crie sua conta" : "Escolha seu perfil"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "info" ? "Junte-se ao ecossistema tabletop mais inteligente do Brasil." : "Isso define sua experiência. Pode mudar depois."}
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
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    disabled={loading}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selectedRole === r.role ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/20"
                    } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      {loading && selectedRole === r.role ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <r.icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-foreground text-sm">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep("info")} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
