import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/hivium-logo.png";

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

async function redirectAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
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

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "Não foi possível entrar",
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos. Tente novamente."
          : error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    await redirectAfterAuth(navigate);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({
        title: "Erro com Google",
        description: "Falha na autenticação. Tente novamente.",
        variant: "destructive",
      });
      setGoogleLoading(false);
      return;
    }
    if (!result?.redirected) {
      await redirectAfterAuth(navigate);
    }
    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2.5 mb-8">
            <img src={logoImg} alt="HIVIUM" className="h-10 w-10 object-contain" />
            <span className="font-display font-bold text-base gradient-text">HIVIUM</span>
          </button>
          <h1 className="text-2xl font-display font-bold text-foreground">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre na sua conta para continuar</p>
        </div>

        <Button
          variant="outline"
          className="w-full mb-5 gap-2 h-11"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
          Continuar com Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-3 text-muted-foreground/60">ou</span></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow" placeholder="seu@email.com" required disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha</label>
            <div className="relative mt-1.5">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 transition-shadow" placeholder="••••••••" required disabled={loading} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button variant="default" className="w-full h-11" type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Entrar
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <button onClick={() => navigate("/cadastro")} className="text-primary hover:underline font-medium">Criar conta</button>
        </p>
      </div>
    </div>
  );
}
