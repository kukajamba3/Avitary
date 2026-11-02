import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { ResendConfirmation } from '@/components/auth-forms';

export const metadata: Metadata = { title: 'Подтверждение почты' };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ email?: string; status?: string }> }) {
  const params = await searchParams;
  return (
    <div className="container page-shell">
      <div className="mx-auto grid max-w-5xl items-center gap-5 md:grid-cols-[.8fr_1.2fr]">
        <div className="soft-panel hidden min-h-[340px] content-center p-9 md:grid"><span className="eyebrow">Ещё один маленький шаг</span><CheckCircle2 size={36} className="mt-5 text-[var(--brand)]" /><h1 className="mt-4 text-3xl font-extrabold tracking-[-.05em]">Почта — ключ к твоему профилю</h1><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Подтверждение помогает защитить коллекцию и восстановить доступ, если пароль потеряется.</p><Link href="/login" className="mt-6 text-xs font-bold text-[var(--brand)]">Уже подтвердили? Перейти ко входу</Link></div>
        <div className="grid gap-3">{params.status === 'invalid' ? <p role="alert" className="form-error">Ссылка недействительна или устарела. Запросите новое письмо и откройте ссылку из него.</p> : null}<ResendConfirmation initialEmail={params.email ?? ''} /></div>
      </div>
    </div>
  );
}
