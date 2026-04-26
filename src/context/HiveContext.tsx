/**
 * @file HiveContext.tsx
 * @description Contexto global do Linker Hive adaptado à Sócio do Tabuleiro
 * @module contexts/HiveContext
 * 
 * ## Arquitetura
 * - Gerencia estado global: modo anônimo (Ghost), frequência ativa, expansão
 * - Persiste preferências no localStorage
 * - Integrado ao sistema de autenticação existente
 * 
 * ## Integração com API
 * - Ghost mode: PATCH /profiles/me { ghostMode: boolean }
 * - Frequências: mapeadas para endpoints da API mesa
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/** Frequências disponíveis no ecossistema Hive */
export type HiveFrequency = 
  | 'home'       // Perfil do Comandante
  | 'network'    // Network de contatos
  | 'hives'      // Clãs/Grupos
  | 'market'     // Mercado/Mesas
  | 'academy'    // Academia/Conteúdo
  | 'playground' // Playground/Jogos
  | 'radar';     // Radar/Descoberta

/** Configurações de privacidade por frequência */
export interface PrivacySettings {
  network: boolean;
  hives: boolean;
  market: boolean;
  academy: boolean;
  playground: boolean;
  radar: boolean;
}

interface HiveContextType {
  // Estado
  isGhostMode: boolean;
  activeFrequency: HiveFrequency;
  isExpanded: boolean;
  isMobile: boolean;
  privacySettings: PrivacySettings;
  
  // Ações
  toggleGhostMode: () => void;
  setGhostMode: (value: boolean) => void;
  handleHexClick: (id: HiveFrequency | 'user') => void;
  setPrivacySettings: (settings: Partial<PrivacySettings>) => void;
  goHome: () => void;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  network: true,
  hives: true,
  market: true,
  academy: true,
  playground: true,
  radar: true,
};

const HiveContext = createContext<HiveContextType | undefined>(undefined);

export function HiveProvider({ children }: { children: React.ReactNode }) {
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [activeFrequency, setActiveFrequency] = useState<HiveFrequency>('home');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [privacySettings, setPrivacyState] = useState<PrivacySettings>(DEFAULT_PRIVACY);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carregar preferências do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedGhost = localStorage.getItem('hive_ghost_mode');
      const storedPrivacy = localStorage.getItem('hive_privacy');
      
      if (storedGhost) setIsGhostMode(storedGhost === 'true');
      if (storedPrivacy) {
        try {
          setPrivacyState({ ...DEFAULT_PRIVACY, ...JSON.parse(storedPrivacy) });
        } catch {
          // ignore parse errors
        }
      }
    }
  }, []);

  // Persistir ghost mode
  const toggleGhostMode = useCallback(() => {
    setIsGhostMode((prev) => {
      const newState = !prev;
      localStorage.setItem('hive_ghost_mode', String(newState));
      return newState;
    });
  }, []);

  const setGhostMode = useCallback((value: boolean) => {
    setIsGhostMode(value);
    localStorage.setItem('hive_ghost_mode', String(value));
  }, []);

  // Gerenciar cliques nos hexágonos
  const handleHexClick = useCallback((id: HiveFrequency | 'user') => {
    if (id === 'user') {
      if (isExpanded) {
        setIsExpanded(false);
        setActiveFrequency('home');
      } else {
        setIsExpanded(true);
      }
    } else {
      setIsExpanded(true);
      setActiveFrequency(id);
    }
  }, [isExpanded]);

  // Voltar para home
  const goHome = useCallback(() => {
    setIsExpanded(false);
    setActiveFrequency('home');
  }, []);

  // Atualizar privacidade
  const setPrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    setPrivacyState((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('hive_privacy', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <HiveContext.Provider value={{ 
      isGhostMode, 
      toggleGhostMode, 
      setGhostMode,
      activeFrequency,
      isExpanded,
      isMobile,
      handleHexClick,
      privacySettings,
      setPrivacySettings,
      goHome,
    }}>
      {children}
    </HiveContext.Provider>
  );
}

export function useHive() {
  const context = useContext(HiveContext);
  if (context === undefined) {
    throw new Error('useHive must be used within a HiveProvider');
  }
  return context;
}
