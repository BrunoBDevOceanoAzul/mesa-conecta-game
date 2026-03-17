import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Crown, Store, Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/data/mock";
import logoImg from "@/assets/logo-socio-tabuleiro.png";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("role");
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

    // Check if email confirmation is required
    if (data.user && !data.session) {
      toast({
        title: "Verifique seu email ✉️",
        description: "Enviamos um link de confirmação para " + email,
      });
      setLoading(false);
      return;
    }

    // If auto-confirmed (session exists), navigate to onboarding
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
