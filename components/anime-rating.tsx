'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { saveAnimeRating } from '@/app/actions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

export function AnimeRating({ animeId }: { animeId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setReady(true); return; }
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.user));
      if (data.user) {
        const { data: saved } = await supabase.from('anime_ratings').select('rating').eq('user_id', data.user.id).eq('anime_id', animeId).maybeSingle();
        if (active) setRating(saved?.rating ?? null);
      }
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, [animeId]);

  if (!ready || !authenticated) return <Link href="/login" className="text-xs font-semibold text-[var(--brand)]">Войдите, чтобы оценить</Link>;

  async function choose(value: number) {
    setMessage(''); setPending(true);
    const result = await saveAnimeRating(animeId, value);
    setPending(false);
    if (result.ok) { setRating(value); setMessage(result.message ?? 'Оценка сохранена'); }
    else setMessage(result.error);
  }

  return <div><div className="flex items-center gap-1" role="group" aria-label="Ваша оценка от 1 до 10" onMouseLeave={() => setHover(null)}>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <button key={value} type="button" aria-label={`${value} из 10`} disabled={pending} onMouseEnter={() => setHover(value)} onFocus={() => setHover(value)} onClick={() => choose(value)} className="grid h-7 w-7 place-items-center rounded-lg text-[var(--brand)] transition hover:bg-[var(--brand-wash)]"><Star size={15} fill={(hover ?? rating ?? 0) >= value ? 'currentColor' : 'none'} /></button>)}</div><span className="mt-1 block text-[10px] text-[var(--muted)]">{message || (rating ? `Твоя оценка: ${rating}/10` : 'Нажми на звезду, чтобы оценить')}</span></div>;
}
