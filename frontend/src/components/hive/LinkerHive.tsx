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

import React, { memo } from 'react';
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
  const { activeFrequency, isMenuOpen, isMobile, handleHexClick, closeMenu } = useHive();
  
  const centralHex = hexagons.find(h => h.isCentral);
  const satellites = hexagons.filter(h => !h.isCentral);

  const orbitRadius = isMobile ? 122 : 188;
  const orbitHexSize = isMobile ? 82 : 110;
  const centralSize = isMobile ? 92 : 126;

  return (
    <>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="absolute inset-0 z-40 overflow-hidden bg-[#050505]/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          >
            {centralHex && (
              <motion.div
                className="absolute left-1/2 top-1/2 pointer-events-auto"
                style={{ transform: 'translate(-50%, -50%)' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                onClick={(event) => event.stopPropagation()}
              >
                <HexagonAgent
                  id={centralHex.id as HiveFrequency | 'user'}
                  label={centralHex.label}
                  icon={centralHex.icon}
                  isCentral
                  size={centralSize}
                  onClick={() => handleHexClick(centralHex.id as HiveFrequency | 'user')}
                />
              </motion.div>
            )}

            {satellites.map((hex, index) => {
              const angle = (index * (360 / satellites.length) - 90) * (Math.PI / 180);
              const x = Math.cos(angle) * orbitRadius;
              const y = Math.sin(angle) * orbitRadius;

              return (
                <motion.div
                  key={hex.id}
                  className="absolute left-1/2 top-1/2 pointer-events-auto"
                  initial={{ x: -orbitHexSize / 2, y: -orbitHexSize / 2, opacity: 0, scale: 0.5 }}
                  animate={{
                    x: x - orbitHexSize / 2,
                    y: y - (orbitHexSize * 1.1547) / 2,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{ x: -orbitHexSize / 2, y: -orbitHexSize / 2, opacity: 0, scale: 0.5 }}
                  transition={{
                    type: 'spring',
                    stiffness: 210,
                    damping: 22,
                    delay: index * 0.035,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <HexagonAgent
                    id={hex.id as HiveFrequency}
                    label={hex.label}
                    icon={hex.icon}
                    size={orbitHexSize}
                    onClick={() => handleHexClick(hex.id as HiveFrequency)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#050505]/95 backdrop-blur-xl safe-area-bottom"
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="mx-auto flex max-w-[560px] items-center justify-around px-2 py-2 md:max-w-3xl">
          {hexagons.map((hex) => {
            const isActive = activeFrequency === hex.id || (hex.id === 'user' && activeFrequency === 'home');
            return (
              <button
                key={hex.id}
                onClick={() => handleHexClick(hex.id as HiveFrequency | 'user')}
                className={`
                  relative flex min-w-[54px] flex-col items-center gap-1 px-1.5 py-1.5 transition-all md:min-w-[76px]
                  ${isActive ? 'text-white' : 'text-white/55 hover:text-white/80'}
                `}
              >
                <hex.icon className="h-5 w-5" strokeWidth={1.45} />
                <span className="text-[9px] font-medium uppercase leading-none tracking-wider md:text-[10px]">
                  {hex.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute top-0 h-1 w-1 rounded-full bg-[#F7A731]"
                    layoutId="hiveDockIndicator"
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
});
