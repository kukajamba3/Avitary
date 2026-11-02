import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { AnimeGrid } from '@/components/anime-grid';
import { getCatalog, getGenres } from '@/lib/data';

export const metadata: Metadata = { title: 'Каталог аниме' };

type SearchParams = { [key: string]: string | string[] | undefined };
export const revalidate = 300;

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

function pageUrl(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const key of ['q', 'genre', 'year', 'type', 'age', 'status', 'sort']) {
    const value = first(params[key]);
    if (value) query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `/catalog?${search}` : '/catalog';
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = first(params.q) ?? '';
  const genre = first(params.genre) ?? '';
  const year = Number(first(params.year) || '') || undefined;
  const type = first(params.type) ?? '';
  const ageRating = first(params.age) ?? '';
  const status = first(params.status) ?? '';
  const requestedSort = first(params.sort) ?? 'popular';
  const sort = ['popular', 'added', 'alphabetical', 'rating'].includes(requestedSort) ? requestedSort : 'popular';
  const requestedPage = Number(first(params.page) || 1);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
  const pageSize = 20;
  const [catalog, genres] = await Promise.all([
    getCatalog({ query, genre, year, type, ageRating, status, sort, limit: pageSize, offset: (page - 1) * pageSize }),
    getGenres(),
  ]);
  const pageCount = Math.max(1, Math.ceil(catalog.total / pageSize));

  return (
    <div className="container page-shell">
      <div className="catalog-heading">
        <div><span className="eyebrow">Собирай своё</span><h1>{query ? 'Результаты поиска' : 'Каталог аниме'}</h1><p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>{query ? `По запросу «${query}»` : 'Выбирай историю по настроению, жанру или году'}</p></div>
        <Link href="/register" className="button button-secondary"><SlidersHorizontal size={15} /> Личная подборка</Link>
      </div>

      <div className="catalog-layout">
        <aside className="surface filters-panel">
          <div className="filters-title"><span>Фильтры</span><SlidersHorizontal size={15} className="muted" /></div>
          <form action="/catalog" method="get">
            {sort !== 'popular' ? <input type="hidden" name="sort" value={sort} /> : null}
            <div className="filter-group"><label className="filter-label" htmlFor="q">Поиск</label><input className="form-control" id="q" name="q" type="search" placeholder="Название…" defaultValue={query} /></div>
            <div className="filter-group"><label className="filter-label" htmlFor="genre">Жанр</label><select className="form-control" id="genre" name="genre" defaultValue={genre}><option value="">Все жанры</option>{genres.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
            <div className="filter-group"><label className="filter-label" htmlFor="year">Год выхода</label><input className="form-control" id="year" name="year" type="number" min="1917" max={new Date().getFullYear() + 3} placeholder="Например, 2020" defaultValue={year ?? ''} /></div>
            <div className="filter-group"><label className="filter-label" htmlFor="type">Формат</label><select className="form-control" id="type" name="type" defaultValue={type}><option value="">Любой формат</option><option value="TV">ТВ-сериал</option><option value="ONA">ONA</option><option value="WEB">Веб-сериал</option><option value="OVA">OVA</option><option value="MOVIE">Фильм</option><option value="SPECIAL">Спецвыпуск</option></select></div>
            <div className="filter-group"><label className="filter-label" htmlFor="age">Возраст</label><select className="form-control" id="age" name="age" defaultValue={ageRating}><option value="">Любой возраст</option><option value="0+">0+</option><option value="6+">6+</option><option value="12+">12+</option><option value="16+">16+</option><option value="18+">18+</option></select></div>
            <div className="filter-group"><label className="filter-label" htmlFor="status">Статус выхода</label><select className="form-control" id="status" name="status" defaultValue={status}><option value="">Любой статус</option><option value="ongoing">Выходит</option><option value="completed">Завершён</option></select></div>
            <div className="filter-actions"><button className="button button-primary button-block" type="submit">Показать тайтлы</button><Link href="/catalog" className="button button-quiet button-block">Сбросить фильтры</Link></div>
          </form>
        </aside>

        <section className="catalog-results" aria-label="Результаты каталога">
          <div className="catalog-toolbar">
            <span className="result-count">Найдено <strong style={{ color: 'var(--text)' }}>{catalog.total.toLocaleString('ru-RU')}</strong> историй</span>
            <form action="/catalog" method="get" className="sort-control">
              {query ? <input type="hidden" name="q" value={query} /> : null}
              {genre ? <input type="hidden" name="genre" value={genre} /> : null}
              {year ? <input type="hidden" name="year" value={year} /> : null}
              {type ? <input type="hidden" name="type" value={type} /> : null}
              {ageRating ? <input type="hidden" name="age" value={ageRating} /> : null}
              {status ? <input type="hidden" name="status" value={status} /> : null}
              <label htmlFor="sort">Сортировка</label>
              <select className="form-control" name="sort" id="sort" defaultValue={sort}>
                <option value="popular">По популярности</option><option value="added">Сначала новые</option><option value="alphabetical">По алфавиту</option><option value="rating">По рейтингу</option>
              </select>
              <button type="submit" className="button button-secondary" style={{ minHeight: 42, padding: '0 12px' }}>Ок</button>
            </form>
          </div>
          {catalog.items.length ? <AnimeGrid items={catalog.items} className="catalog-grid" /> : (
            <div className="empty-state"><div><span className="empty-icon"><SlidersHorizontal size={20} /></span><strong style={{ display: 'block', color: 'var(--text)', marginBottom: 6 }}>Ничего не нашлось</strong><span>Попробуй изменить запрос или убрать часть фильтров.</span></div></div>
          )}
          {pageCount > 1 ? (
            <nav className="pagination" aria-label="Страницы каталога">
              {page > 1 ? <Link className="page-number" href={pageUrl(params, page - 1)} aria-label="Предыдущая страница"><ArrowLeft size={15} /></Link> : null}
              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
                const pageNumber = Math.max(1, Math.min(pageCount - 4, page - 2)) + index;
                return <Link key={pageNumber} className={`page-number ${pageNumber === page ? 'active' : ''}`} href={pageUrl(params, pageNumber)}>{pageNumber}</Link>;
              })}
              {page < pageCount ? <Link className="page-number" href={pageUrl(params, page + 1)} aria-label="Следующая страница"><ArrowRight size={15} /></Link> : null}
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  );
}
