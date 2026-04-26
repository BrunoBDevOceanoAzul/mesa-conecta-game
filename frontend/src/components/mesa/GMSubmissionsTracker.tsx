import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users, CheckCircle2, Clock, AlertCircle, Eye, Loader2,
  ChevronDown, ChevronUp, ScrollText, Bell,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";

interface GMSubmissionsTrackerProps {
  gameTableId: string;
  tableTitle: string;
}

interface Submission {
  id: string;
  user_id: string;
  status: string;
  answers_json: Record<string, any>;
  started_at: string | null;
  submitted_at: string | null;
  last_edited_at: string | null;
  player_name?: string;
  player_email?: string;
}

export function GMSubmissionsTracker({ gameTableId, tableTitle }: GMSubmissionsTrackerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameTableId) return;
    setLoading(true);

    supabase
      .from("player_form_submissions")
      .select("*")
      .eq("game_table_id", gameTableId)
      .then(async ({ data }) => {
        if (!data || data.length === 0) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        // Fetch player names
        const userIds = data.map((s: any) => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, email")
          .in("user_id", userIds);

        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.user_id, p])
        );

        setSubmissions(
          data.map((s: any) => ({
            ...s,
            player_name: profileMap.get(s.user_id)?.name || "Jogador",
            player_email: profileMap.get(s.user_id)?.email,
          }))
        );
        setLoading(false);
      });
  }, [gameTableId]);

  const submitted = submissions.filter((s) => s.status === "submitted" || s.status === "reviewed");
  const drafts = submissions.filter((s) => s.status === "draft");
  const pending = submissions.filter((s) => s.status === "not_started");
  const totalRate = submissions.length > 0
    ? Math.round((submitted.length / submissions.length) * 100)
    : 0;

  const markReviewed = async (subId: string) => {
    await supabase
      .from("player_form_submissions")
      .update({ status: "reviewed" })
      .eq("id", subId);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: "reviewed" } : s))
    );
    toast({ title: "Ficha marcada como revisada ✅" });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando fichas...</span>
      </div>
    );
  }

  if (submissions.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-secondary/20 bg-gradient-to-br from-card to-secondary/[0.02] overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Fichas dos Jogadores
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {submitted.length}/{submissions.length} enviadas · {totalRate}% concluído
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={totalRate} className="w-20 h-2" />
              {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-3 border-t border-border/50 pt-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <StatBadge icon={<CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />} label="Enviadas" count={submitted.length} />
              <StatBadge icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} label="Rascunho" count={drafts.length} />
              <StatBadge icon={<AlertCircle className="h-3.5 w-3.5 text-amber-500" />} label="Pendentes" count={pending.length} />
            </div>

            {/* Player list */}
            <div className="space-y-2">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                const statusCfg = {
                  submitted: { label: "Enviada", color: "bg-teal-500/10 text-teal-600 border-teal-200" },
                  reviewed: { label: "Revisada", color: "bg-primary/10 text-primary border-primary/20" },
                  draft: { label: "Rascunho", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
                  not_started: { label: "Pendente", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
                }[sub.status] || { label: sub.status, color: "bg-muted text-muted-foreground border-border" };

                return (
                  <div key={sub.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {(sub.player_name || "J")[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-medium text-foreground">{sub.player_name}</span>
                          {sub.submitted_at && (
                            <span className="text-[10px] text-muted-foreground block">
                              Enviada em {new Date(sub.submitted_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>
                        {statusCfg.label}
                      </Badge>
                    </button>

                    {isExpanded && (sub.status === "submitted" || sub.status === "reviewed") && (
                      <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                        {Object.entries(sub.answers_json || {}).map(([key, val]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium min-w-[100px]">
                              {key}:
                            </span>
                            <span className="text-xs text-foreground">{String(val)}</span>
                          </div>
                        ))}
                        {sub.status === "submitted" && (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => markReviewed(sub.id)}
                            className="text-xs gap-1 mt-2"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Marcar como revisada
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function StatBadge({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-lg font-display font-bold text-foreground">{count}</span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
