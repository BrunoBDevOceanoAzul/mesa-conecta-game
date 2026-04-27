import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Dices, FileText, Plus, Loader2 } from 'lucide-react';
import { useHive } from '@/context/HiveContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CharacterSheet {
  id: string;
  character_name: string;
  system_name: string;
  created_at: string;
}

export default function PlaygroundContent() {
  const { user } = useAuth();
  const { openOverlay } = useHive();
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchSheets() {
      try {
        const { data, error } = await supabase
          .from('character_sheets')
          .select('id, character_name, system_name, created_at')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSheets(data || []);
      } catch (err) {
        console.warn('[PlaygroundContent] Failed to fetch sheets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSheets();
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
            <Gamepad2 className="w-6 h-6 text-[#C6871F]" />
            Playground
          </h1>
          <a 
            href="/fichas" 
            className="flex items-center gap-2 px-4 py-2 bg-[#662583]/20 border border-[#662583]/30 rounded-xl text-sm font-medium hover:bg-[#662583]/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Ficha
          </a>
        </div>

        {/* Character Sheets */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#662583]" />
          </div>
        ) : sheets.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <Dices className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fichas de Personagem</h3>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-4">
              Você ainda não tem fichas de personagem. Crie sua primeira ficha para começar.
            </p>
            <a 
              href="/fichas" 
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#662583] rounded-xl text-sm font-medium hover:bg-[#662583]/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Ficha
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sheets.map((sheet, i) => (
              <motion.div
                key={sheet.id}
                onClick={() => openOverlay('sheet', { id: sheet.id })}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C6871F]/30 to-[#662583]/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#C6871F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-[#F7A731] transition-colors truncate">
                      {sheet.character_name}
                    </h3>
                    <p className="text-white/50 text-xs">
                      {sheet.system_name}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tools Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Ferramentas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Dices, label: 'Rolagem de Dados', href: '#' },
              { icon: FileText, label: 'Notas de Sessão', href: '#' },
            ].map((tool, i) => (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer text-center"
              >
                <tool.icon className="w-6 h-6 mx-auto mb-2 text-[#C6871F]" strokeWidth={1.5} />
                <div className="text-xs font-medium">{tool.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
