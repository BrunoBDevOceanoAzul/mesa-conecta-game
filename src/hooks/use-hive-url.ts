/**
 * @file use-hive-url.ts
 * @description Hook para sincronizar estado do Hive com query params da URL
 * @module hooks/useHiveUrl
 * 
 * ## Arquitetura
 * - Lê frequência ativa e overlays da URL no mount
 * - Sincroniza mudanças de estado de volta para a URL
 * - Permite compartilhar/bookmark estados específicos do Hive
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHive, type HiveFrequency } from '@/context/HiveContext';

export function useHiveUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeFrequency, handleHexClick, overlays, openOverlay, closeOverlay } = useHive();

  // Read query params on mount
  useEffect(() => {
    const f = searchParams.get('f') as HiveFrequency | null;
    const overlay = searchParams.get('overlay');
    
    if (f && ['home', 'network', 'market', 'hives', 'academy', 'playground', 'radar'].includes(f)) {
      handleHexClick(f);
    }
    
    if (overlay) {
      openOverlay(overlay, Object.fromEntries(searchParams.entries()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state back to URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (activeFrequency !== 'home') {
      params.set('f', activeFrequency);
    }
    
    if (overlays.length > 0) {
      const topOverlay = overlays[overlays.length - 1];
      params.set('overlay', topOverlay.id);
      Object.entries(topOverlay.params).forEach(([key, value]) => {
        if (key !== 'f' && key !== 'overlay') {
          params.set(key, value);
        }
      });
    }
    
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFrequency, overlays]);
}
