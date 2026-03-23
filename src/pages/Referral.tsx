import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Check, Share2, Users, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Referral() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const code = user?.id?.slice(0, 8).toUpperCase() || "SOCIO123";
  const link = `${window.location.origin}/cadastro?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Sócio do Tabuleiro", text: "Junte-se à maior comunidade de RPG do Brasil!", url: link });
    } else {
      copyLink();
    }
  };

  const navItems = [
    { label: "Indicações", path: "/indicacoes", icon: <Gift className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Usuário"}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 mb-4">
            <Gift className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-h2 text-foreground">Convide Amigos</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Compartilhe seu código e ganhe recompensas quando seus amigos se cadastrarem na Sócio do Tabuleiro.
          </p>
        </div>

        {/* Code */}
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <p className="text-overline text-muted-foreground">Seu código de indicação</p>
          <p className="text-3xl font-display font-bold tracking-widest gradient-text">{code}</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input value={link} readOnly className="text-xs text-muted-foreground" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={shareLink} className="gap-1.5 shrink-0">
              <Share2 className="h-4 w-4" /> Compartilhar
            </Button>
          </div>
        </div>

        {/* Rewards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
            <Users className="h-6 w-6 text-primary mx-auto" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Amigos convidados</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
            <Trophy className="h-6 w-6 text-secondary mx-auto" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Recompensas ganhas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
            <Gift className="h-6 w-6 text-accent mx-auto" />
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Créditos de boost</p>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-muted/40 border border-border p-6 space-y-4">
          <h2 className="text-sm font-display font-semibold text-foreground">Como funciona?</h2>
          <div className="space-y-3">
            {[
              "Compartilhe seu link exclusivo com amigos",
              "Quando eles se cadastrarem usando seu código, ambos ganham XP bônus",
              "A cada 5 indicações, você ganha créditos de boost gratuitos",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
