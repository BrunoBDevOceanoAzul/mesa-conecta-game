import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Ban, Mail, UserX, Trash2, Plus, Search } from "lucide-react";

type BlockType = "user" | "email" | "chat";

interface BlockEntry {
  id: string;
  block_type: BlockType;
  target_user_id: string | null;
  target_email: string | null;
  blocked_by_user_id: string | null;
  reason: string | null;
  created_at: string;
  is_active: boolean;
  // joined
  target_profile_name?: string;
  blocker_profile_name?: string;
}

export function BlocklistManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<BlockType>("user");
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["blocklist", tab],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("blocklist")
        .select("*") as any)
        .eq("block_type", tab)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BlockEntry[];
    },
  });

  const addBlock = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        block_type: tab,
        reason: newReason || null,
        is_active: true,
      };
      if (tab === "email") {
        if (!newEmail.includes("@")) throw new Error("Email inválido");
        payload.target_email = newEmail.toLowerCase().trim();
      } else {
        if (!newUserId.trim()) throw new Error("ID do usuário obrigatório");
        payload.target_user_id = newUserId.trim();
      }
      const { error } = await supabase.from("blocklist").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio adicionado");
      queryClient.invalidateQueries({ queryKey: ["blocklist"] });
      setNewEmail("");
      setNewUserId("");
      setNewReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from("blocklist")
        .update({ is_active: false } as any) as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloqueio removido");
      queryClient.invalidateQueries({ queryKey: ["blocklist"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = entries.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.target_email?.toLowerCase().includes(s) ||
      e.target_user_id?.toLowerCase().includes(s) ||
      e.reason?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold flex items-center gap-2">
          <Ban className="h-5 w-5 text-destructive" /> Blocklist
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie bloqueios de usuários, emails e interações no chat.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as BlockType)}>
        <TabsList>
          <TabsTrigger value="user" className="gap-1.5">
            <UserX className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Emails
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5">
            <Ban className="h-3.5 w-3.5" /> Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          {/* Add form */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Adicionar bloqueio</p>
            {tab === "email" ? (
              <Input
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            ) : (
              <Input
                placeholder="ID do usuário (UUID)"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            )}
            <Textarea
              placeholder="Motivo (opcional)"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              rows={2}
            />
            <Button
              size="sm"
              onClick={() => addBlock.mutate()}
              disabled={addBlock.isPending}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Bloquear
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* List */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum bloqueio ativo.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      {entry.target_email || entry.target_user_id?.slice(0, 12) + "..."}
                    </p>
                    {entry.reason && (
                      <p className="text-xs text-muted-foreground">{entry.reason}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/60">
                      {new Date(entry.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[10px]">
                      {tab === "user" ? "Usuário" : tab === "email" ? "Email" : "Chat"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeBlock.mutate(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
