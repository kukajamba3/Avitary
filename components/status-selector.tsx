'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkPlus, Check, ChevronDown, LoaderCircle } from 'lucide-react';
import { updateAnimeStatus } from '@/app/actions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { AnimeStatus } from '@/lib/types';

const options: { value: AnimeStatus; label: string; detail: string }[] = [
  { value: 'watching', label: 'Смотрю', detail: 'Продолжаю смотреть' },
  { value: 'planned', label: 'В планах', detail: 'Буду смотреть' },
  { value: 'completed', label: 'Просмотрено', detail: 'Уже посмотрел' },
  { value: 'dropped', label: 'Брошено', detail: 'Не планирую продолжать' },
];

export function StatusSelector({ animeId, slug }: { animeId: string; slug: string }) {
  const [status, setStatus] = useState<AnimeStatus | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);
  const selected = options.find((option) => option.value === status);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setAuthReady(true); return; }
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.user));
      if (data.user) {
        const { data: saved } = await supabase.from('user_anime_status').select('status').eq('user_id', data.user.id).eq('anime_id', animeId).maybeSingle();
        if (active) setStatus((saved?.status as AnimeStatus | undefined) ?? null);
      }
      if (active) setAuthReady(true);
    });
    return () => { active = false; };
  }, [animeId]);

  if (!authReady || !authenticated) return <Link href={`/login?next=${encodeURIComponent(`/anime/${slug}`)}`} className="button button-primary"><BookmarkPlus size={15} /> Добавить в список</Link>;

  async function choose(next: AnimeStatus | null) {
    setFeedback(''); setPending(true);
    const result = await updateAnimeStatus(animeId, next);
    setPending(false);
    if (result.ok) {
      setStatus(next);
      setFeedback(result.message ?? 'Сохранено');
      setOpen(false);
    } else setFeedback(result.error);
  }

  return (
    <div className="relative">
      <button type="button" className="button button-primary" onClick={() => setOpen((value) => !value)} disabled={pending} aria-expanded={open}>
        {pending ? <LoaderCircle size={15} className="animate-spin" /> : selected ? <Check size={15} /> : <BookmarkPlus size={15} />}
        {selected?.label ?? 'Добавить в список'} <ChevronDown size={14} />
      </button>
      {open ? <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-soft">{options.map((option) => <button key={option.value} type="button" onClick={() => choose(option.value)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[var(--brand-wash)]"><span className={`grid h-8 w-8 place-items-center rounded-[11px] ${status === option.value ? 'bg-[var(--brand)] text-white' : 'bg-[var(--brand-wash)] text-[var(--brand)]'}`}><Check size={14} /></span><span className="flex-1"><span className="block text-xs font-bold">{option.label}</span><span className="mt-1 block text-[10px] text-[var(--muted)]">{option.detail}</span></span></button>)}{status ? <button type="button" onClick={() => choose(null)} className="w-full rounded-xl px-3 py-2 text-left text-[10px] font-semibold text-[var(--muted)] hover:bg-[var(--brand-wash)]">Убрать из списка</button> : null}</div> : null}
      {feedback ? <span role="status" className="mt-2 block max-w-xs text-[10px] text-[var(--muted)]">{feedback}</span> : null}
    </div>
  );
}
