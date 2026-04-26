/**
 * @file CommanderProfile.tsx
 * @description Perfil do Comandante - Dashboard pessoal do usuário
 * @module components/hive/sections/CommanderProfile
 * 
 * ## Funcionalidades
 * - Resumo do perfil do usuário
 * - Estatísticas: mesas, bookings, XP
 * - Ações rápidas: criar mesa, explorar, etc.
 * - Integração com API: GET /auth/me
 * 
 * ## Mobile-First
 * - Layout em cards empilhados
 * - Touch targets >= 44px
 * - Scroll horizontal para stats
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, Shield, Crown, Star, Zap, MapPin, 
  Calendar, Users, ChevronRight 
} from 'lucide-react';
import { useHive } from '@/context/HiveContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CommanderProfile() {
  const { isGhostMode } = useHive();
  const { user } = useAuth();
  
  // Mock stats - integrar com API depois
  const stats = [
    { icon: Sword, label: 'Mesas Mestradas', value: 12, color: 'text-[#662583]' },
    { icon: Shield, label: 'Mesas Jogadas', value: 34, color: 'text-[#2C8E8B]' },
    { icon: Crown, label: 'Nível', value: 'Veterano', color: 'text-[#C6871F]' },
    { icon: Star, label: 'Avaliação', value: '4.8', color: 'text-[#D94367]' },
  ];
  
  const quickActions = [
    { icon: Zap, label: 'Criar Mesa', href: '/mesa/nova', color: 'bg-[#662583]' },
    { icon: MapPin, label: 'Explorar', href: '/explorar', color: 'bg-[#2C8E8B]' },
    { icon: Calendar, label: 'Agenda', href: '/agenda', color: 'bg-[#C6871F]' },
    { icon: Users, label: 'Comunidade', href: '/feed', color: 'bg-[#D94367]' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0612] via-[#0f0a1a] to-[#050505] text-white p-4 pb-24 md:p-8 md:pb-8">
      {/* Header do Comandante */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#662583] to-[#F7A731] p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0612] flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            </div>
            {isGhostMode && (
              <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                👻 Ghost
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold font-display">
              {isGhostMode ? 'Comandante Anônimo' : 'Comandante'}
            </h1>
            <p className="text-white/60 text-sm">
              {user?.email || 'Visitante'}
            </p>
          </div>
        </div>
        
        {/* Stats em scroll horizontal mobile */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-shrink-0 w-32 md:w-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} strokeWidth={1.5} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-white/50 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        
        {/* Ações Rápidas */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F7A731]" />
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${action.color} bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all`}
              >
                <action.icon className="w-6 h-6 mb-2" strokeWidth={1.5} />
                <div className="text-sm font-medium">{action.label}</div>
                <ChevronRight className="w-4 h-4 mt-2 opacity-50" />
              </motion.a>
            ))}
          </div>
        </div>
        
        {/* Atividade Recente */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
            <div className="text-white/50 text-sm text-center py-8">
              Suas atividades recentes aparecerão aqui
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
