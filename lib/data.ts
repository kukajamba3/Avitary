import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import { demoGenres, getDemoAnime, getDemoCatalog, getDemoEpisodes } from '@/lib/demo';
import type { Anime, AnimeStatus, CatalogFilters, CatalogResult, Episode, LibraryItem, ProfileStats, PublicProfile, PublicReview } from '@/lib/types';

const ANIME_FIELDS = 'id,slug,title_ru,title_original,description,poster_url,banner_url,year,type,age_rating,release_status,genres,episodes_count,average_rating,ratings_count,popularity_count,views_count,created_at';

function cleanAnime(row: Partial<Anime> & Record<string, unknown>): Anime {
  return {
    id: String(row.id ?? ''),
    external_id: row.external_id == null ? null : Number(row.external_id),
    slug: String(row.slug ?? ''),
    title_ru: String(row.title_ru ?? 'Без названия'),
    title_original: row.title_original ? String(row.title_original) : null,
    description: row.description ? String(row.description) : null,
    poster_url: row.poster_url ? String(row.poster_url) : null,
    banner_url: row.banner_url ? String(row.banner_url) : null,
    year: row.year == null ? null : Number(row.year),
    type: row.type ? String(row.type) : null,
    age_rating: row.age_rating ? String(row.age_rating) : null,
    release_status: String(row.release_status ?? 'completed'),
    genres: Array.isArray(row.genres) ? row.genres.map(String) : [],
    episodes_count: row.episodes_count == null ? null : Number(row.episodes_count),
    average_rating: Number(row.average_rating ?? 0),
    ratings_count: Number(row.ratings_count ?? 0),
    popularity_count: Number(row.popularity_count ?? 0),
    views_count: Number(row.views_count ?? 0),
    created_at: String(row.created_at ?? new Date(0).toISOString()),
    total_count: row.total_count == null ? undefined : Number(row.total_count),
  };
}

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogResult> {
  const supabase = createPublicClient();
  if (!supabase) return getDemoCatalog(filters);

  const { data, error } = await supabase.rpc('search_anime', {
    p_query: filters.query?.trim() || null,
    p_genre: filters.genre || null,
    p_year: filters.year || null,
    p_type: filters.type || null,
    p_age_rating: filters.ageRating || null,
    p_status: filters.status || null,
    p_sort: filters.sort || 'popular',
    p_limit: Math.min(Math.max(filters.limit ?? 24, 1), 48),
    p_offset: Math.max(filters.offset ?? 0, 0),
  });

  if (error) {
    console.error('Catalog search failed:', error.message);
    return { items: [], total: 0 };
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return {
    items: rows.map((row) => cleanAnime(row as Partial<Anime> & Record<string, unknown>)),
    total: rows.length ? Number(rows[0].total_count ?? rows.length) : 0,
  };
}

export async function getAnimeBySlug(slug: string): Promise<Anime | null> {
  const supabase = createPublicClient();
  if (!supabase) return getDemoAnime(slug);
  const { data, error } = await supabase.from('anime_catalog').select(ANIME_FIELDS).eq('slug', slug).maybeSingle();
  if (error) {
    console.error('Anime lookup failed:', error.message);
    return null;
  }
  return data ? cleanAnime(data as Partial<Anime> & Record<string, unknown>) : null;
}

export async function getEpisodes(animeId: string, fallbackAnime?: Anime): Promise<Episode[]> {
  const supabase = createPublicClient();
  if (!supabase) return fallbackAnime ? getDemoEpisodes(fallbackAnime) : [];
  const { data, error } = await supabase
    .from('episodes')
    .select('id,anime_id,episode_number,title,hls_url,duration_seconds')
    .eq('anime_id', animeId)
    .order('episode_number', { ascending: true });
  if (error) {
    console.error('Episode lookup failed:', error.message);
    return [];
  }
  return (data ?? []).map((episode) => ({ ...episode, preview_url: null })) as Episode[];
}

export async function getGenres(): Promise<string[]> {
  const supabase = createPublicClient();
  if (!supabase) return demoGenres;
  const { data, error } = await supabase.from('genres').select('name').order('name');
  if (error) {
    console.error('Genre lookup failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => row.name as string);
}

export async function getCurrentProfile(): Promise<PublicProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,nickname,is_public,avatar_url,banner_url,created_at')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicProfile;
}

export async function getUserId() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getUserAnimeStatus(animeId: string): Promise<AnimeStatus | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_anime_status')
    .select('status')
    .eq('user_id', user.id)
    .eq('anime_id', animeId)
    .maybeSingle();
  return (data?.status as AnimeStatus | undefined) ?? null;
}

export async function getViewerRating(animeId: string): Promise<number | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('anime_ratings')
    .select('rating')
    .eq('user_id', user.id)
    .eq('anime_id', animeId)
    .maybeSingle();
  return data?.rating ?? null;
}

export async function getAnimeReviews(animeId: string): Promise<PublicReview[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('id,rating,text,created_at,profile:profiles!reviews_user_id_fkey(username,nickname,avatar_url)')
    .eq('anime_id', animeId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.error('Review lookup failed:', error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicReview[];
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,username,nickname,is_public,avatar_url,banner_url,created_at')
    .eq('username', username.toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicProfile;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = createPublicClient();
  if (!supabase) return { completed: 0, planned: 0, dropped: 0, watching: 0, total: 0 };
  const { data, error } = await supabase.rpc('public_profile_stats', { p_user_id: userId });
  if (error || !data?.length) return { completed: 0, planned: 0, dropped: 0, watching: 0, total: 0 };
  return data[0] as ProfileStats;
}

export async function getProfileReviews(userId: string): Promise<PublicReview[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('id,rating,text,created_at,anime:anime!reviews_anime_id_fkey(slug,title_ru,poster_url,year)')
    .eq('user_id', userId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) {
    console.error('Profile reviews lookup failed:', error.message);
    return [];
  }
  return (data ?? []) as unknown as PublicReview[];
}

export async function getLibrary(userId: string): Promise<LibraryItem[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('user_anime_status')
    .select('status,updated_at,anime:anime!user_anime_status_anime_id_fkey(id,slug,title_ru,title_original,description,poster_url,banner_url,year,type,age_rating,release_status,genres,episodes_count,views_count,created_at)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('Library lookup failed:', error.message);
    return [];
  }
  return (data ?? []).flatMap((row) => row.anime ? [{
    status: row.status as AnimeStatus,
    updated_at: row.updated_at as string,
    anime: cleanAnime(row.anime as Partial<Anime> & Record<string, unknown>),
  }] : []);
}
