import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // MVP: simulate login
    localStorage.setItem("hivium_user", JSON.stringify({ email, role: "player" }));
    navigate("/dashboard/jogador");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-display font-bold text-primary-foreground text-sm" style={{ backgroundImage: "linear-gradient(135deg, hsl(258 90% 66%), hsl(189 94% 43%))" }}>H</div>
            <span className="font-display font-bold text-lg text-foreground">Hiv<span className="text-primary">ium</span></span>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">Entrar na sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Bem-vindo de volta, aventureiro.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Senha</label>
            <div className="relative mt-1">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button variant="hero" className="w-full" type="submit">Entrar</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <button onClick={() => navigate("/cadastro")} className="text-primary hover:underline">Criar conta</button>
        </p>
      </div>
    </div>
  );
}
