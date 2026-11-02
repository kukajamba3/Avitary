import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { ReviewModerationCard } from '@/components/review-moderation';
import { createClient } from '@/lib/supabase/server';
import type { PublicReview } from '@/lib/types';

export const metadata: Metadata = { title: 'Модерация сообщества' };

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fadmin');
  if (user.app_metadata?.role !== 'admin') redirect('/');

  const [{ data: pendingReviews }, { data: recentReports }] = await Promise.all([
    supabase.from('reviews').select('id,rating,text,created_at,anime:anime!reviews_anime_id_fkey(slug,title_ru,poster_url,year),profile:profiles!reviews_user_id_fkey(username,nickname,avatar_url)').eq('is_visible', false).order('created_at', { ascending: true }).limit(50),
    supabase.from('review_reports').select('id,reason,created_at,review:reviews!review_reports_review_id_fkey(id,rating,text,created_at,anime:anime!reviews_anime_id_fkey(slug,title_ru,poster_url,year),profile:profiles!reviews_user_id_fkey(username,nickname,avatar_url))').order('created_at', { ascending: false }).limit(20),
  ]);

  const reportedCount = new Map<string, number>();
  for (const report of recentReports ?? []) {
    const review = Array.isArray(report.review) ? report.review[0] : report.review;
    if (review?.id) reportedCount.set(review.id, (reportedCount.get(review.id) ?? 0) + 1);
  }

  return (
    <div className="container page-shell">
      <div className="catalog-heading"><div><span className="eyebrow">Только для команды</span><h1>Модерация</h1><p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>Проверяйте новые отзывы и решайте вопросы сообщества.</p></div><span className="detail-chip"><ShieldCheck size={13} /> Администратор</span></div>
      <section className="section" style={{ marginTop: 30 }}><div className="section-heading"><div><h2>Ожидают проверки</h2><p>Новые отзывы скрыты до решения модератора.</p></div><span className="detail-chip">{pendingReviews?.length ?? 0}</span></div>{pendingReviews?.length ? <div className="grid gap-3">{(pendingReviews as unknown as PublicReview[]).map((review) => <ReviewModerationCard key={review.id} review={review} reports={reportedCount.get(review.id) ?? 0} />)}</div> : <div className="empty-state"><div><span className="empty-icon"><ShieldCheck size={20} /></span><strong className="block text-xs text-[var(--text)]">Очередь пуста</strong><span className="mt-1 block text-[11px]">Новые отзывы появятся здесь.</span></div></div>}</section>
      <section className="section"><div className="section-heading"><div><h2>Последние жалобы</h2><p>Повторные жалобы на отзыв можно изучить в его карточке.</p></div><span className="detail-chip">{recentReports?.length ?? 0}</span></div>{recentReports?.length ? <div className="grid gap-3">{recentReports.map((report) => { const review = Array.isArray(report.review) ? report.review[0] : report.review; return review ? <div key={report.id} className="surface p-4"><span className="eyebrow">Жалоба · {new Date(report.created_at).toLocaleDateString('ru-RU')}</span><p className="mt-2 text-xs text-[var(--muted)]">{report.reason}</p><ReviewModerationCard review={review as PublicReview} visible /></div> : null; })}</div> : <div className="empty-state" style={{ minHeight: 140 }}>Жалоб пока нет.</div>}</section>
    </div>
  );
}
