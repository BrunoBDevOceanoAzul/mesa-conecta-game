import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate, type Location as RouterLocation } from "react-router-dom";
import { Gamepad2, Crown, Store, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import logoImg from "@/assets/hivium-logo.png";
import { motion } from "framer-motion";
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

const roleOptions = [
  { value: "player", label: "Jogador", desc: "Quero encontrar mesas e jogar", icon: Gamepad2, color: "border-teal-400/40 text-teal-500 bg-teal-500/8" },
  { value: "gm", label: "Mestre", desc: "Quero criar mesas e conduzir sessões", icon: Crown, color: "border-plum-400/40 text-plum-500 bg-plum-500/8" },
  { value: "store", label: "Loja / Parceiro", desc: "Quero organizar eventos e ativações", icon: Store, color: "border-coral-400/40 text-coral-400 bg-coral-400/8" },
  { value: "curious", label: "Curioso / Entusiasta", desc: "Quero explorar e entender o ecossistema", icon: Sparkles, color: "border-primary/40 text-primary bg-primary/8" },
] as const;

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const roleConfig = roleOptions.find((r) => r.value === selectedRole);

  const canPlay = selectedRole === "player" || selectedRole === "curious";
  const canGm = selectedRole === "gm";
  const canManageStore = selectedRole === "store";

  const roleToDashboard: Record<string, string> = {
    player: "/dashboard/jogador",
    gm: "/dashboard/mestre",
    store: "/dashboard/loja",
    curious: "/explorar",
  };

  const getPostAuthPath = (fallback: string) => {
    const from = (location.state as { from?: RouterLocation } | null)?.from;
    const fromPath = from ? `${from.pathname}${from.search}${from.hash}` : "";
    return fromPath && from && !["/login", "/cadastro"].includes(from.pathname) ? fromPath : fallback;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({ title: "Selecione seu perfil", description: "Escolha como você quer usar a HIVIUM.", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os termos e a política de privacidade.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: selectedRole === "curious" ? "player" : selectedRole,
            can_play: canPlay,
            can_gm: canGm,
            can_manage_store: canManageStore,
            can_manage_brand: false,
            whatsapp: whatsapp.replace(/\D/g, "").length >= 10 ? normalizePhone(whatsapp) : undefined,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        const msg = error.message?.toLowerCase() ?? "";
        const isWeakPassword = msg.includes("weak") || msg.includes("easy to guess");
        toast({
          title: isWeakPassword ? "Senha muito fraca" : "Erro ao criar acesso",
          description: isWeakPassword
            ? "Senha muito fraca ou comum. Por favor, escolha uma senha mais forte combinando letras, números e símbolos."
            : error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        toast({ title: "Verifique seu email ✉️", description: "Enviamos um link de confirmação para " + email });
        navigate("/login", { state: location.state, replace: true });
        setLoading(false);
        return;
      }

      if (data.session) {
        // Mark onboarding as completed + LGPD consent
        await supabase.from("profiles").update({
          onboarding_completed: true,
          onboarding_step: 99,
          whatsapp: whatsapp.replace(/\D/g, "").length >= 10 ? normalizePhone(whatsapp) : undefined,
          terms_accepted_at: new Date().toISOString(),
          terms_version: "1.0",
        } as any).eq("user_id", data.user!.id);

        navigate(getPostAuthPath(roleToDashboard[selectedRole] || "/explorar"), { replace: true });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Servidor indisponível. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!selectedRole) {
      toast({ title: "Selecione seu perfil", description: "Escolha como você quer usar a HIVIUM antes de continuar.", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os termos e a política de privacidade.", variant: "destructive" });
      return;
    }
    setGoogleLoading(true);
    try {
      sessionStorage.setItem("hivium_signup_role", JSON.stringify({
        role: selectedRole === "curious" ? "player" : selectedRole,
        canPlay,
        canGm,
        canManageStore,
        dashboard: getPostAuthPath(roleToDashboard[selectedRole] || "/explorar"),
        whatsapp: whatsapp.replace(/\D/g, "").length >= 10 ? normalizePhone(whatsapp) : undefined,
      }));

       const result = await supabase.auth.signInWithOAuth({ 
         provider: "google", 
         options: {
           redirectTo: window.location.origin + "/~oauth"
         }
       });

      if (result?.error) {
        const message = result.error instanceof Error ? result.error.message : String(result.error);
        toast({ title: "Erro com Google", description: message, variant: "destructive" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Servidor indisponível.";
      toast({ title: "Erro com Google", description: message, variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2.5 mb-6">
            <img src={logoImg.src} alt="HIVIUM" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-base gradient-text">HIVIUM</span>
          </button>

          <h1 className="text-2xl md:text-[1.7rem] font-display font-bold text-foreground leading-tight tracking-tight">
            Crie sua conta grátis
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Leva menos de 30 segundos. Você completa o restante depois.
          </p>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {roleOptions.map((opt, i) => {
            const Icon = opt.icon;
            const selected = selectedRole === opt.value;
            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                type="button"
                onClick={() => setSelectedRole(opt.value)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3.5 text-center transition-all duration-200 active:scale-[0.97]",
                  selected
                    ? cn(opt.color, "shadow-sm")
                    : "border-border/60 bg-card hover:border-border text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", selected ? "" : "text-muted-foreground/60")} />
                <span className={cn("text-[13px] font-semibold leading-tight", selected ? "text-foreground" : "")}>{opt.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Google button */}
        <Button
          variant="outline"
          className="w-full mb-4 gap-2 h-11"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
          Continuar com Google
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground/50">ou</span></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="field-label">Nome completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" placeholder="Seu nome ou apelido" required disabled={loading} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="seu@email.com" required disabled={loading} />
          </div>
          <div>
            <label className="field-label">WhatsApp <span className="text-muted-foreground/50 font-normal">(opcional)</span></label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              className="field-input"
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>
          <div>
            <label className="field-label">Senha</label>
            <div className="relative mt-1.5">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="field-input !mt-0 pr-10" placeholder="Mínimo 6 caracteres" required minLength={6} disabled={loading} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* LGPD Consent */}
          <div className="flex items-start gap-3 py-1">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Li e aceito os{" "}
              <a href="/termos" target="_blank" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e a{" "}
              <a href="/privacidade" target="_blank" className="text-primary hover:underline">Política de Privacidade</a>.
              Autorizo o uso dos meus dados conforme a LGPD.
            </label>
          </div>

          <Button variant="gradient" className="w-full h-12 text-[15px] font-semibold" type="submit" disabled={loading || !selectedRole || !termsAccepted}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar acesso grátis
          </Button>
        </form>

        {/* Microcopy */}
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <p className="text-xs text-muted-foreground/50">Sem cartão de crédito · Comece a jogar agora</p>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Entrar</button>
        </p>
      </motion.div>
    </div>
  );
}
