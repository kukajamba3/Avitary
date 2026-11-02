'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Flag, Star } from 'lucide-react';
import { reportReview } from '@/app/actions';
import { formatDate } from '@/lib/format';
import type { PublicReview } from '@/lib/types';

export function ReviewCard({ review }: { review: PublicReview }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const profile = review.profile;
  const name = profile?.nickname || profile?.username || 'Зритель';

  function sendReport() {
    setMessage('');
    startTransition(async () => {
      const result = await reportReview(review.id, reason);
      setMessage(result.ok ? result.message ?? 'Отправлено' : result.error);
      if (result.ok) setReportOpen(false);
    });
  }

  return (
    <article className="review-card">
      <div className="review-header">
        <Link href={profile?.username ? `/u/${profile.username}` : '#'} className="avatar" aria-label={`Профиль ${name}`}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : name.slice(0, 1).toUpperCase()}
        </Link>
        <div className="review-byline"><strong>{name}</strong><span>{formatDate(review.created_at)}</span></div>
        <span className="review-score"><Star size={13} fill="currentColor" /> {review.rating}/10</span>
      </div>
      <p>{review.text}</p>
      <div className="review-actions">
        {reportOpen ? (
          <div className="w-full">
            <textarea className="form-control" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Коротко опишите причину" aria-label="Причина жалобы" style={{ minHeight: 70 }} />
            <div className="mt-2 flex justify-end gap-2"><button type="button" className="button button-quiet" onClick={() => setReportOpen(false)}>Отмена</button><button type="button" className="button button-secondary" onClick={sendReport} disabled={pending || reason.trim().length < 5}>{pending ? 'Отправка…' : 'Отправить жалобу'}</button></div>
          </div>
        ) : <button type="button" className="button button-quiet" onClick={() => setReportOpen(true)} aria-label="Пожаловаться на отзыв"><Flag size={13} /> Пожаловаться</button>}
      </div>
      {message ? <p role="status" className="mt-2 text-right text-[10px] text-[var(--muted)]">{message}</p> : null}
    </article>
  );
}
