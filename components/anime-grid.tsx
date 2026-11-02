import { AnimeCard } from '@/components/anime-card';
import type { Anime } from '@/lib/types';

export function AnimeGrid({ items, className = 'anime-grid' }: { items: Anime[]; className?: string }) {
  return <div className={className}>{items.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}</div>;
}
