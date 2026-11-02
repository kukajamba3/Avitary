'use client';

import { useState } from 'react';
import { CirclePlay, Play } from 'lucide-react';
import { HlsPlayer } from '@/components/hls-player';
import { formatDuration, formatEpisodeNumber } from '@/lib/format';
import type { Episode } from '@/lib/types';

export function EpisodePlayer({ episodes }: { episodes: Episode[] }) {
  const firstPlayable = episodes.find((episode) => episode.hls_url) ?? null;
  const [activeId, setActiveId] = useState<string | null>(firstPlayable?.id ?? null);
  const active = episodes.find((episode) => episode.id === activeId) ?? null;

  return (
    <div>
      {active?.hls_url ? <HlsPlayer src={active.hls_url} title={active.title || `Эпизод ${formatEpisodeNumber(active)}`} /> : (
        <div className="player-placeholder"><div><CirclePlay size={31} className="mx-auto mb-2 text-[var(--brand)]" /><strong className="block text-xs text-[var(--text)]">{active ? 'Видеопоток для этого эпизода пока недоступен' : 'Выберите эпизод, чтобы начать просмотр'}</strong><span className="mt-1 block max-w-xs text-[10px] leading-relaxed">Плеер начнёт воспроизведение только после вашего действия.</span></div></div>
      )}
      <div className="episode-list">
        {episodes.length ? episodes.map((episode) => (
          <button type="button" key={episode.id} onClick={() => setActiveId(episode.id)} className={`episode-row w-full text-left ${activeId === episode.id ? 'active' : ''}`}>
            <span className="episode-play"><Play size={14} fill="currentColor" /></span>
            <span className="episode-name">{formatEpisodeNumber(episode)}. {episode.title || `Эпизод ${formatEpisodeNumber(episode)}`}</span>
            <span className="episode-duration">{formatDuration(episode.duration_seconds) ?? (episode.hls_url ? 'Смотреть' : 'Скоро')}</span>
          </button>
        )) : <div className="empty-state" style={{ minHeight: 110 }}><span>Список эпизодов появится после обновления каталога.</span></div>}
      </div>
    </div>
  );
}
