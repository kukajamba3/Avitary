'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Send, Star } from 'lucide-react';
import { submitReview } from '@/app/actions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

export function ReviewForm({ animeId }: { animeId: string }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setReady(true); return; }
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => { setAuthenticated(Boolean(data.user)); setReady(true); });
  }, []);

  async function send() {
    setFeedback(''); setPending(true);
    const result = await submitReview(animeId, rating, text);
    setFeedback(result.ok ? result.message ?? 'Готово' : result.error);
    setPending(false);
    if (result.ok) { setText(''); setRating(0); }
  }

  if (!ready || !authenticated) return <div className="soft-panel mt-4 p-4 text-xs text-[var(--muted)]">Чтобы оставить отзыв, <Link href="/login" className="font-bold text-[var(--brand)]">войдите в аккаунт</Link>.</div>;

  return <div className="soft-panel mt-4 p-4"><strong className="block text-xs">Поделитесь впечатлением</strong><div className="mt-3 flex items-center gap-1" role="group" aria-label="Оценка для отзыва">{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <button key={value} type="button" className="grid h-7 w-7 place-items-center rounded-lg text-[var(--brand)] hover:bg-[var(--brand-wash)]" onClick={() => setRating(value)} aria-label={`${value} из 10`}><Star size={14} fill={rating >= value ? 'currentColor' : 'none'} /></button>)}<span className="ml-2 text-[10px] text-[var(--muted)]">{rating ? `${rating}/10` : 'Оценка'}</span></div><textarea className="form-control mt-3" value={text} onChange={(event) => setText(event.target.value)} maxLength={3000} placeholder="Что вам запомнилось? Минимум 30 символов…" aria-label="Текст отзыва" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-[var(--muted)]">{text.length}/3000 · Отзыв появится после проверки</span><button type="button" className="button button-primary" onClick={send} disabled={pending || !rating || text.trim().length < 30}>{pending ? 'Отправка…' : 'Отправить'} <Send size={13} /></button></div>{feedback ? <p role="status" className={`mt-3 text-[10px] ${feedback.startsWith('Отзыв сохранён') ? 'text-[var(--mint)]' : 'text-rose'}`}>{feedback}</p> : null}</div>;
}
