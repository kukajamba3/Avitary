import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookmarkCheck, Plus } from 'lucide-react';
import { AnimeGrid } from '@/components/anime-grid';
import { getCurrentProfile, getLibrary, getUserId } from '@/lib/data';
import type { AnimeStatus } from '@/lib/types';

export const metadata: Metadata = { title: 'Моя коллекция' };
const tabs: { value: string; label: string }[] = [
  { value: 'all', label: 'Всё' }, { value: 'watching', label: 'Смотрю' }, { value: 'planned', label: 'В планах' }, { value: 'completed', label: 'Просмотрено' }, { value: 'dropped', label: 'Брошено' },
];
const labels: Record<AnimeStatus, string> = { watching: 'Смотрю', planned: 'В планах', completed: 'Просмотрено', dropped: 'Брошено' };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const userId = await getUserId();
  if (!userId) redirect('/login?next=%2Flibrary');
  const [library, currentProfile] = await Promise.all([getLibrary(userId), getCurrentProfile()]);
  const selected = params.status && ['watching', 'planned', 'completed', 'dropped'].includes(params.status) ? params.status : 'all';
  const filtered = selected === 'all' ? library : library.filter((item) => item.status === selected);
  const counts = Object.fromEntries(tabs.map((tab) => [tab.value, tab.value === 'all' ? library.length : library.filter((item) => item.status === tab.value).length]));

  return (
    <div className="container page-shell">
      <div className="catalog-heading"><div><span className="eyebrow">Личное пространство</span><h1>{currentProfile ? `Коллекция ${currentProfile.nickname}` : 'Моя коллекция'}</h1><p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>Тайтлы, которые вы смотрите, планируете или уже посмотрели.</p></div><Link href="/catalog" className="button button-primary"><Plus size={15} /> Найти аниме</Link></div>
      <nav className="collection-tabs" aria-label="Фильтр коллекции">{tabs.map((tab) => <Link key={tab.value} href={tab.value === 'all' ? '/library' : `/library?status=${tab.value}`} className={`collection-tab ${selected === tab.value ? 'active' : ''}`}>{tab.label} <span className="ml-1 opacity-70">{counts[tab.value] ?? 0}</span></Link>)}</nav>
      {filtered.length ? (
        <><div className="mb-4 text-xs text-[var(--muted)]">{filtered.length} {filtered.length === 1 ? 'тайтл' : 'тайтла'} · статус можно изменить на странице аниме</div><AnimeGrid items={filtered.map((item) => item.anime)} className="catalog-grid" /><div className="mt-5 flex flex-wrap gap-2">{Array.from(new Set(filtered.map((item) => item.status))).map((status) => <span key={status} className="detail-chip"><BookmarkCheck size={12} /> {labels[status]}</span>)}</div></>
      ) : (
        <div className="empty-state"><div><span className="empty-icon"><BookmarkCheck size={20} /></span><strong className="block text-xs text-[var(--text)]">{selected === 'all' ? 'Коллекция пока пуста' : `Нет тайтлов со статусом «${tabs.find((tab) => tab.value === selected)?.label}»`}</strong><span className="mt-1 block text-[11px]">Найди историю в каталоге и добавь её в свой список.</span><Link href="/catalog" className="button button-primary mt-4"><Plus size={14} /> Открыть каталог</Link></div></div>
      )}
    </div>
  );
}
