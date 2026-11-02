import type { Anime, CatalogFilters, CatalogResult, Episode } from '@/lib/types';

const now = '2026-10-12T10:00:00.000Z';

export const demoAnime: Anime[] = [
  {
    id: 'demo-01', external_id: null, slug: 'sada-za-oblakami', title_ru: 'Сад за облаками', title_original: 'Kumo no Niwa',
    description: 'В городе, где облака спускаются к самым крышам, тихая Хана выращивает сад на заброшенной станции. Однажды в нём расцветает цветок, который помнит чужие сны.',
    poster_url: '/posters/moonlit-garden.svg', banner_url: '/posters/hero-evening.svg', year: 2025, type: 'TV', age_rating: '12+', release_status: 'completed', genres: ['Повседневность', 'Фэнтези', 'Драма'], episodes_count: 12, average_rating: 9.4, ratings_count: 1824, popularity_count: 4620, views_count: 18302, created_at: now,
  },
  {
    id: 'demo-02', external_id: null, slug: 'pisma-okeanu', title_ru: 'Письма океану', title_original: 'Umi e no Tegami',
    description: 'После переезда в приморский город Рин находит в библиотечной книге письма, адресованные морю. Каждое письмо рассказывает о лете, которое ещё не закончилось.',
    poster_url: '/posters/ocean-in-letters.svg', banner_url: null, year: 2024, type: 'MOVIE', age_rating: '6+', release_status: 'completed', genres: ['Романтика', 'Драма', 'Повседневность'], episodes_count: 1, average_rating: 9.1, ratings_count: 965, popularity_count: 2808, views_count: 11240, created_at: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 'demo-03', external_id: null, slug: 'zvezdnyj-arhiv', title_ru: 'Звёздный архив', title_original: 'Hoshi no Toshokan',
    description: 'В будущем созвездия хранят истории исчезнувших цивилизаций. Архивариус Юна отправляется на далёкую орбиту, чтобы восстановить последнюю из них.',
    poster_url: '/posters/star-archive.svg', banner_url: null, year: 2026, type: 'TV', age_rating: '16+', release_status: 'ongoing', genres: ['Фантастика', 'Приключения', 'Драма'], episodes_count: 13, average_rating: 8.9, ratings_count: 734, popularity_count: 2390, views_count: 9964, created_at: '2026-10-08T10:00:00.000Z',
  },
  {
    id: 'demo-04', external_id: null, slug: 'mezhdu-stranicami', title_ru: 'Между страницами', title_original: 'Hon no Aida',
    description: 'Случайная встреча в букинистической лавке связывает двух школьников общей тетрадью. Они начинают писать историю, не зная, что уже стали её героями.',
    poster_url: '/posters/paper-crane.svg', banner_url: null, year: 2023, type: 'TV', age_rating: '12+', release_status: 'completed', genres: ['Романтика', 'Школа', 'Комедия'], episodes_count: 12, average_rating: 8.8, ratings_count: 1230, popularity_count: 3054, views_count: 15318, created_at: '2026-10-04T10:00:00.000Z',
  },
  {
    id: 'demo-05', external_id: null, slug: 'polnoch-na-stancii', title_ru: 'Полночь на станции', title_original: 'Eki no Mayonaka',
    description: 'Последний поезд останавливается только для тех, кому нужно услышать ответ. Проводница Сэй каждый вечер встречает пассажиров, у которых есть один вопрос.',
    poster_url: '/posters/winter-signal.svg', banner_url: null, year: 2022, type: 'OVA', age_rating: '16+', release_status: 'completed', genres: ['Мистика', 'Драма', 'Сверхъестественное'], episodes_count: 6, average_rating: 9.2, ratings_count: 602, popularity_count: 1780, views_count: 7826, created_at: '2026-09-28T10:00:00.000Z',
  },
  {
    id: 'demo-06', external_id: null, slug: 'poslednij-letnij-dozhd', title_ru: 'Последний летний дождь', title_original: 'Saigo no Natsuame',
    description: 'Маленькая мастерская зонтов досталась Аки от дедушки. В сезон дождей к ней приходят соседи — и каждый приносит с собой маленькую историю.',
    poster_url: '/posters/summer-after-rain.svg', banner_url: null, year: 2021, type: 'TV', age_rating: '6+', release_status: 'completed', genres: ['Повседневность', 'Драма', 'Семейный'], episodes_count: 11, average_rating: 8.7, ratings_count: 488, popularity_count: 1512, views_count: 6920, created_at: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'demo-07', external_id: null, slug: 'kometa-v-karmane', title_ru: 'Комета в кармане', title_original: 'Pocket Comet',
    description: 'Девочка Мио умеет находить упавшие звёзды. Вместе с новым соседом она возвращает их на небо — и постепенно понимает, что дом иногда находится совсем рядом.',
    poster_url: '/posters/little-comet.svg', banner_url: null, year: 2025, type: 'ONA', age_rating: '6+', release_status: 'ongoing', genres: ['Приключения', 'Фэнтези', 'Комедия'], episodes_count: 8, average_rating: 9.0, ratings_count: 561, popularity_count: 1930, views_count: 9087, created_at: '2026-09-16T10:00:00.000Z',
  },
  {
    id: 'demo-08', external_id: null, slug: 'fioletovyj-chas', title_ru: 'Фиолетовый час', title_original: 'Sumire no Jikan',
    description: 'Когда часы на старой башне показывают 17:17, город на минуту становится другим. У Мадоки есть всего несколько секунд, чтобы найти дорогу домой.',
    poster_url: '/posters/violet-hour.svg', banner_url: null, year: 2020, type: 'MOVIE', age_rating: '12+', release_status: 'completed', genres: ['Фэнтези', 'Мистика', 'Приключения'], episodes_count: 1, average_rating: 8.6, ratings_count: 396, popularity_count: 1124, views_count: 5340, created_at: '2026-09-09T10:00:00.000Z',
  },
  {
    id: 'demo-09', external_id: null, slug: 'komnata-svetlyh-veshhej', title_ru: 'Комната светлых вещей', title_original: 'Akari no Heya',
    description: 'В старом доме на окраине Токио хранится комната потерянных вещей. Каждая из них ищет своего человека — если тот готов вспомнить.',
    poster_url: '/posters/quiet-room.svg', banner_url: null, year: 2019, type: 'TV', age_rating: '12+', release_status: 'completed', genres: ['Драма', 'Повседневность', 'Мистика'], episodes_count: 10, average_rating: 8.5, ratings_count: 324, popularity_count: 960, views_count: 4338, created_at: '2026-09-02T10:00:00.000Z',
  },
  {
    id: 'demo-10', external_id: null, slug: 'more-vnutri', title_ru: 'Море внутри нас', title_original: 'Watashitachi no Umi',
    description: 'Два друга из маленького островного города строят лодку, чтобы увидеть место, откуда каждую ночь приходит северное сияние.',
    poster_url: '/posters/blue-hour.svg', banner_url: null, year: 2018, type: 'TV', age_rating: '12+', release_status: 'completed', genres: ['Приключения', 'Драма', 'Романтика'], episodes_count: 13, average_rating: 8.4, ratings_count: 271, popularity_count: 806, views_count: 3880, created_at: '2026-08-25T10:00:00.000Z',
  },
];

export const demoGenres = Array.from(new Set(demoAnime.flatMap((anime) => anime.genres))).sort((a, b) => a.localeCompare(b, 'ru'));

export function getDemoCatalog(filters: CatalogFilters = {}): CatalogResult {
  const query = filters.query?.trim().toLocaleLowerCase('ru-RU');
  let items = demoAnime.filter((anime) => {
    if (query && !`${anime.title_ru} ${anime.title_original ?? ''}`.toLocaleLowerCase('ru-RU').includes(query)) return false;
    if (filters.genre && !anime.genres.includes(filters.genre)) return false;
    if (filters.year && anime.year !== filters.year) return false;
    if (filters.type && anime.type !== filters.type) return false;
    if (filters.ageRating && anime.age_rating !== filters.ageRating) return false;
    if (filters.status && anime.release_status !== filters.status) return false;
    return true;
  });

  switch (filters.sort) {
    case 'added': items = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
    case 'alphabetical': items = [...items].sort((a, b) => a.title_ru.localeCompare(b.title_ru, 'ru')); break;
    case 'rating': items = [...items].sort((a, b) => b.average_rating - a.average_rating); break;
    default: items = [...items].sort((a, b) => b.popularity_count - a.popularity_count);
  }

  const total = items.length;
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 24;
  return { items: items.slice(offset, offset + limit), total };
}

export function getDemoAnime(slug: string) {
  return demoAnime.find((anime) => anime.slug === slug) ?? null;
}

export function getDemoEpisodes(anime: Anime): Episode[] {
  if (!anime.episodes_count) return [];
  return Array.from({ length: Math.min(anime.episodes_count, 6) }, (_, index) => ({
    id: `${anime.id}-episode-${index + 1}`,
    anime_id: anime.id,
    episode_number: index + 1,
    title: index === 0 ? 'Начало истории' : `Эпизод ${index + 1}`,
    hls_url: null,
    preview_url: null,
    duration_seconds: 1440,
  }));
}
