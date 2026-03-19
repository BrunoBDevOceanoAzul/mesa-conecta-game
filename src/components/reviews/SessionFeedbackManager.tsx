import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send, Loader2, Plus, Trash2, Users, Mail, CheckCircle2,
  Clock, MessageCircle, Sparkles
} from "lucide-react";

interface SessionFeedbackManagerProps {
  gameTableId: string;
  sessionId?: string;
}

interface NpcEntry {
  id?: string;
  npc_name: string;
  npc_concept: string;
  npc_role: string;
  gm_notes: string;
}

export function SessionFeedbackManager({ gameTableId, sessionId }: SessionFeedbackManagerProps) {
  const { user } = useAuth();
  const [npcs, setNpcs] = useState<NpcEntry[]>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailsSent, setEmailsSent] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchExistingData();
  }, [user, gameTableId]);

  const fetchExistingData = async () => {
    // Fetch existing NPCs
    const { data: npcData } = await (supabase as any)
      .from("session_npcs")
      .select("*")
      .eq("game_table_id", gameTableId)
      .eq("gm_user_id", user!.id);
    if (npcData?.length) {
      setNpcs(npcData.map((n: any) => ({
        id: n.id,
        npc_name: n.npc_name,
        npc_concept: n.npc_concept || "",
        npc_role: n.npc_role || "",
        gm_notes: n.gm_notes || "",
      })));
    }

    // Count received feedback
    const { count } = await (supabase as any)
      .from("session_feedback")
      .select("id", { count: "exact", head: true })
      .eq("game_table_id", gameTableId)
      .eq("reviewed_user_id", user!.id);
    setFeedbackCount(count || 0);

    // Count sent emails
    const { count: qCount } = await (supabase as any)
      .from("feedback_email_queue")
      .select("id", { count: "exact", head: true })
      .eq("game_table_id", gameTableId);
    setQueueCount(qCount || 0);
  };

  const addNpc = () => {
    setNpcs((prev) => [...prev, { npc_name: "", npc_concept: "", npc_role: "", gm_notes: "" }]);
  };

  const updateNpc = (idx: number, field: keyof NpcEntry, value: string) => {
    setNpcs((prev) => prev.map((n, i) => i === idx ? { ...n, [field]: value } : n));
  };

  const removeNpc = (idx: number) => {
    setNpcs((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveNpcs = async () => {
    if (!user) return;
    for (const npc of npcs) {
      if (!npc.npc_name.trim()) continue;
      if (npc.id) {
        await (supabase as any).from("session_npcs").update({
          npc_name: npc.npc_name,
          npc_concept: npc.npc_concept,
          npc_role: npc.npc_role,
          gm_notes: npc.gm_notes,
        }).eq("id", npc.id);
      } else {
        await (supabase as any).from("session_npcs").insert({
          game_table_id: gameTableId,
          table_session_id: sessionId || null,
          gm_user_id: user.id,
          npc_name: npc.npc_name,
          npc_concept: npc.npc_concept,
          npc_role: npc.npc_role,
          gm_notes: npc.gm_notes,
        });
      }
    }
    toast({ title: "NPCs salvos! 🎭" });
    fetchExistingData();
  };

  const sendFeedbackEmails = async () => {
    if (!user) return;
    setSendingEmails(true);
    try {
      // Get all confirmed bookings for this table
      const { data: bookings } = await supabase
        .from("bookings")
        .select("player_user_id")
        .eq("game_table_id", gameTableId)
        .eq("status", "confirmed");

      if (!bookings?.length) {
        toast({ title: "Nenhum jogador confirmado nesta mesa", variant: "destructive" });
        setSendingEmails(false);
        return;
      }

      // Get player emails from profiles
      const playerIds = bookings.map((b) => b.player_user_id);
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, email, name")
        .in("user_id", playerIds);

      if (!profiles?.length) {
        toast({ title: "Não encontrei perfis dos jogadores", variant: "destructive" });
        setSendingEmails(false);
        return;
      }

      // Create feedback email queue entries
      for (const profile of profiles) {
        // Player reviews GM
        await (supabase as any).from("feedback_email_queue").insert({
          game_table_id: gameTableId,
          table_session_id: sessionId || null,
          recipient_user_id: profile.user_id,
          recipient_email: profile.email,
          feedback_type: "gm_review",
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        // GM reviews player (queue for self)
        await (supabase as any).from("feedback_email_queue").insert({
          game_table_id: gameTableId,
          table_session_id: sessionId || null,
          recipient_user_id: user.id,
          recipient_email: "",
          feedback_type: "player_review",
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      }

      setEmailsSent(true);
      toast({ title: "Formulários enviados! 📧", description: `${profiles.length} jogadores receberão o formulário de avaliação.` });
      fetchExistingData();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <MessageCircle className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{feedbackCount}</p>
          <p className="text-[10px] text-muted-foreground">Feedbacks recebidos</p>
        </Card>
        <Card className="p-3 text-center">
          <Mail className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{queueCount}</p>
          <p className="text-[10px] text-muted-foreground">Formulários enviados</p>
        </Card>
      </div>

      {/* NPC Registry */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> NPCs da Sessão
          </h3>
          <Button size="sm" variant="ghost" onClick={addNpc} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>

        {npcs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Registre os NPCs desta sessão para coletar impressões dos jogadores.
          </p>
        ) : (
          npcs.map((npc, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">NPC #{i + 1}</Badge>
                <button onClick={() => removeNpc(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={npc.npc_name}
                  onChange={(e) => updateNpc(i, "npc_name", e.target.value)}
                  placeholder="Nome do NPC"
                  className="text-xs"
                />
                <Input
                  value={npc.npc_role}
                  onChange={(e) => updateNpc(i, "npc_role", e.target.value)}
                  placeholder="Papel (aliado, vilão...)"
                  className="text-xs"
                />
              </div>
              <Input
                value={npc.npc_concept}
                onChange={(e) => updateNpc(i, "npc_concept", e.target.value)}
                placeholder="Conceito breve do NPC"
                className="text-xs"
              />
              <Textarea
                value={npc.gm_notes}
                onChange={(e) => updateNpc(i, "gm_notes", e.target.value)}
                placeholder="Notas do mestre sobre este NPC..."
                className="min-h-[40px] text-xs"
              />
            </div>
          ))
        )}

        {npcs.length > 0 && (
          <Button size="sm" variant="outline" onClick={saveNpcs} className="w-full gap-1.5 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" /> Salvar NPCs
          </Button>
        )}
      </Card>

      {/* Send feedback request */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Mail className="h-4 w-4 text-primary" /> Enviar Formulários de Avaliação
        </h3>
        <p className="text-xs text-muted-foreground">
          Envia automaticamente para todos os jogadores confirmados um formulário para avaliar o mestre e os NPCs. 
          Você também receberá um formulário para avaliar cada jogador.
        </p>
        <Button
          onClick={sendFeedbackEmails}
          disabled={sendingEmails || emailsSent}
          className="w-full gap-2"
        >
          {sendingEmails ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
          ) : emailsSent ? (
            <><CheckCircle2 className="h-4 w-4" /> Enviados!</>
          ) : (
            <><Send className="h-4 w-4" /> Enviar Avaliações</>
          )}
        </Button>
      </Card>
    </div>
  );
}