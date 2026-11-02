'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatType } from '@/lib/format';
import type { Anime } from '@/lib/types';

const suggestionsCache = new Map<string, Anime[]>();

export function SearchBox({ className = '', placeholder = 'Название аниме…' }: { className?: string; placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const term = query.trim();
    setActive(-1);
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const key = term.toLocaleLowerCase('ru-RU');
    const cached = suggestionsCache.get(key);
    if (cached) {
      setSuggestions(cached);
      setOpen(true);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items as Anime[] : [];
        suggestionsCache.set(key, items);
        setSuggestions(items);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, []);

  function goToSearch() {
    const value = query.trim();
    if (!value) return;
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(value)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') setOpen(false);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((value) => Math.min(value + 1, suggestions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (active >= 0 && suggestions[active]) router.push(`/anime/${suggestions[active].slug}`);
      else goToSearch();
      setOpen(false);
    }
  }

  return (
    <div className={`search-wrap ${className}`} ref={wrapperRef}>
      <div className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => query.trim().length > 1 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Поиск в каталоге Avitary"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="catalog-suggestions"
        />
        {loading ? <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-violet border-t-transparent" /> : null}
        {query ? <button type="button" className="search-clear" onClick={() => { setQuery(''); setSuggestions([]); }} aria-label="Очистить поиск"><X size={14} /></button> : null}
      </div>
      {open && query.trim().length > 1 ? (
        <div className="search-popover" id="catalog-suggestions" role="listbox">
          <div className="search-popover-head">В нашем каталоге</div>
          {suggestions.length ? suggestions.map((anime, index) => (
            <Link
              href={`/anime/${anime.slug}`}
              className="search-result"
              key={anime.id}
              role="option"
              aria-selected={index === active}
              onClick={() => setOpen(false)}
            >
              <img src={anime.poster_url || '/posters/empty-poster.svg'} alt="" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="search-result-title">{anime.title_ru}</span>
                <span className="search-result-meta">{anime.year ?? 'Год неизвестен'} · {formatType(anime.type)}</span>
              </span>
            </Link>
          )) : (
            <div className="search-empty">{loading ? 'Ищем в каталоге…' : 'Пока ничего не найдено'}</div>
          )}
          <button type="button" className="search-all" onClick={goToSearch}>
            Показать результаты <ArrowRight size={13} className="inline ml-1" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
