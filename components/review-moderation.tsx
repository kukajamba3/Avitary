'use client';

import { useState } from 'react';
import { Check, EyeOff } from 'lucide-react';
import { moderateReview } from '@/app/actions';
import type { PublicReview } from '@/lib/types';

export function ReviewModerationCard({ review, visible = false, reports = 0 }: { review: PublicReview; visible?: boolean; reports?: number }) {
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function decide(publish: boolean) {
    setPending(true); setMessage('');
    const result = await moderateReview(review.id, publish, note);
    setMessage(result.ok ? result.message ?? 'Сохранено' : result.error);
    setPending(false);
  }

  return (
    <article className="surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="eyebrow">{visible ? 'Опубликован' : 'На проверке'}</span><h3 className="mt-1 text-sm font-extrabold">{review.anime?.title_ru ?? 'Аниме'}</h3><p className="mt-1 text-[10px] text-[var(--muted)]">Автор: {review.profile?.nickname ?? review.profile?.username ?? 'Пользователь'} · оценка {review.rating}/10{reports ? ` · жалоб: ${reports}` : ''}</p></div><span className="detail-chip">{new Date(review.created_at).toLocaleDateString('ru-RU')}</span></div>
      <p className="mt-4 whitespace-pre-wrap text-xs leading-relaxed text-[var(--muted)]">{review.text}</p>
      <textarea className="form-control mt-4" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Заметка модератора (необязательно)" aria-label="Заметка модератора" style={{ minHeight: 65 }} />
      <div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" className="button button-secondary" disabled={pending} onClick={() => decide(false)}><EyeOff size={14} /> Скрыть</button>{!visible ? <button type="button" className="button button-primary" disabled={pending} onClick={() => decide(true)}><Check size={14} /> Опубликовать</button> : null}</div>
      {message ? <p role="status" className="mt-3 text-right text-[10px] text-[var(--muted)]">{message}</p> : null}
    </article>
  );
}
