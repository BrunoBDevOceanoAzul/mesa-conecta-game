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

/** Configuração de overlay aberto */
export interface OverlayConfig {
  id: string;
  params: Record<string, string>;
}

interface HiveContextType {
  // Estado
  isGhostMode: boolean;
  activeFrequency: HiveFrequency;
  isExpanded: boolean;
  isMenuOpen: boolean;
  isMobile: boolean;
  privacySettings: PrivacySettings;
  overlays: OverlayConfig[];
  
  // Ações
  toggleGhostMode: () => void;
  setGhostMode: (value: boolean) => void;
  handleHexClick: (id: HiveFrequency | 'user') => void;
  toggleMenu: () => void;
  closeMenu: () => void;
  setPrivacySettings: (settings: Partial<PrivacySettings>) => void;
  goHome: () => void;
  openOverlay: (id: string, params?: Record<string, string>) => void;
  closeOverlay: () => void;
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [privacySettings, setPrivacyState] = useState<PrivacySettings>(DEFAULT_PRIVACY);
  const [overlays, setOverlays] = useState<OverlayConfig[]>([]);

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
      setActiveFrequency('home');
      setIsExpanded(false);
      setIsMenuOpen((prev) => !prev);
    } else {
      setActiveFrequency(id);
      setIsExpanded(false);
      setIsMenuOpen(false);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Voltar para home
  const goHome = useCallback(() => {
    setIsExpanded(false);
    setActiveFrequency('home');
    setIsMenuOpen(false);
  }, []);

  // Atualizar privacidade
  const setPrivacySettings = useCallback((settings: Partial<PrivacySettings>) => {
    setPrivacyState((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('hive_privacy', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Gerenciar overlays
  const openOverlay = useCallback((id: string, params?: Record<string, string>) => {
    setOverlays((prev) => [...prev, { id, params: params || {} }]);
  }, []);

  const closeOverlay = useCallback(() => {
    setOverlays((prev) => prev.slice(0, -1));
  }, []);

  return (
    <HiveContext.Provider value={{ 
      isGhostMode, 
      toggleGhostMode, 
      setGhostMode,
      activeFrequency,
      isExpanded,
      isMenuOpen,
      isMobile,
      handleHexClick,
      toggleMenu,
      closeMenu,
      privacySettings,
      setPrivacySettings,
      goHome,
      overlays,
      openOverlay,
      closeOverlay,
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
