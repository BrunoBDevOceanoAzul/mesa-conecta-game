import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { Gamepad2, Crown, Store, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import { resolveRedirect } from "@/lib/auth-redirect";
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

interface RoleConfig {
  role: string;
  label: string;
  desc: string;
  icon: typeof Gamepad2;
  color: string;
  canPlay: boolean;
  canGm: boolean;
  canManageStore: boolean;
  onboardingPath: string;
}

const roleConfigs: Record<string, RoleConfig> = {
  jogador: {
    role: "player",
    label: "Jogador",
    desc: "Encontre mesas, campanhas e grupos para jogar RPG.",
    icon: Gamepad2,
    color: "text-teal-500",
    canPlay: true,
    canGm: false,
    canManageStore: false,
    onboardingPath: "/onboarding/jogador",
  },
  mestre: {
    role: "gm",
    label: "Mestre",
    desc: "Crie mesas, conduza sessões e encontre jogadores.",
    icon: Crown,
    color: "text-plum-500",
    canPlay: false,
    canGm: true,
    canManageStore: false,
    onboardingPath: "/onboarding/mestre",
  },
  loja: {
    role: "store",
    label: "Loja / Luderia",
    desc: "Organize mesas, eventos e traga a comunidade para sua casa.",
    icon: Store,
    color: "text-coral-400",
    canPlay: false,
    canGm: false,
    canManageStore: true,
    onboardingPath: "/onboarding/loja",
  },
};

export default function RoleSignup() {
  const { role: roleParam } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const config = roleParam ? roleConfigs[roleParam] : null;

  if (!config) {
    return <SignupSelector />;
  }

  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: config.role,
            can_play: config.canPlay,
            can_gm: config.canGm,
            can_manage_store: config.canManageStore,
            can_manage_brand: false,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        toast({ title: "Verifique seu email ✉️", description: "Enviamos um link de confirmação para " + email });
        setLoading(false);
        return;
      }

      if (data.session) {
        navigate(config.onboardingPath);
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Servidor indisponível. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      // Store the intended role so OAuthCallback can use it
      sessionStorage.setItem("hivium_signup_role", JSON.stringify({
        role: config.role,
        canPlay: config.canPlay,
        canGm: config.canGm,
        canManageStore: config.canManageStore,
        onboardingPath: config.onboardingPath,
      }));

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/~oauth",
      });
      if (result?.error) {
        toast({ title: "Erro com Google", description: "Falha na autenticação. Tente novamente.", variant: "destructive" });
        setGoogleLoading(false);
        return;
      }
      if (!result?.redirected) {
        await new Promise((r) => setTimeout(r, 500));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Set role on profile for Google users
          await supabase.from("profiles").update({
            role: config.role,
            can_play: config.canPlay,
            can_gm: config.canGm,
            can_manage_store: config.canManageStore,
          } as any).eq("user_id", user.id);
          navigate(config.onboardingPath);
        }
      }
    } catch {
      toast({ title: "Erro com Google", description: "Servidor indisponível. Tente novamente.", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2.5 mb-6">
            <img src={logoImg} alt="HIVIUM" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-base gradient-text">HIVIUM</span>
          </button>

          <div className={cn("inline-flex items-center justify-center h-14 w-14 rounded-2xl mx-auto mb-4", config.color, "bg-primary/8")}>
            <Icon className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground">
            Cadastro de {config.label}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{config.desc}</p>
        </div>

        <Button
          variant="outline"
          className="w-full mb-5 gap-2 h-11"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" placeholder="Seu nome ou apelido" required disabled={loading} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="seu@email.com" required disabled={loading} />
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
          <Button variant="default" className="w-full h-11" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar conta como {config.label}
          </Button>
        </form>

        <button onClick={() => navigate("/cadastro")} className="mt-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto">
          <ArrowLeft className="h-3.5 w-3.5" /> Escolher outro perfil
        </button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Entrar</button>
        </p>
      </motion.div>
    </div>
  );
}

// Role selector page (the /cadastro landing)
function SignupSelector() {
  const navigate = useNavigate();

  const options = [
    { key: "jogador", label: "Jogador", desc: "Quero encontrar mesas e campanhas para jogar.", icon: Gamepad2, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { key: "mestre", label: "Mestre", desc: "Quero criar mesas, sessões e encontrar jogadores.", icon: Crown, color: "text-plum-500", bg: "bg-plum-50 dark:bg-plum-950/30" },
    { key: "loja", label: "Loja / Luderia", desc: "Quero organizar eventos e trazer a comunidade.", icon: Store, color: "text-coral-400", bg: "bg-coral-50 dark:bg-coral-950/30" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2.5 mb-8">
            <img src={logoImg} alt="HIVIUM" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-base gradient-text">HIVIUM</span>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">Como você usa a HIVIUM?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cada perfil tem seu cadastro próprio. Escolha o seu.</p>
        </div>

        <div className="grid gap-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/cadastro/${opt.key}`)}
              className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-300 hover:border-plum-200 hover:shadow-md active:scale-[0.98]"
            >
              <div className={cn("flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:shadow-sm", opt.bg, opt.color)}>
                <opt.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground text-[15px]">{opt.label}</h3>
                <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted-foreground/30 shrink-0 rotate-180 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-plum-400" />
            </motion.button>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Entrar</button>
        </p>
      </div>
    </div>
  );
}
