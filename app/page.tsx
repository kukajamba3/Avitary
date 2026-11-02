import Link from 'next/link';
import { ArrowRight, BookmarkCheck, Compass, Heart, Sparkles, Star, UsersRound } from 'lucide-react';
import { AnimeGrid } from '@/components/anime-grid';
import { getCatalog } from '@/lib/data';

export const revalidate = 300;

export default async function HomePage() {
  const [popular, recent] = await Promise.all([
    getCatalog({ sort: 'popular', limit: 5 }),
    getCatalog({ sort: 'added', limit: 5 }),
  ]);
  const spotlight = popular.items[0];

  return (
    <div className="container page-shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles size={14} /> Твоё место среди историй</div>
          <h1>Смотри, <em>чувствуй</em>, сохраняй своё.</h1>
          <p>Найди историю под настроение, бережно собери свою коллекцию и оставь место для следующего открытия.</p>
          <div className="hero-buttons">
            <Link href="/catalog" className="button button-primary">Открыть каталог <ArrowRight size={15} /></Link>
            <Link href="/register" className="button button-secondary">Создать профиль</Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <img src="/posters/hero-evening.svg" alt="" fetchPriority="high" />
        </div>
        <div className="hero-orb float" aria-hidden="true" />
        {spotlight ? (
          <Link href={`/anime/${spotlight.slug}`} className="hero-float-card">
            <div className="hero-float-cover"><img src={spotlight.poster_url || '/posters/empty-poster.svg'} alt="" /></div>
            <div className="hero-float-meta"><span>{spotlight.title_ru}</span><span><Star size={11} fill="currentColor" /> {spotlight.average_rating.toFixed(1)}</span></div>
          </Link>
        ) : null}
      </section>

      <section className="feature-strip" aria-label="Возможности Avitary">
        <div className="feature-card"><span className="feature-icon"><Compass size={20} /></span><span><strong>Каталог под настроение</strong><span>Жанры, годы и фильтры — чтобы находить своё.</span></span></div>
        <div className="feature-card"><span className="feature-icon"><BookmarkCheck size={20} /></span><span><strong>Личная коллекция</strong><span>Сохраняй просмотренное и планы в одном месте.</span></span></div>
        <div className="feature-card"><span className="feature-icon"><UsersRound size={20} /></span><span><strong>Впечатления сообщества</strong><span>Оценки и отзывы помогают выбрать следующую историю.</span></span></div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">Выбор сообщества</span><h2>Истории, которые уже любят</h2><p>Самое популярное в каталоге Avitary</p></div>
          <Link href="/catalog?sort=popular" className="text-link">Весь каталог <ArrowRight size={14} /></Link>
        </div>
        <AnimeGrid items={popular.items} />
      </section>

      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">Только добавили</span><h2>Свежие открытия</h2><p>Новые истории уже ждут тебя</p></div>
          <Link href="/catalog?sort=added" className="text-link">Смотреть новинки <ArrowRight size={14} /></Link>
        </div>
        <AnimeGrid items={recent.items} />
      </section>

      <section className="section soft-panel" style={{ padding: '30px clamp(20px, 4vw, 44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22 }}>
        <div><span className="eyebrow">Твоя история — твои правила</span><h2 style={{ margin: '8px 0', fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-.045em' }}>Собери коллекцию, к которой захочется вернуться</h2><p className="muted" style={{ margin: 0, maxWidth: 560, fontSize: 12, lineHeight: 1.7 }}>Отмечай любимое, делись отзывами и следи за собственным аниме-путём.</p></div>
        <Link href="/register" className="button button-primary" style={{ flex: '0 0 auto' }}><Heart size={15} /> Начать свою коллекцию</Link>
      </section>
    </div>
  );
}
