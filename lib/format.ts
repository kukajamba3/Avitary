import type { AnimeType, Episode, ReleaseStatus } from '@/lib/types';

export function formatType(type?: AnimeType | null) {
  const labels: Record<string, string> = {
    TV: 'ТВ-сериал',
    ONA: 'ONA',
    WEB: 'Веб-сериал',
    OVA: 'OVA',
    OAD: 'OAD',
    MOVIE: 'Фильм',
    SPECIAL: 'Спецвыпуск',
    DORAMA: 'Дорама',
  };
  return type ? labels[type] ?? type : 'Аниме';
}

export function formatReleaseStatus(status?: ReleaseStatus | null) {
  if (status === 'ongoing') return 'Выходит';
  if (status === 'upcoming') return 'Скоро';
  return 'Завершён';
}

export function formatCount(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  return `${minutes} мин`;
}

export function formatEpisodeNumber(episode: Episode) {
  return Number.isInteger(episode.episode_number)
    ? String(episode.episode_number).padStart(2, '0')
    : String(episode.episode_number);
}

export function safeNextPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/';
  return path;
}
