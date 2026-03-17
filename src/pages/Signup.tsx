import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Crown, Store, Megaphone } from "lucide-react";
import type { UserRole } from "@/data/mock";
import logoImg from "@/assets/logo-socio-tabuleiro.png";

const roles: { role: UserRole; icon: typeof Gamepad2; label: string; desc: string }[] = [
  { role: "player", icon: Gamepad2, label: "Jogador", desc: "Quero encontrar e jogar em mesas" },
  { role: "gm", icon: Crown, label: "Mestre", desc: "Quero narrar e gerenciar mesas" },
  { role: "store", icon: Store, label: "Loja / Luderia", desc: "Quero organizar eventos e mesas" },
  { role: "brand", icon: Megaphone, label: "Marca", desc: "Quero anunciar para a comunidade" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "role">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("role");
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    localStorage.setItem("hivium_user", JSON.stringify({ name, email, role }));
    const dashMap: Record<UserRole, string> = {
      player: "/onboarding/jogador",
      gm: "/onboarding/mestre",
      store: "/onboarding/loja",
      brand: "/dashboard/marca",
    };
    navigate(dashMap[role]);
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
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Mínimo 8 caracteres" required minLength={8} />
            </div>
            <Button variant="hero" className="w-full" type="submit">Continuar</Button>
          </form>
        ) : (
          <div className="grid gap-3">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => handleRoleSelect(r.role)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${
                  selectedRole === r.role ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <r.icon className="h-6 w-6 text-primary" />
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
