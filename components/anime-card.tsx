import Link from 'next/link';
import { Star } from 'lucide-react';
import { formatReleaseStatus, formatType } from '@/lib/format';
import type { Anime } from '@/lib/types';

export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <article className="anime-card">
      <Link href={`/anime/${anime.slug}`} className="block" aria-label={`Открыть тайтл: ${anime.title_ru}`}>
        <div className="anime-cover-wrap">
          <img src={anime.poster_url || '/posters/empty-poster.svg'} alt={`Постер «${anime.title_ru}»`} loading="lazy" decoding="async" />
          <span className="cover-rating"><Star size={12} fill="currentColor" /> {Number(anime.average_rating || 0).toFixed(1)}</span>
          <span className="cover-badge">{formatReleaseStatus(anime.release_status)}</span>
        </div>
        <span className="anime-card-title">{anime.title_ru}</span>
      </Link>
      <div className="anime-card-meta"><span>{anime.year ?? '—'} · {formatType(anime.type)}</span><span>{anime.age_rating ?? ''}</span></div>
      <div className="anime-card-genres">{anime.genres.slice(0, 3).join(' · ') || 'Новая история'}</div>
    </article>
  );
}
