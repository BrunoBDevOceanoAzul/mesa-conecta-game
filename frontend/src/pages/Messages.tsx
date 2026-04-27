import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations, useMessages, type Conversation } from "@/hooks/use-chat";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageCircle, Search, Send, ArrowLeft, Loader2,
  Swords, Calendar, Store, Users, MessageSquare, Filter
} from "lucide-react";

const roleLabels: Record<string, string> = {
  player: "Jogador",
  gm: "Mestre",
  store: "Loja",
};

const typeIcons: Record<string, typeof MessageCircle> = {
  gm_player: Swords,
  store_gm: Store,
  store_player: Calendar,
};

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM");
}

function getOtherParticipant(conv: Conversation, myId: string) {
  return conv.participants.find((p) => p.user_id !== myId);
}

function getConversationContext(conv: Conversation) {
  if (conv.subject) return conv.subject;
  if (conv.related_table_id) return "Conversa sobre mesa";
  if (conv.related_booking_id) return "Conversa sobre reserva";
  return null;
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get("conv");
  const { conversations, loading: convsLoading, totalUnread } = useConversations();
  const { messages, loading: msgsLoading, sending, sendMessage } = useMessages(activeConvId);
  const [search, setSearch] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus input when conversation opens
  useEffect(() => {
    if (activeConvId) inputRef.current?.focus();
  }, [activeConvId]);

  const handleSend = async () => {
    if (!msgInput.trim() || sending) return;
    const text = msgInput;
    setMsgInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectConversation = (id: string) => {
    setSearchParams({ conv: id });
  };

  const filteredConversations = conversations.filter((c) => {
    if (search) {
      const other = getOtherParticipant(c, user?.id || "");
      const name = other?.profile?.display_name || other?.profile?.name || "";
      if (!name.toLowerCase().includes(search.toLowerCase()) && !c.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (filter === "unread") return c.unread_count > 0;
    if (filter !== "all") return c.conversation_type === filter;
    return true;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUser = activeConv ? getOtherParticipant(activeConv, user?.id || "") : null;

  const navItems = [
    { label: "Mensagens", path: "/mensagens", icon: <MessageCircle className="h-4 w-4" /> },
  ];

  const profileData = user ? { name: user.user_metadata?.name || "Usuário" } : { name: "Usuário" };

  return (
    <DashboardLayout role="player" navItems={navItems} userName={profileData.name}>
      <div className="flex h-[calc(100vh-7rem)] rounded-xl border border-border bg-card overflow-hidden">
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-[340px] lg:w-[380px] border-r border-border flex flex-col shrink-0",
          activeConvId && "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens
                {totalUnread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto">
              {[
                { key: "all", label: "Todas" },
                { key: "unread", label: "Não lidas" },
                { key: "gm_player", label: "Mestres" },
                { key: "store_gm", label: "Lojas" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                    filter === f.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            {convsLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Nenhuma conversa ainda</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Comece uma conversa dentro do contexto da sua mesa ou reserva.
                </p>
              </div>
            ) : (
              <div className="p-1.5">
                {filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv, user?.id || "");
                  const name = other?.profile?.display_name || other?.profile?.name || "Usuário";
                  const avatar = other?.profile?.avatar_url;
                  const role = other?.profile?.role || "player";
                  const context = getConversationContext(conv);
                  const TypeIcon = typeIcons[conv.conversation_type] || MessageCircle;
                  const isActive = conv.id === activeConvId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                        isActive ? "bg-primary/8 border border-primary/15" : "hover:bg-surface-hover",
                        conv.unread_count > 0 && !isActive && "bg-primary/3"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-sm truncate", conv.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                            {name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {conv.last_message_at ? formatMsgTime(conv.last_message_at) : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn("role-badge-" + role, "!px-1.5 !py-0 !text-[9px]")}>
                            {roleLabels[role] || role}
                          </span>
                          {context && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                              <TypeIcon className="h-2.5 w-2.5 shrink-0" /> {context}
                            </span>
                          )}
                        </div>
                        {conv.last_message_preview && (
                          <p className={cn(
                            "text-xs mt-1 truncate",
                            conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {conv.last_message_preview}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          !activeConvId && "hidden md:flex"
        )}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-5">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-1">Suas mensagens</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Selecione uma conversa para ver o histórico ou inicie uma nova a partir de uma mesa ou reserva.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <button
                  onClick={() => setSearchParams({})}
                  className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {otherUser && (
                  <>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={otherUser.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {(otherUser.profile?.display_name || otherUser.profile?.name || "U").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {otherUser.profile?.display_name || otherUser.profile?.name || "Usuário"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={cn("role-badge-" + (otherUser.profile?.role || "player"), "!px-1.5 !py-0 !text-[9px]")}>
                          {roleLabels[otherUser.profile?.role || "player"] || "Membro"}
                        </span>
                        {activeConv && getConversationContext(activeConv) && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            · {getConversationContext(activeConv)}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Envie a primeira mensagem para iniciar a conversa.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((msg, idx) => {
                      const isMe = msg.sender_user_id === user?.id;
                      const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender_user_id !== msg.sender_user_id);
                      const isSystem = msg.message_type === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center py-2">
                            <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={cn("flex gap-2 py-0.5", isMe ? "justify-end" : "justify-start")}>
                          {!isMe && (
                            <div className="w-7 shrink-0">
                              {showAvatar && (
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                    {(msg.sender?.display_name || msg.sender?.name || "U").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-surface text-foreground border border-border rounded-bl-md"
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={cn(
                              "text-[10px] mt-1",
                              isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), "HH:mm")}
                              {msg.is_edited && " · editada"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-3 bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Escreva sua mensagem..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1 h-10"
                  />
                  <Button
                    variant="gradient"
                    size="icon"
                    onClick={handleSend}
                    disabled={!msgInput.trim() || sending}
                    className="h-10 w-10 shrink-0"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
