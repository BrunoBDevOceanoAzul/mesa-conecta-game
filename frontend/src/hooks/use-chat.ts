import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  conversation_type: string;
  subject: string | null;
  related_table_id: string | null;
  related_booking_id: string | null;
  related_store_id: string | null;
  status: string;
  last_message_at: string;
  last_message_preview: string | null;
  created_at: string;
  participants: ConversationParticipant[];
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  role_label: string;
  last_read_at: string;
  is_muted: boolean;
  profile?: {
    name: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  message_type: string;
  content: string;
  metadata_json: any;
  is_edited: boolean;
  created_at: string;
  sender?: {
    name: string;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    // Get conversations where user is a participant
    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p) => p.conversation_id);
    const lastReadMap = Object.fromEntries(
      participations.map((p) => [p.conversation_id, p.last_read_at])
    );

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .eq("status", "active")
      .order("last_message_at", { ascending: false });

    if (!convs) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get all participants for these conversations
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("*")
      .in("conversation_id", convIds);

    // Get all unique user ids for profiles
    const userIds = [...new Set((allParticipants || []).map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, display_name, avatar_url, role")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Count unread messages per conversation
    const enriched: Conversation[] = await Promise.all(
      convs.map(async (conv) => {
        const lastRead = lastReadMap[conv.id];
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_user_id", user.id)
          .gt("created_at", lastRead || "1970-01-01");

        const convParticipants = (allParticipants || [])
          .filter((p) => p.conversation_id === conv.id)
          .map((p) => ({
            ...p,
            profile: profileMap[p.user_id],
          }));

        return {
          ...conv,
          participants: convParticipants,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return { conversations, loading, totalUnread, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) { setMessages([]); setLoading(false); return; }
    
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (data && data.length > 0) {
      const senderIds = [...new Set(data.map((m) => m.sender_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, display_name, avatar_url, role")
        .in("user_id", senderIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p])
      );

      setMessages(
        data.map((m) => ({ ...m, sender: profileMap[m.sender_user_id] }))
      );
    } else {
      setMessages([]);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Mark as read
  useEffect(() => {
    if (!conversationId || !user) return;
    supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .then();
  }, [conversationId, user, messages.length]);

  // Realtime for this conversation
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`msgs-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, name, display_name, avatar_url, role")
            .eq("user_id", newMsg.sender_user_id)
            .maybeSingle();
          setMessages((prev) => [...prev, { ...newMsg, sender: profile }]);
          
          // Mark as read
          if (user && newMsg.sender_user_id !== user.id) {
            supabase
              .from("conversation_participants")
              .update({ last_read_at: new Date().toISOString() })
              .eq("conversation_id", conversationId)
              .eq("user_id", user.id)
              .then();
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      content: content.trim(),
      message_type: "text",
    });

    if (!error) {
      // Update conversation preview
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.trim().slice(0, 100),
        })
        .eq("id", conversationId);
    }
    setSending(false);
    return !error;
  }, [conversationId, user]);

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}

export function useStartConversation() {
  const { user } = useAuth();

  const startConversation = useCallback(async (opts: {
    otherUserId: string;
    conversationType: string;
    subject?: string;
    relatedTableId?: string;
    relatedBookingId?: string;
    relatedStoreId?: string;
    initialMessage?: string;
    otherRoleLabel?: string;
    myRoleLabel?: string;
  }) => {
    if (!user) return null;

    // Check if conversation already exists between these users with same context
    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (existing && existing.length > 0) {
      const convIds = existing.map((e) => e.conversation_id);
      const { data: otherParts } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", opts.otherUserId)
        .in("conversation_id", convIds);

      if (otherParts && otherParts.length > 0) {
        const sharedConvIds = otherParts.map((p) => p.conversation_id);
        
        // Check for matching context
        let query = supabase
          .from("conversations")
          .select("id")
          .in("id", sharedConvIds)
          .eq("status", "active")
          .eq("conversation_type", opts.conversationType);

        if (opts.relatedTableId) query = query.eq("related_table_id", opts.relatedTableId);
        if (opts.relatedBookingId) query = query.eq("related_booking_id", opts.relatedBookingId);

        const { data: existingConv } = await query.maybeSingle();
        if (existingConv) return existingConv.id;
      }
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({
        conversation_type: opts.conversationType,
        subject: opts.subject || null,
        related_table_id: opts.relatedTableId || null,
        related_booking_id: opts.relatedBookingId || null,
        related_store_id: opts.relatedStoreId || null,
        created_by_user_id: user.id,
        last_message_preview: opts.initialMessage?.slice(0, 100) || null,
      })
      .select("id")
      .single();

    if (error || !conv) return null;

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: user.id, role_label: opts.myRoleLabel || "member" },
      { conversation_id: conv.id, user_id: opts.otherUserId, role_label: opts.otherRoleLabel || "member" },
    ]);

    // Send initial message if provided
    if (opts.initialMessage) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_user_id: user.id,
        content: opts.initialMessage,
        message_type: "text",
      });
    }

    return conv.id;
  }, [user]);

  return { startConversation };
}
