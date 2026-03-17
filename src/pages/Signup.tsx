import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Crown, Store, Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/data/mock";
import logoImg from "@/assets/logo-socio-tabuleiro.png";

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
  { role: "player", icon: Gamepad2, label: "Jogador", desc: "Quero encontrar e jogar em mesas" },
  { role: "gm", icon: Crown, label: "Mestre", desc: "Quero narrar e gerenciar mesas" },
  { role: "store", icon: Store, label: "Loja / Luderia", desc: "Quero organizar eventos e mesas" },
  { role: "brand", icon: Megaphone, label: "Marca", desc: "Quero anunciar para a comunidade" },
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
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({
        title: "Erro ao continuar com Google",
        description: "Não foi possível autenticar com o Google. Tente novamente.",
        variant: "destructive",
      });
      setGoogleLoading(false);
      return;
    }
    if (!result?.redirected) {
      // After Google auth, check profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("user_id", user.id)
          .single();
        if (!profile?.city) {
          navigate("/onboarding/jogador");
        } else {
          navigate("/dashboard/jogador");
        }
      }
    }
    setGoogleLoading(false);
  };

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      setSelectedRole(null);
      return;
    }

    if (data.user && !data.session) {
      toast({
        title: "Verifique seu email ✉️",
        description: "Enviamos um link de confirmação para " + email,
      });
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
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 mb-6">
            <img src={logoImg} alt="Sócio do Tabuleiro" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-lg text-foreground">Sócio do <span className="text-primary">Tabuleiro</span></span>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {step === "info" ? "Crie sua conta" : "Escolha seu perfil"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "info" ? "Junte-se à comunidade de RPG que mais cresce no Brasil." : "Isso define sua experiência. Pode mudar depois."}
          </p>
        </div>

        {step === "info" ? (
          <>
            <Button
              variant="outline"
              className="w-full mb-4 gap-2"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
            >
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
              Continuar com Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Seu nome ou apelido" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="seu@email.com" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Mínimo 6 caracteres" required minLength={6} />
              </div>
              <Button variant="hero" className="w-full" type="submit">Continuar</Button>
            </form>
          </>
        ) : (
          <div className="grid gap-3">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => handleRoleSelect(r.role)}
                disabled={loading}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedRole === r.role ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {loading && selectedRole === r.role ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <r.icon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-display font-semibold text-foreground">{r.label}</div>
                  <div className="text-sm text-muted-foreground">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">Entrar</button>
        </p>
      </div>
    </div>
  );
}
