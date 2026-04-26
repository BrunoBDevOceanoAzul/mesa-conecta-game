import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, LogOut, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  status: string;
}

interface MesaParticipantsProps {
  mesaId: string;
  organizerId: string;
  seatsTotal: number;
  seatsAvailable: number;
}

export function MesaParticipants({ mesaId, organizerId, seatsTotal, seatsAvailable }: MesaParticipantsProps) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const isParticipant = participants.some((p) => p.user_id === user?.id);
  const isOrganizer = user?.id === organizerId;

  useEffect(() => {
    if (!mesaId) return;

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("mesa_participants")
        .select("*")
        .eq("mesa_id", mesaId)
        .eq("status", "confirmed")
        .order("joined_at", { ascending: true });
      setParticipants((data as Participant[]) || []);
      setLoading(false);
    };

    fetchParticipants();

    // Realtime
    const channel = supabase
      .channel(`mesa-participants-${mesaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mesa_participants", filter: `mesa_id=eq.${mesaId}` }, () => {
        fetchParticipants();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mesaId]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const displayName = profile?.display_name || profile?.name || user.email?.split("@")[0] || "Jogador";

      const { error } = await supabase.from("mesa_participants").insert({
        mesa_id: mesaId,
        user_id: user.id,
        display_name: displayName,
        status: "confirmed",
      });

      if (error) throw error;

      // Track metric
      await supabase.from("mesa_engagement_metrics").insert({
        mesa_id: mesaId,
        user_id: user.id,
        event_type: "joined",
      });

      toast({ title: "Você entrou na mesa! 🎲" });
    } catch (err: any) {
      if (err?.code === "23505") {
        toast({ title: "Você já está nesta mesa", variant: "destructive" });
      } else {
        toast({ title: "Erro ao entrar", description: err.message, variant: "destructive" });
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;
    setJoining(true);
    try {
      await supabase
        .from("mesa_participants")
        .delete()
        .eq("mesa_id", mesaId)
        .eq("user_id", user.id);

      await supabase.from("mesa_engagement_metrics").insert({
        mesa_id: mesaId,
        user_id: user.id,
        event_type: "left",
      });

      toast({ title: "Você saiu da mesa" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando participantes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4" />
          Jogadores na mesa ({participants.length}/{seatsTotal})
        </h2>
      </div>

      {participants.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3.5 py-2.5"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {initials(p.display_name)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{p.display_name}</p>
                {p.user_id === organizerId && (
                  <span className="text-[10px] text-primary font-semibold">Organizador</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum jogador confirmado ainda.</p>
      )}

      {/* Join/Leave */}
      {user && !isOrganizer && (
        <div>
          {isParticipant ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={handleLeave} disabled={joining}>
              {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Sair da mesa
            </Button>
          ) : seatsAvailable > 0 ? (
            <Button variant="hero" size="sm" className="gap-2" onClick={handleJoin} disabled={joining}>
              {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Entrar na mesa
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>Mesa lotada</Button>
          )}
        </div>
      )}
    </div>
  );
}
