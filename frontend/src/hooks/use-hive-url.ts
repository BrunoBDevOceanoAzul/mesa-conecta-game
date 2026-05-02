import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useHive, type HiveFrequency } from '@/context/HiveContext';

export function useHiveUrl() {
  const router = useRouter();
  const { activeFrequency, handleHexClick, overlays, openOverlay, closeOverlay } = useHive();

  // Read query params on mount
  useEffect(() => {
    if (!router.isReady) return;
    const f = router.query.f as HiveFrequency | undefined;
    const overlay = router.query.overlay as string | undefined;

    if (f && ['home', 'network', 'market', 'hives', 'academy', 'playground', 'radar'].includes(f)) {
      handleHexClick(f);
    }

    if (overlay) {
      const params = { ...router.query } as Record<string, string>;
      delete params.f;
      delete params.overlay;
      openOverlay(overlay, params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Sync state back to URL
  useEffect(() => {
    if (!router.isReady) return;

    const params = new URLSearchParams();

    if (activeFrequency !== 'home') {
      params.set('f', activeFrequency);
    }

    if (overlays.length > 0) {
      const topOverlay = overlays[overlays.length - 1];
      params.set('overlay', topOverlay.id);
      Object.entries(topOverlay.params).forEach(([key, value]) => {
        if (key !== 'f' && key !== 'overlay') {
          params.set(key, value as string);
        }
      });
    }

    const qs = params.toString();
    const currentQs = router.asPath.split('?')[1] || '';

    if (qs !== currentQs) {
      const newPath = qs ? `${router.pathname}?${qs}` : router.pathname;
      router.replace(newPath, undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFrequency, overlays, router.isReady]);
}
