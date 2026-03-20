import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useStartConversation } from "@/hooks/use-chat";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { containsProfanity, PROFANITY_WARNING } from "@/lib/profanity-filter";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  MessageCircle, Send, Loader2, ChevronDown, ChevronUp,
  Zap, X, Sparkles
} from "lucide-react";

interface QuickReply {
  id: string;
  category: string;
  label: string;
  content: string;
  role_target: string;
  sort_order: number;
}

interface MesaLiveChatProps {
  gameTableId: string;
  gmUserId: string;
  tableTitle: string;
}

export function MesaLiveChat({ gameTableId, gmUserId, tableTitle }: MesaLiveChatProps) {
  const { user } = useAuth();
  const { startConversation } = useStartConversation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading: msgsLoading, sending, sendMessage } = useMessages(conversationId);

  const isGM = user?.id === gmUserId;
  const userRole = isGM ? "gm" : "player";

  // Find or create conversation for this mesa
  useEffect(() => {
    if (!user || !gameTableId) return;

    const findConversation = async () => {
      // Find existing mesa group chat
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .eq("related_table_id", gameTableId)
        .eq("conversation_type", "mesa_group")
        .eq("status", "active")
        .maybeSingle();

      if (convs) {
        setConversationId(convs.id);
        // Ensure user is a participant
        const { data: existing } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", convs.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("conversation_participants").insert({
            conversation_id: convs.id,
            user_id: user.id,
            role_label: userRole,
          });
        }
      } else if (isGM) {
        // GM creates the group chat
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            conversation_type: "mesa_group",
            subject: `Chat: ${tableTitle}`,
            related_table_id: gameTableId,
            created_by_user_id: user.id,
          })
          .select("id")
          .single();

        if (newConv) {
          await supabase.from("conversation_participants").insert({
            conversation_id: newConv.id,
            user_id: user.id,
            role_label: "gm",
          });
          setConversationId(newConv.id);
        }
      }
      setLoading(false);
    };

    findConversation();
  }, [user, gameTableId, gmUserId, isGM, tableTitle, userRole]);

  // Load quick replies
  useEffect(() => {
    supabase
      .from("chat_quick_replies")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setQuickReplies(data as QuickReply[]);
      });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, expanded]);

  // Track analytics (anonymized)
  const trackEvent = useCallback(async (eventType: string, metadata: Record<string, any> = {}) => {
    if (!conversationId) return;
    await supabase.from("chat_analytics").insert({
      conversation_id: conversationId,
      game_table_id: gameTableId,
      event_type: eventType,
      metadata_json: { ...metadata, role: userRole },
    });
  }, [conversationId, gameTableId, userRole]);

  const handleSend = async (content?: string) => {
    const text = content || msgInput;
    if (!text.trim() || sending) return;
    if (containsProfanity(text)) {
      toast.error(PROFANITY_WARNING);
      return;
    }
    setMsgInput("");
    setShowQuickReplies(false);
    await sendMessage(text);
    trackEvent("message_sent", { is_quick_reply: !!content, length: text.length });
  };

  const handleQuickReply = (reply: QuickReply) => {
    handleSend(reply.content);
    trackEvent("quick_reply_used", { reply_id: reply.id, category: reply.category });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleJoinChat = async () => {
    if (!user || conversationId) return;
    setLoading(true);
    // Create conversation if doesn't exist
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq("related_table_id", gameTableId)
      .eq("conversation_type", "mesa_group")
      .eq("status", "active")
      .maybeSingle();

    if (convs) {
      await supabase.from("conversation_participants").insert({
        conversation_id: convs.id,
        user_id: user.id,
        role_label: userRole,
      });
      setConversationId(convs.id);
      trackEvent("chat_joined");
    }
    setLoading(false);
  };

  const filteredQuickReplies = quickReplies.filter(
    (qr) => qr.role_target === "all" || qr.role_target === userRole
  );

  const categories = [...new Set(filteredQuickReplies.map((qr) => qr.category))];

  const categoryLabels: Record<string, string> = {
    greeting: "Saudações",
    session: "Sessão",
    gm_tools: "Ferramentas do Mestre",
    feedback: "Feedback",
    general: "Geral",
  };

  if (!user) return null;

  // Collapsed state
  if (!expanded) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => { setExpanded(true); trackEvent("chat_opened"); }}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Chat da Mesa</p>
              <p className="text-xs text-muted-foreground">
                {messages.length > 0 ? `${messages.length} mensagens` : "Converse com o grupo"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {messages.length}
              </Badge>
            )}
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Chat da Mesa</p>
            <p className="text-[10px] text-muted-foreground">{tableTitle}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !conversationId ? (
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          <Sparkles className="h-8 w-8 text-primary/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {isGM ? "Crie o chat da mesa para se comunicar com os jogadores." : "O chat ainda não foi criado pelo mestre."}
          </p>
          {isGM ? (
            <Button variant="hero" size="sm" onClick={handleJoinChat}>
              Criar Chat da Mesa
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleJoinChat} disabled={loading}>
              Entrar no Chat
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="h-[320px] p-3">
            {msgsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Quebre o gelo! 🎲</p>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_user_id === user?.id;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender_user_id !== msg.sender_user_id);
                  const isSystem = msg.message_type === "system";
                  const senderIsGM = msg.sender_user_id === gmUserId;

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center py-1.5">
                        <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={cn("flex gap-1.5 py-0.5", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <div className="w-6 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={msg.sender?.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
                                {(msg.sender?.display_name || msg.sender?.name || "U").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className="max-w-[80%]">
                        {showAvatar && !isMe && (
                          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                            <span className="text-[10px] font-medium text-foreground">
                              {msg.sender?.display_name || msg.sender?.name || "Usuário"}
                            </span>
                            {senderIsGM && (
                              <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary uppercase">
                                Mestre
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-3 py-1.5 text-sm leading-relaxed",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : senderIsGM
                                ? "bg-primary/8 text-foreground border border-primary/15 rounded-bl-sm"
                                : "bg-surface text-foreground border border-border rounded-bl-sm"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words text-[13px]">{msg.content}</p>
                          <p className={cn(
                            "text-[9px] mt-0.5",
                            isMe ? "text-primary-foreground/50" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Quick replies */}
          {showQuickReplies && (
            <div className="border-t border-border bg-muted/30 p-3 max-h-[200px] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Respostas Rápidas</span>
                <button onClick={() => setShowQuickReplies(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {categories.map((cat) => (
                <div key={cat} className="mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                    {categoryLabels[cat] || cat}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {filteredQuickReplies
                      .filter((qr) => qr.category === cat)
                      .map((qr) => (
                        <button
                          key={qr.id}
                          onClick={() => handleQuickReply(qr)}
                          className="rounded-full bg-card border border-border px-2.5 py-1 text-xs text-foreground hover:bg-primary/5 hover:border-primary/20 transition-colors"
                        >
                          {qr.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-2.5 bg-card">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  showQuickReplies ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Respostas rápidas"
              >
                <Zap className="h-4 w-4" />
              </button>
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                className="flex-1 h-9 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSend()}
                disabled={!msgInput.trim() || sending}
                className="h-9 w-9 shrink-0 text-primary hover:bg-primary/10"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
