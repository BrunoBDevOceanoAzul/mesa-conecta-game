import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Plus, Loader2, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Hive {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPublic: boolean;
  owner?: {
    name?: string;
    avatarUrl?: string;
  };
  memberCount: number;
  myRole: string;
}

export default function HivesContent() {
  const { user } = useAuth();
  const [hives, setHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newHiveName, setNewHiveName] = useState('');
  const [newHiveDescription, setNewHiveDescription] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchHives() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/hives', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const data = await res.json();
        if (data.ok) {
          setHives(data.data || []);
        }
      } catch (err) {
        console.warn('[HivesContent] Failed to fetch hives:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHives();
  }, [user]);

  const handleCreateHive = async () => {
    if (!newHiveName.trim() || !user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/hives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: newHiveName,
          description: newHiveDescription,
        }),
      });
      if (res.ok) {
        setNewHiveName('');
        setNewHiveDescription('');
        setShowCreate(false);
        // Refetch
        const refreshRes = await fetch('/api/hives', {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        const refreshData = await refreshRes.json();
        if (refreshData.ok) setHives(refreshData.data || []);
      }
    } catch (err) {
      console.warn('[HivesContent] Failed to create hive:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-[#662583]" />
            Clãs
          </h1>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-[#662583]/20 border border-[#662583]/30 rounded-xl text-sm font-medium hover:bg-[#662583]/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Clã
          </button>
        </div>

        {/* Create Hive Form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mb-6"
          >
            <input
              type="text"
              placeholder="Nome do clã"
              value={newHiveName}
              onChange={(e) => setNewHiveName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#662583]/50 mb-3"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newHiveDescription}
              onChange={(e) => setNewHiveDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#662583]/50 resize-none min-h-[80px] mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateHive}
                disabled={!newHiveName.trim()}
                className="px-4 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : hives.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum clã</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Você ainda não faz parte de nenhum clã. Crie um ou entre em um clã existente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hives.map((hive, i) => (
              <motion.div
                key={hive.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#662583]/30 to-[#F7A731]/20 flex items-center justify-center">
                    {hive.avatarUrl ? (
                      <img src={hive.avatarUrl} alt={hive.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-[#662583]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{hive.name}</h3>
                      {hive.isPublic ? (
                        <Globe className="w-3 h-3 text-white/30" />
                      ) : (
                        <Lock className="w-3 h-3 text-white/30" />
                      )}
                    </div>
                    <p className="text-white/50 text-xs">
                      {hive.memberCount} membros
                    </p>
                  </div>
                  {hive.myRole === 'owner' && (
                    <Crown className="w-4 h-4 text-[#F7A731]" />
                  )}
                </div>
                {hive.description && (
                  <p className="text-white/50 text-sm mb-3 line-clamp-2">{hive.description}</p>
                )}
                <div className="flex items-center gap-2 text-white/30 text-xs">
                  <span>por {hive.owner?.name || 'Desconhecido'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
