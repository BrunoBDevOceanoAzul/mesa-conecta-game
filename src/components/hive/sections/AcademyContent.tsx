/**
 * @file AcademyContent.tsx
 * @description Seção Academy - Conteúdo educacional
 * @module components/hive/sections/AcademyContent
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen } from 'lucide-react';

export default function AcademyContent() {
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
        
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Academia HIVIUM</h3>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Aprenda a ser um melhor mestre, descubra novos sistemas e 
            aprofunde-se no universo dos jogos de mesa.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
