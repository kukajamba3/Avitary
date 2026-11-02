import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clapperboard, Eye, Heart, MessageCircle, Play, Star } from 'lucide-react';
import { AnimeRating } from '@/components/anime-rating';
import { EpisodePlayer } from '@/components/episode-player';
import { ReviewCard } from '@/components/review-card';
import { ReviewForm } from '@/components/review-form';
import { StatusSelector } from '@/components/status-selector';
import { ViewTracker } from '@/components/view-tracker';
import { formatCount, formatReleaseStatus, formatType } from '@/lib/format';
import { getAnimeBySlug, getAnimeReviews, getEpisodes } from '@/lib/data';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const anime = await getAnimeBySlug(slug);
  return anime ? { title: anime.title_ru, description: anime.description ?? `Описание и эпизоды аниме «${anime.title_ru}» в каталоге Avitary.` } : { title: 'Тайтл не найден' };
}

export default async function AnimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const anime = await getAnimeBySlug(slug);
  if (!anime) notFound();
  const [episodes, reviews] = await Promise.all([
    getEpisodes(anime.id, anime),
    getAnimeReviews(anime.id),
  ]);
  const image = anime.banner_url || anime.poster_url || '/posters/hero-evening.svg';

  return (
    <div className="container page-shell">
      <ViewTracker animeId={anime.id} />
      <Link href="/catalog" className="breadcrumb"><ArrowLeft size={13} /> Назад в каталог</Link>
      <section className="detail-hero" style={{ marginTop: 16 }}>
        <div className="detail-backdrop" style={{ backgroundImage: `url(${JSON.stringify(image)})` }} />
        <div className="detail-shade" />
        <div className="detail-content">
          <div className="detail-poster"><img src={anime.poster_url || '/posters/empty-poster.svg'} alt={`Постер «${anime.title_ru}»`} fetchPriority="high" /></div>
          <div className="detail-copy">
            <span className="eyebrow">Каталог Avitary</span>
            <h1>{anime.title_ru}</h1>
            {anime.title_original ? <p className="detail-original">{anime.title_original}</p> : null}
            <div className="detail-meta">
              <span className="detail-chip"><CalendarDays size={12} /> {anime.year ?? 'Год неизвестен'}</span>
              <span className="detail-chip"><Clapperboard size={12} /> {formatType(anime.type)}</span>
              <span className="detail-chip">{formatReleaseStatus(anime.release_status)}</span>
              {anime.age_rating ? <span className="detail-chip">{anime.age_rating}</span> : null}
            </div>
            <div className="detail-rating"><Star size={20} fill="currentColor" /> {anime.average_rating ? anime.average_rating.toFixed(1) : '—'} <small>оценка сообщества · {formatCount(anime.ratings_count)} оценок</small></div>
            <div className="detail-actions">
<StatusSelector animeId={anime.id} slug={anime.slug} />
              <a className="button button-secondary" href="#episodes"><Play size={14} /> К эпизодам</a>
            </div>
          </div>
        </div>
      </section>

      <div className="detail-columns">
        <div className="grid gap-5">
          <section className="surface content-card">
            <h2>Об этой истории</h2>
            <p>{anime.description || 'Описание скоро появится. Пока можно добавить тайтл в свою коллекцию и следить за обновлениями.'}</p>
            {anime.genres.length ? <div className="genre-list">{anime.genres.map((genre) => <Link key={genre} href={`/catalog?genre=${encodeURIComponent(genre)}`} className="genre-chip">{genre}</Link>)}</div> : null}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="soft-panel p-3"><span className="block text-[10px] text-[var(--muted)]">Эпизодов</span><strong className="mt-1 block text-sm">{anime.episodes_count ?? episodes.length ?? '—'}</strong></div>
              <div className="soft-panel p-3"><span className="block text-[10px] text-[var(--muted)]">Просмотров в Avitary</span><strong className="mt-1 flex items-center gap-1.5 text-sm"><Eye size={13} className="text-[var(--brand)]" /> {formatCount(anime.views_count)}</strong></div>
              <div className="soft-panel p-3"><span className="block text-[10px] text-[var(--muted)]">В коллекциях</span><strong className="mt-1 flex items-center gap-1.5 text-sm"><Heart size={13} className="text-[var(--brand)]" /> {formatCount(Math.max(0, anime.popularity_count - anime.views_count - anime.ratings_count))}</strong></div>
            </div>
          </section>

          <section id="episodes" className="surface content-card">
            <div className="flex items-end justify-between gap-3"><div><h2>Эпизоды</h2><p style={{ margin: '5px 0 0', fontSize: 11 }}>Выберите серию, чтобы открыть плеер.</p></div><span className="detail-chip">{episodes.length || anime.episodes_count || 0} серий</span></div>
            <div className="mt-4"><EpisodePlayer episodes={episodes} /></div>
          </section>

          <section className="surface content-card">
            <div className="flex items-center justify-between gap-3"><div><h2>Отзывы зрителей</h2><p style={{ margin: '5px 0 0', fontSize: 11 }}>Личные впечатления и оценки сообщества.</p></div><span className="detail-chip"><MessageCircle size={12} /> {reviews.length}</span></div>
            <ReviewForm animeId={anime.id} />
            {reviews.length ? <div className="review-list">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : <div className="empty-state mt-4" style={{ minHeight: 150 }}><div><span className="empty-icon"><MessageCircle size={19} /></span><strong className="block text-xs text-[var(--text)]">Здесь пока тихо</strong><span className="mt-1 block text-[11px]">Станьте первым, кто поделится впечатлением.</span></div></div>}
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section className="surface content-card">
            <span className="eyebrow">Оценка сообщества</span>
            <div className="mt-3 flex items-end gap-2"><strong className="text-4xl font-extrabold tracking-[-.06em]">{anime.average_rating ? anime.average_rating.toFixed(1) : '—'}</strong><span className="mb-1 text-xs text-[var(--muted)]">/ 10</span></div>
            <div className="mt-2 flex items-center gap-1 text-[var(--brand)]">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={anime.average_rating >= (index + 1) * 2 ? 'currentColor' : 'none'} />)}</div>
            <p className="mt-3 text-[10px] text-[var(--muted)]">Среднее значение оценок пользователей проекта.</p>
            <div className="mt-4 border-t border-[var(--line)] pt-4"><span className="mb-2 block text-[10px] font-bold">Твоя оценка</span><AnimeRating animeId={anime.id} /></div>
          </section>
          <section className="soft-panel p-5">
            <span className="eyebrow">Добавь в список</span>
            <h2 className="mt-2 text-base font-extrabold tracking-[-.035em]">Не потеряй эту историю</h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">Отметь, что смотришь сейчас, или сохрани тайтл на будущее.</p>
            <div className="mt-4"><StatusSelector animeId={anime.id} slug={anime.slug} /></div>
          </section>
          <div className="soft-panel p-5"><span className="eyebrow">Avitary рядом</span><p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">Твоя коллекция и отзывы сохраняются в профиле — вернись к ним в любой момент.</p><Link href="/library" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--brand)]">Открыть коллекцию <ArrowLeft size={13} className="rotate-180" /></Link></div>
        </aside>
      </div>
    </div>
  );
}
