/**
 * @file LinkerHive.tsx
 * @description Layout hexagonal principal do ecossistema Hive
 * @module components/hive/LinkerHive
 * 
 * ## Layout
 * - Desktop: Hexágonos orbitais ao redor do centro
 * - Mobile: Dock inferior com ícones
 * - Animações fluidas com framer-motion
 * 
 * ## Responsividade
 * - < 768px: Modo dock móvel (barra inferior)
 * - >= 768px: Modo orbital (hexágonos ao redor)
 */

'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { HexagonAgent } from './HexagonAgent';
import { useHive } from '@/context/HiveContext';
import type { HiveFrequency } from '@/context/HiveContext';

interface HexConfig {
  id: HiveFrequency | 'user';
  label: string;
  icon: LucideIcon;
  color?: string;
  isCentral?: boolean;
}

interface LinkerHiveProps {
  hexagons: HexConfig[];
}

export const LinkerHive = memo(function LinkerHive({ hexagons }: LinkerHiveProps) {
  const { activeFrequency, isExpanded, isMobile, handleHexClick } = useHive();
  const [showDock, setShowDock] = useState(true);
  const lastScrollY = useRef(0);
  
  const centralHex = hexagons.find(h => h.isCentral);
  const satellites = hexagons.filter(h => !h.isCentral);

  // Mobile: Dock flutuante com scroll detection
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Mostrar dock quando scrolla pra cima ou está no topo
      // Esconder quando scrolla pra baixo e já passou de 100px
      if (currentScrollY < 100) {
        setShowDock(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowDock(false);
      } else {
        setShowDock(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  // Mobile: Renderizar como dock inferior flutuante
  if (isMobile) {
    return (
      <>
        {/* Área sensível na borda inferior para reexibir dock */}
        {!showDock && (
          <div 
            className="fixed bottom-0 left-0 right-0 h-8 z-40"
            onClick={() => setShowDock(true)}
          />
        )}
        <motion.nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom"
          initial={{ y: 100 }}
          animate={{ y: showDock ? 0 : 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {hexagons.map((hex) => (
              <button
                key={hex.id}
                onClick={() => handleHexClick(hex.id as HiveFrequency | 'user')}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px]
                  ${activeFrequency === hex.id 
                    ? 'text-[#F7A731] scale-110' 
                    : 'text-white/60 hover:text-white/80'
                  }
                `}
              >
                <hex.icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[9px] font-medium uppercase tracking-wider">
                  {hex.label}
                </span>
                {activeFrequency === hex.id && (
                  <motion.div
                    className="absolute -top-1 w-1 h-1 rounded-full bg-[#F7A731]"
                    layoutId="mobileIndicator"
                  />
                )}
              </button>
            ))}
          </div>
        </motion.nav>
      </>
    );
  }
  
  // Desktop: Layout orbital
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {/* Hexágono Central */}
        {centralHex && (
          <motion.div
            className="absolute pointer-events-auto"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <HexagonAgent
              id={centralHex.id as HiveFrequency | 'user'}
              label={centralHex.label}
              icon={centralHex.icon}
              isCentral
              size={isExpanded ? 100 : 140}
              onClick={() => handleHexClick(centralHex.id as HiveFrequency | 'user')}
            />
          </motion.div>
        )}
        
        {/* Satélites Orbitais */}
        {!isExpanded && satellites.map((hex, index) => {
          const angle = (index * (360 / satellites.length) - 90) * (Math.PI / 180);
          const radius = 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={hex.id}
              className="absolute pointer-events-auto"
              style={{
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ 
                x: x - 65, // Center the hex (130px / 2)
                y: y - 75, // Center the hex (~150px / 2)
                opacity: 1, 
                scale: 1 
              }}
              exit={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              transition={{ 
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: index * 0.05,
              }}
            >
              <HexagonAgent
                id={hex.id as HiveFrequency}
                label={hex.label}
                icon={hex.icon}
                size={110}
                onClick={() => handleHexClick(hex.id as HiveFrequency)}
              />
            </motion.div>
          );
        })}
        
        {/* Modo Expandido - Dock lateral */}
        {isExpanded && satellites.map((hex, index) => {
          const isLeft = index < 3;
          const normalizedIndex = index % 3;
          const yPositions = [15, 50, 85]; // Percentages
          
          return (
            <motion.div
              key={hex.id}
              className="absolute pointer-events-auto"
              initial={{ 
                x: isLeft ? -150 : window.innerWidth + 150,
                opacity: 0,
              }}
              animate={{ 
                x: isLeft ? 20 : window.innerWidth - 150,
                y: `${yPositions[normalizedIndex]}vh`,
                opacity: 1,
              }}
              exit={{ 
                x: isLeft ? -150 : window.innerWidth + 150,
                opacity: 0,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <HexagonAgent
                id={hex.id as HiveFrequency}
                label={hex.label}
                icon={hex.icon}
                size={activeFrequency === hex.id ? 120 : 100}
                onClick={() => handleHexClick(hex.id as HiveFrequency)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
