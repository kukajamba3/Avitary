import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function ConfirmedPage() {
  return (
    <div className="container page-shell"><section className="surface mx-auto max-w-xl p-8 text-center sm:p-12"><span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-[var(--brand-wash)] text-[var(--brand)]"><CheckCircle2 size={31} /></span><span className="eyebrow mt-5 block">Всё готово</span><h1 className="mt-2 text-3xl font-extrabold tracking-[-.055em]">Почта подтверждена</h1><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--muted)]">Теперь вы можете войти, собрать свою коллекцию и делиться впечатлениями.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/library" className="button button-primary"><Sparkles size={15} /> Открыть коллекцию</Link><Link href="/catalog" className="button button-secondary">Перейти в каталог</Link></div></section></div>
  );
}
