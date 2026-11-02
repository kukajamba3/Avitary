import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type ApiRecord = Record<string, unknown>;

function asRecord(input: unknown): ApiRecord {
  return input && typeof input === 'object' && !Array.isArray(input) ? input as ApiRecord : {};
}

const apiBase = (process.env.ANILIBERTY_API_BASE || 'https://api.anilibria.app/api/v1').replace(/\/$/, '');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pageSize = Math.min(Math.max(Number(process.env.SYNC_PAGE_SIZE || 50), 1), 100);
const concurrency = Math.min(Math.max(Number(process.env.SYNC_CONCURRENCY || 4), 1), 8);
const maxPages = Number(process.env.SYNC_MAX_PAGES || 0);
const includeEpisodes = process.env.SYNC_INCLUDE_EPISODES !== 'false';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Нужны SUPABASE_URL (или NEXT_PUBLIC_SUPABASE_URL) и SUPABASE_SERVICE_ROLE_KEY. Не передавайте service role key в браузер.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function value(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function imageUrl(input: unknown): string | null {
  if (typeof input === 'string') return normalizeUrl(input);
  if (!input || typeof input !== 'object') return null;
  const item = asRecord(input);
  const optimized = asRecord(item.optimized);
  const candidates = [optimized.src, optimized.url, item.src, item.url, item.preview, item.original, item.path];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return normalizeUrl(candidate);
  }
  return null;
}

function normalizeUrl(url: string): string {
  if (url.startsWith('//')) return `https:${url}`;
  try {
    return new URL(url).toString();
  } catch {
    return new URL(url, apiBase).toString();
  }
}

function storageObjectPath(publicUrl: string | null, bucket: string): string | null {
  if (!publicUrl) return null;
  try {
    const path = new URL(publicUrl).pathname;
    const prefix = `/storage/v1/object/public/${bucket}/`;
    return path.startsWith(prefix) ? decodeURIComponent(path.slice(prefix.length)) : null;
  } catch {
    return null;
  }
}

async function storeArtwork(
  sourceUrl: string | null,
  storageKey: string,
  kind: 'poster' | 'banner',
  previousSource: string | null,
  previousUrl: string | null,
): Promise<{ source: string | null; url: string | null }> {
  const isProjectStorageUrl = Boolean(previousUrl?.includes(`/storage/v1/object/public/anime-media/${storageKey}/`));
  if (!sourceUrl) return { source: isProjectStorageUrl ? previousSource : null, url: isProjectStorageUrl ? previousUrl : null };
  if (sourceUrl === previousSource && isProjectStorageUrl) return { source: sourceUrl, url: previousUrl };

  try {
    const response = await fetch(sourceUrl, { headers: { accept: 'image/avif,image/webp,image/png,image/jpeg' }, signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    let contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (contentType === 'image/jpg') contentType = 'image/jpeg';
    const extensionByType: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' };
    const extension = extensionByType[contentType];
    if (!extension) throw new Error(`Неподдерживаемый формат изображения: ${contentType || 'неизвестно'}`);
    const declaredSize = Number(response.headers.get('content-length') || 0);
    if (declaredSize > 10 * 1024 * 1024) throw new Error('Изображение превышает 10 МБ');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error('Пустое изображение или размер больше 10 МБ');
    const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const path = `${storageKey}/${kind}-${digest}.${extension}`;
    const bucket = supabase.storage.from('anime-media');
    const { error } = await bucket.upload(path, bytes, { contentType, upsert: true, cacheControl: '604800' });
    if (error) throw new Error(error.message);
    const { data } = bucket.getPublicUrl(path);
    const oldPath = storageObjectPath(previousUrl, 'anime-media');
    if (oldPath && oldPath !== path) {
      const { error: removeError } = await bucket.remove([oldPath]);
      if (removeError) console.warn(`  Арт ${storageKey}/${kind}: старый файл не удалён: ${removeError.message}`);
    }
    return { source: sourceUrl, url: data.publicUrl };
  } catch (error) {
    console.warn(`  Арт ${storageKey}/${kind}: ${error instanceof Error ? error.message : 'ошибка'}; оставляем предыдущую ссылку`);
    const sourceToKeep = isProjectStorageUrl && previousSource ? previousSource : sourceUrl;
    return { source: sourceToKeep, url: isProjectStorageUrl ? previousUrl : null };
  }
}

function toAgeRating(input: unknown): string | null {
  const item = asRecord(input);
  const candidate = value(item.label) || value(item.value) || value(input);
  const mapping: Record<string, string> = {
    R0_PLUS: '0+', R6_PLUS: '6+', R12_PLUS: '12+', R16_PLUS: '16+', R18_PLUS: '18+',
  };
  return mapping[candidate] ?? (candidate || null);
}

function slugFor(release: ApiRecord, title: string, id: number) {
  const source = value(release.alias) || title;
  const readable = source.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 68);
  return `${readable || 'anime'}-${id}`;
}

function normalizeRelease(release: ApiRecord) {
  const id = Number(release.id ?? release.release_id);
  if (!Number.isFinite(id)) return null;
  const name = asRecord(release.name);
  const title = value(name.main ?? release.title_ru ?? release.title ?? release.name_ru ?? release.name);
  const original = value(name.english ?? name.original ?? release.title_original ?? release.name_english) || null;
  if (!title) return null;
  const genres = Array.isArray(release.genres)
    ? release.genres.map((genre) => value(asRecord(genre).name ?? genre)).filter(Boolean)
    : [];
  const episodes = Array.isArray(release.episodes) ? release.episodes : [];
  const episodeCount = Number(release.episodes_total ?? release.episodes_count ?? episodes.length);
  const type = value(asRecord(release.type).value ?? release.type) || null;
  const publishStatus = value(asRecord(release.publish_status).value ?? release.publish_status);
  const releaseStatus = release.is_ongoing === true || publishStatus === 'IS_ONGOING'
    ? 'ongoing'
    : episodeCount === 0 && Boolean(release.is_in_production)
      ? 'upcoming'
      : 'completed';
  const coverList = Array.isArray(release.background_covers) ? release.background_covers : [];
  const banner = imageUrl(release.banner ?? release.background ?? coverList[0]);
  const poster = imageUrl(release.poster ?? release.cover ?? release.image);
  const releaseDate = value(release.updated_at ?? release.fresh_at ?? release.created_at);

  return {
    external_id: id,
    slug: slugFor(release, title, id),
    title_ru: title.slice(0, 300),
    title_original: original?.slice(0, 300) ?? null,
    description: value(release.description) || null,
    poster_source_url: poster,
    banner_source_url: banner,
    year: release.year != null && release.year !== '' && Number.isFinite(Number(release.year)) && Number(release.year) >= 1900 && Number(release.year) <= 2200 ? Math.trunc(Number(release.year)) : null,
    type,
    age_rating: toAgeRating(release.age_rating),
    release_status: releaseStatus,
    genres: [...new Set(genres)],
    episodes_count: Number.isFinite(episodeCount) && episodeCount > 0 ? Math.round(episodeCount) : null,
    external_updated_at: releaseDate || null,
    is_published: true,
  };
}

function unwrapRelease(payload: unknown): ApiRecord {
  let result: unknown = asRecord(payload).data ?? payload;
  if (Array.isArray(result)) result = result[0] ?? {};
  const item = asRecord(result);
  return item.release && typeof item.release === 'object' && !item.id ? asRecord(item.release) : item;
}

function releaseList(payload: unknown): ApiRecord[] {
  const item = asRecord(payload);
  const candidates = [payload, item.data, asRecord(item.data).data, item.items];
  const list = candidates.find(Array.isArray);
  return Array.isArray(list) ? list.map(asRecord) : [];
}

async function requestJson(url: string, init?: RequestInit, attempts = 4): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'AvitaryCatalogSync/1.0', ...init?.headers },
        signal: AbortSignal.timeout(35_000),
      });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after') || 0);
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 800 * (attempt + 1))));
        throw new Error(`AniLiberty API вернул ${response.status}`);
      }
      if (!response.ok) throw new Error(`AniLiberty API вернул ${response.status}: ${(await response.text()).slice(0, 300)}`);
      return await response.json() as unknown;
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Не удалось получить ответ API.');
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

async function fetchReleaseDetails(release: ApiRecord): Promise<ApiRecord> {
  if (Array.isArray(release.episodes)) return release;
  const id = release.id ?? release.alias;
  const url = new URL(`${apiBase}/anime/releases/${encodeURIComponent(String(id))}`);
  url.searchParams.set('include', 'episodes,genres');
  return unwrapRelease(await requestJson(url.toString()));
}

async function upsertPage(releases: ApiRecord[]) {
  const normalized = releases.map(normalizeRelease).filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (!normalized.length) return { animeCount: 0, episodeCount: 0 };

  const externalIds = normalized.map((anime) => anime.external_id);
  const { data: existingAnime, error: existingError } = await supabase
    .from('anime')
    .select('id,external_id,poster_source_url,poster_url,banner_source_url,banner_url')
    .in('external_id', externalIds);
  if (existingError) throw new Error(`Supabase existing media lookup: ${existingError.message}`);
  const existingByExternalId = new Map<number, ApiRecord>((existingAnime ?? []).map((row) => [Number(row.external_id), row as ApiRecord]));
  const withProjectArtwork = await mapLimit(normalized, concurrency, async (anime) => {
    const previous = existingByExternalId.get(anime.external_id);
    const storageKey = typeof previous?.id === 'string' ? previous.id : randomUUID();
    const [poster, banner] = await Promise.all([
      storeArtwork(anime.poster_source_url, storageKey, 'poster', typeof previous?.poster_source_url === 'string' ? previous.poster_source_url : null, typeof previous?.poster_url === 'string' ? previous.poster_url : null),
      storeArtwork(anime.banner_source_url, storageKey, 'banner', typeof previous?.banner_source_url === 'string' ? previous.banner_source_url : null, typeof previous?.banner_url === 'string' ? previous.banner_url : null),
    ]);
    return { id: storageKey, ...anime, poster_source_url: poster.source, poster_url: poster.url, banner_source_url: banner.source, banner_url: banner.url };
  });

  const { data: savedAnime, error: animeError } = await supabase
    .from('anime')
    .upsert(withProjectArtwork, { onConflict: 'external_id' })
    .select('id,external_id');
  if (animeError) throw new Error(`Supabase anime upsert: ${animeError.message}`);
  const animeRows = (savedAnime ?? []) as Array<{ id: string; external_id: number }>;
  const idByExternalId = new Map(animeRows.map((row) => [Number(row.external_id), row.id]));

  const genreNames = [...new Set(normalized.flatMap((anime) => anime.genres))];
  const genreIdByName = new Map<string, string>();
  if (genreNames.length) {
    const genreRows = genreNames.map((name) => ({
      name,
      slug: name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80) || `genre-${Buffer.from(name).toString('hex').slice(0, 12)}`,
    }));
    const { data: savedGenres, error: genreError } = await supabase.from('genres').upsert(genreRows, { onConflict: 'slug' }).select('id,name');
    if (genreError) throw new Error(`Supabase genres upsert: ${genreError.message}`);
    for (const row of savedGenres ?? []) genreIdByName.set(row.name, row.id);
  }
  const animeIds = [...idByExternalId.values()];
  if (animeIds.length) {
    const { error: deleteLinksError } = await supabase.from('anime_genres').delete().in('anime_id', animeIds);
    if (deleteLinksError) throw new Error(`Supabase genre links cleanup: ${deleteLinksError.message}`);
    const links = normalized.flatMap((anime) => {
      const animeId = idByExternalId.get(anime.external_id);
      return animeId ? anime.genres.flatMap((name) => {
        const genreId = genreIdByName.get(name);
        return genreId ? [{ anime_id: animeId, genre_id: genreId }] : [];
      }) : [];
    });
    if (links.length) {
      const { error: linkError } = await supabase.from('anime_genres').upsert(links, { onConflict: 'anime_id,genre_id' });
      if (linkError) throw new Error(`Supabase genre links upsert: ${linkError.message}`);
    }
  }

  let episodeCount = 0;
  if (includeEpisodes) {
    const details = await mapLimit(releases, concurrency, async (release) => {
      const localId = Number(release.id ?? release.release_id);
      if (Array.isArray(release.episodes)) return { release, localId };
      try {
        const detail = await fetchReleaseDetails(release);
        return { release: detail, localId };
      } catch (error) {
        console.warn(`  Эпизоды ${localId}: ${error instanceof Error ? error.message : 'ошибка'}`);
        return { release, localId };
      }
    });

    const episodeRows: ApiRecord[] = [];
    for (const detail of details) {
      const animeId = idByExternalId.get(detail.localId);
      const episodes = Array.isArray(detail.release.episodes) ? detail.release.episodes.map(asRecord) : [];
      if (!animeId || !episodes.length) continue;
      for (const episode of episodes) {
        const number = Number(episode.ordinal ?? episode.sort_order);
        if (!Number.isFinite(number)) continue;
        const stream = episode.hls_1080 || episode.hls_720 || episode.hls_480 || episode.hls_url || null;
        episodeRows.push({
          external_id: value(episode.id) || `${detail.localId}:${number}`,
          anime_id: animeId,
          episode_number: number,
          title: value(episode.name) || value(episode.name_english) || null,
          hls_url: typeof stream === 'string' && stream.trim() ? normalizeUrl(stream.trim()) : null,
          preview_url: imageUrl(episode.preview),
          duration_seconds: Number.isFinite(Number(episode.duration)) && Number(episode.duration) > 0 ? Math.round(Number(episode.duration)) : null,
        });
      }
    }
    for (let offset = 0; offset < episodeRows.length; offset += 250) {
      const batch = episodeRows.slice(offset, offset + 250);
      const { error: episodeError } = await supabase.from('episodes').upsert(batch, { onConflict: 'external_id' });
      if (episodeError) throw new Error(`Supabase episodes upsert: ${episodeError.message}`);
      episodeCount += batch.length;
    }
  }

  return { animeCount: normalized.length, episodeCount };
}

async function main() {
  console.log(`Avitary catalog sync → ${apiBase}`);
  console.log(`Размер страницы: ${pageSize}; параллельность: ${concurrency}; изображения хранятся в project Storage; обновление эпизодов: ${includeEpisodes ? 'да' : 'нет'}`);
  let page = 1;
  let totalAnime = 0;
  let totalEpisodes = 0;
  while (!maxPages || page <= maxPages) {
    const payload = await requestJson(`${apiBase}/anime/catalog/releases`, {
      method: 'POST',
      body: JSON.stringify({ page, limit: pageSize, f: { sorting: 'FRESH_AT_DESC' } }),
    });
    const releases = releaseList(payload);
    if (!releases.length) break;

    const result = await upsertPage(releases);
    totalAnime += result.animeCount;
    totalEpisodes += result.episodeCount;
    console.log(`Страница ${page}: ${result.animeCount} тайтлов, ${result.episodeCount} эпизодов (всего ${totalAnime})`);
    const responseRecord = asRecord(payload);
    const meta = asRecord(responseRecord.meta ?? asRecord(responseRecord.data).meta);
    const lastPage = Number(meta.last_page ?? meta.lastPage ?? meta.total_pages ?? 0);
    if (Number.isFinite(lastPage) && lastPage > 0 && page >= lastPage) break;
    page += 1;
    if (page > 10_000) throw new Error('Похоже, API не завершает пагинацию: достигнут защитный предел в 10 000 страниц.');
  }
  console.log(`Готово. Добавлено/обновлено: ${totalAnime} тайтлов, ${totalEpisodes} эпизодов.`);
}

main().catch((error) => {
  console.error('Синхронизация завершилась с ошибкой:', error);
  process.exitCode = 1;
});
