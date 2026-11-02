export type AnimeType = 'TV' | 'ONA' | 'WEB' | 'OVA' | 'MOVIE' | 'SPECIAL' | string;
export type ReleaseStatus = 'ongoing' | 'completed' | 'upcoming' | string;
export type AnimeStatus = 'watching' | 'planned' | 'completed' | 'dropped';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Anime {
  id: string;
  external_id: number | null;
  slug: string;
  title_ru: string;
  title_original: string | null;
  description: string | null;
  poster_url: string | null;
  banner_url: string | null;
  year: number | null;
  type: AnimeType | null;
  age_rating: string | null;
  release_status: ReleaseStatus;
  genres: string[];
  episodes_count: number | null;
  average_rating: number;
  ratings_count: number;
  popularity_count: number;
  views_count: number;
  created_at: string;
  total_count?: number;
}

export interface Episode {
  id: string;
  anime_id: string;
  episode_number: number;
  title: string | null;
  hls_url: string | null;
  preview_url?: string | null;
  duration_seconds: number | null;
}

export interface PublicProfile {
  id: string;
  username: string;
  nickname: string;
  is_public: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
}

export interface ProfileStats {
  completed: number;
  planned: number;
  dropped: number;
  watching: number;
  total: number;
}

export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  created_at: string;
  anime?: Pick<Anime, 'slug' | 'title_ru' | 'poster_url' | 'year'> | null;
  profile?: Pick<PublicProfile, 'username' | 'nickname' | 'avatar_url'> | null;
}

export interface CatalogFilters {
  query?: string;
  genre?: string;
  year?: number;
  type?: string;
  ageRating?: string;
  status?: string;
  sort?: 'popular' | 'added' | 'alphabetical' | 'rating' | string;
  limit?: number;
  offset?: number;
}

export interface CatalogResult {
  items: Anime[];
  total: number;
}

export interface LibraryItem {
  status: AnimeStatus;
  updated_at: string;
  anime: Anime;
}
