import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MessageCircle, Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  other_user?: {
    name: string;
    avatar_url?: string;
  };
}

export default function NetworkContent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchConversations() {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*, messages(content, created_at)')
          .contains('participant_ids', [user.id])
          .order('updated_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        // Process conversations to get other user info
        const processed = await Promise.all((data || []).map(async (conv: any) => {
          const otherUserId = conv.participant_ids.find((id: string) => id !== user.id);
          let otherUser = { name: 'Usuário' };
          
          if (otherUserId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('user_id', otherUserId)
              .single();
            if (profile) {
              otherUser = { name: profile.name || 'Usuário', avatar_url: profile.avatar_url };
            }
          }

          return {
            ...conv,
            other_user: otherUser,
            last_message: conv.messages?.[0]?.content || 'Iniciar conversa',
            last_message_at: conv.messages?.[0]?.created_at || conv.updated_at,
          };
        }));

        setConversations(processed);
      } catch (err) {
        console.warn('[NetworkContent] Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchConversations();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#F7A731]" />
            Network
          </h1>
          <a 
            href="/mensagens" 
            className="flex items-center gap-2 px-4 py-2 bg-[#662583]/20 border border-[#662583]/30 rounded-xl text-sm font-medium hover:bg-[#662583]/30 transition-colors"
          >
            <Send className="w-4 h-4" />
            Mensagens
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sua Network</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Você ainda não tem conversas. Conecte-se com mestres e jogadores para começar.
            </p>
            <a 
              href="/mensagens" 
              className="inline-block mt-4 px-6 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors"
            >
              Ver Mensagens
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, i) => (
              <motion.a
                key={conv.id}
                href={`/mensagens?conversation=${conv.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#662583]/30 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {conv.other_user?.avatar_url ? (
                      <img 
                        src={conv.other_user.avatar_url} 
                        alt={conv.other_user.name} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      conv.other_user?.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white truncate">
                        {conv.other_user?.name}
                      </h3>
                      {conv.last_message_at && (
                        <span className="text-xs text-white/30 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.last_message_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/50 truncate mt-0.5">
                      {conv.last_message}
                    </p>
                  </div>
                  {conv.unread_count ? (
                    <div className="w-5 h-5 rounded-full bg-[#D94367] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {conv.unread_count}
                    </div>
                  ) : null}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
