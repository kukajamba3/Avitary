import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { ProfileOwnerActions } from '@/components/profile-owner-actions';
import { getProfileReviews, getProfileStats, getPublicProfile } from '@/lib/data';
import { formatDate } from '@/lib/format';

// Profile visibility can change at any time; never serve a stale public profile from ISR.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  return profile ? { title: `${profile.nickname} (@${profile.username})`, description: `Публичный профиль ${profile.nickname} в Avitary.` } : { title: 'Профиль не найден' };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();
  const [stats, reviews] = await Promise.all([
    getProfileStats(profile.id),
    getProfileReviews(profile.id),
  ]);
  const denominator = Math.max(stats.total, 1);
  const bars = [
    { label: 'Просмотрено', value: stats.completed, accent: 'linear-gradient(90deg,#9a91ed,#665bd2)' },
    { label: 'В планах', value: stats.planned, accent: 'linear-gradient(90deg,#81c5b7,#439a8a)' },
    { label: 'Брошено', value: stats.dropped, accent: 'linear-gradient(90deg,#efa2b5,#ca6680)' },
    { label: 'Смотрю', value: stats.watching, accent: 'linear-gradient(90deg,#e9c184,#cf9652)' },
  ];

  return (
    <div className="container page-shell">
      <div className="profile-banner" style={!profile.banner_url ? { background: 'linear-gradient(120deg,#e9e7ff,#d6d3f9 52%,#f2d9e8)' } : undefined}>
        {profile.banner_url ? <img src={profile.banner_url} alt="Баннер профиля" /> : null}
      </div>
      <section className="profile-header">
        <div className="profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt={`Аватар ${profile.nickname}`} /> : <div className="grid h-full place-items-center text-2xl font-extrabold text-[var(--brand)]">{profile.nickname.slice(0, 1).toUpperCase()}</div>}</div>
        <div className="profile-info"><h1>{profile.nickname}</h1><p>@{profile.username} <span className="mx-1">·</span><CalendarDays size={11} className="inline" /> В Avitary с {formatDate(profile.created_at)}</p></div>
        <div className="profile-actions"><ProfileOwnerActions profileId={profile.id} /></div>
      </section>

      <section className="stats-grid" aria-label="Статистика коллекции">
        {bars.map((bar) => <div key={bar.label} className="stat-card"><span className="stat-number">{bar.value.toLocaleString('ru-RU')}</span><span className="stat-label">{bar.label}</span><div className="stat-track"><span style={{ width: `${Math.min((bar.value / denominator) * 100, 100)}%`, background: bar.accent }} /></div></div>)}
      </section>

      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">Словами зрителя</span><h2>Отзывы</h2><p>{reviews.length ? 'Открытые впечатления из коллекции' : 'Публичные отзывы появятся здесь'}</p></div><span className="detail-chip">{reviews.length} отзывов</span></div>
        {reviews.length ? <div className="grid gap-3 sm:grid-cols-2">{reviews.map((review) => <article className="surface p-4" key={review.id}><div className="flex items-start gap-3"><div className="avatar h-12 w-9 rounded-lg">{review.anime?.poster_url ? <img src={review.anime.poster_url} alt="" /> : <Sparkles size={14} />}</div><div className="min-w-0 flex-1"><Link href={review.anime?.slug ? `/anime/${review.anime.slug}` : '/catalog'} className="text-xs font-extrabold hover:text-[var(--brand)]">{review.anime?.title_ru ?? 'Аниме'}</Link><div className="mt-1 text-[10px] text-[var(--muted)]">Оценка {review.rating}/10 · {formatDate(review.created_at)}</div></div></div><p className="mt-3 line-clamp-4 text-xs leading-relaxed text-[var(--muted)]">{review.text}</p></article>)}</div> : <div className="empty-state"><div><span className="empty-icon"><Sparkles size={20} /></span><strong className="block text-xs text-[var(--text)]">Пока нет опубликованных отзывов</strong><span className="mt-1 block text-[11px]">Открытые впечатления будут отображаться в этом профиле.</span></div></div>}
      </section>
      <div className="mt-8 flex justify-end"><Link href="/catalog" className="text-link">Исследовать каталог <ArrowRight size={14} /></Link></div>
    </div>
  );
}
