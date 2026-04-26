/**
 * @file HexagonAgent.tsx
 * @description Componente hexagonal interativo do Linker Hive
 * @module components/hive/HexagonAgent
 * 
 * ## Design Tokens
 * - Cores adaptadas da identidade Sócio do Tabuleiro (roxo #662583, dourado #F7A731)
 * - Estados: default, hover, active, ghost
 * - Animações: framer-motion para transições suaves
 * 
 * ## Acessibilidade
 * - Touch target mínimo: 44px
 * - Suporte a reduced motion
 * - Labels semânticos para screen readers
 */

'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useHive } from '@/context/HiveContext';
import type { HiveFrequency } from '@/context/HiveContext';

interface HexagonAgentProps {
  id: HiveFrequency | 'user';
  label: string;
  icon: LucideIcon;
  color?: string;
  isCentral?: boolean;
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

// Mapeamento de cores para o tema Sócio do Tabuleiro
const FREQUENCY_COLORS: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  user: {
    bg: 'bg-gradient-to-br from-[#662583] to-[#4B2576]',
    border: 'border-[#F7A731]/30',
    glow: 'shadow-[0_0_30px_rgba(102,37,131,0.4)]',
    text: 'text-white',
  },
  network: {
    bg: 'bg-gradient-to-br from-[#662583] to-[#81358C]',
    border: 'border-[#F7A731]/20',
    glow: 'shadow-[0_0_20px_rgba(102,37,131,0.3)]',
    text: 'text-white',
  },
  hives: {
    bg: 'bg-gradient-to-br from-[#2C8E8B] to-[#246F70]',
    border: 'border-[#6FC7BE]/20',
    glow: 'shadow-[0_0_20px_rgba(44,142,139,0.3)]',
    text: 'text-white',
  },
  academy: {
    bg: 'bg-gradient-to-br from-[#3EAAA3] to-[#2C8E8B]',
    border: 'border-[#A5E0D7]/20',
    glow: 'shadow-[0_0_20px_rgba(62,170,163,0.3)]',
    text: 'text-white',
  },
  market: {
    bg: 'bg-gradient-to-br from-[#D94367] to-[#B8325C]',
    border: 'border-[#FF869B]/20',
    glow: 'shadow-[0_0_20px_rgba(217,67,103,0.3)]',
    text: 'text-white',
  },
  playground: {
    bg: 'bg-gradient-to-br from-[#C6871F] to-[#9B6717]',
    border: 'border-[#F7DD86]/20',
    glow: 'shadow-[0_0_20px_rgba(198,135,31,0.3)]',
    text: 'text-white',
  },
  radar: {
    bg: 'bg-gradient-to-br from-[#81358C] to-[#662583]',
    border: 'border-[#D1B3E6]/20',
    glow: 'shadow-[0_0_20px_rgba(129,53,140,0.3)]',
    text: 'text-white',
  },
};

export const HexagonAgent = memo(function HexagonAgent({
  id,
  label,
  icon: Icon,
  color,
  isCentral = false,
  size = 130,
  onClick,
  style,
}: HexagonAgentProps) {
  const { activeFrequency, isExpanded, isGhostMode } = useHive();
  
  const isActive = activeFrequency === id;
  const colors = FREQUENCY_COLORS[id] || FREQUENCY_COLORS.network;
  
  // Dimensões do hexágono
  const width = size;
  const height = size * 1.1547; // hexágono regular: altura = largura * 2/√3
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center cursor-pointer
        transition-all duration-300 ease-out
        ${colors.bg}
        ${colors.border}
        ${isActive ? colors.glow + ' scale-110' : 'hover:scale-105'}
        ${isGhostMode && !isCentral ? 'opacity-40 grayscale' : 'opacity-100'}
        border-2
      `}
      style={{
        width,
        height,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        ...style,
      }}
      whileHover={{ scale: isActive ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`${label}${isActive ? ' (ativo)' : ''}`}
      role="button"
    >
      {/* Ícone */}
      <Icon 
        className={`${colors.text} ${isCentral ? 'w-8 h-8 mb-1' : 'w-6 h-6 mb-1'}`} 
        strokeWidth={1.5}
      />
      
      {/* Label */}
      <span className={`${colors.text} text-[10px] font-medium tracking-wide uppercase`}>
        {label}
      </span>
      
      {/* Indicador de ativo */}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 w-2 h-2 rounded-full bg-[#F7A731]"
          layoutId="activeIndicator"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      
      {/* Badge de Ghost Mode */}
      {isGhostMode && !isCentral && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white">👻</span>
        </div>
      )}
    </motion.button>
  );
});
