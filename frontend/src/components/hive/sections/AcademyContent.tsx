import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { useHive } from '@/context/HiveContext';
import { usePosts } from '@/hooks/use-posts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AcademyContent() {
  const { posts, loading, refetch } = usePosts({ limit: 20 });
  const { user } = useAuth();
  const { openOverlay } = useHive();
  const [newPostContent, setNewPostContent] = useState('');

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !user) return;
    
    try {
      const { data: { session } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getSession());
      const token = session?.access_token;
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          content: newPostContent,
          type: 'general',
        }),
      });
      if (res.ok) {
        setNewPostContent('');
        refetch();
      }
    } catch (err) {
      console.warn('[AcademyContent] Failed to create post:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#3EAAA3]" />
            Academia
          </h1>
        </div>

        {/* Create Post */}
        {user && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Compartilhe algo com a comunidade..."
              className="w-full bg-transparent text-white placeholder:text-white/30 resize-none focus:outline-none text-sm min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="px-4 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publicar
              </button>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Comunidade</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Ainda não há posts. Seja o primeiro a compartilhar!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any, i: number) => (
              <motion.div
                key={post.id}
                onClick={() => openOverlay('post', { slug: post.slug })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#662583]/30 flex items-center justify-center text-xs font-bold">
                    {post.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{post.author?.name || 'Usuário'}</p>
                    <p className="text-xs text-white/40">
                      {post.createdAt 
                        ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })
                        : ''
                      }
                    </p>
                  </div>
                </div>
                <p className="text-sm text-white/80 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                  <button className="flex items-center gap-1 text-white/40 hover:text-[#D94367] transition-colors text-xs">
                    <Heart className="w-4 h-4" />
                    {post.likesCount || 0}
                  </button>
                  <button className="flex items-center gap-1 text-white/40 hover:text-[#3EAAA3] transition-colors text-xs">
                    <MessageSquare className="w-4 h-4" />
                    {post.commentsCount || 0}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
