'use client';

import { useEffect } from 'react';

export function ViewTracker({ animeId }: { animeId: string }) {
  useEffect(() => {
    if (!animeId || animeId.startsWith('demo-')) return;
    const key = `avitary-view:${animeId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
    void fetch(`/api/anime/${animeId}/view`, { method: 'POST', keepalive: true }).catch(() => {});
  }, [animeId]);
  return null;
}
