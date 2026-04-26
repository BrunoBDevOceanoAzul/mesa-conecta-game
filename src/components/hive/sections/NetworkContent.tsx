/**
 * @file NetworkContent.tsx
 * @description Seção Network - Conexões e networking
 * @module components/hive/sections/NetworkContent
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Filter } from 'lucide-react';

export default function NetworkContent() {
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
          <div className="flex gap-2">
            <button className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sua Network</h3>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Conecte-se com mestres, jogadores e luderias. 
            Encontre parceiros para suas mesas e expanda seu círculo no mundo do RPG.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
