-- Avitary: one project-owned catalogue and community data on Supabase.
create extension if not exists pg_trgm with schema public;

create type public.anime_status as enum ('watching', 'planned', 'completed', 'dropped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  nickname text not null check (char_length(nickname) between 2 and 40),
  is_public boolean not null default true,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Preferences are separate so theme and private settings are never exposed on public profiles.
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  updated_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  external_id bigint unique,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.anime (
  id uuid primary key default gen_random_uuid(),
  external_id bigint not null unique,
  slug text not null unique,
  title_ru text not null,
  title_original text,
  description text,
  poster_url text,
  banner_url text,
  poster_source_url text,
  banner_source_url text,
  year smallint check (year is null or year between 1900 and 2200),
  type text,
  age_rating text,
  release_status text not null default 'completed' check (release_status in ('ongoing', 'completed', 'upcoming')),
  genres text[] not null default '{}',
  episodes_count integer check (episodes_count is null or episodes_count >= 0),
  views_count bigint not null default 0 check (views_count >= 0),
  is_published boolean not null default true,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title_ru, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(title_original, '')), 'B')
  ) stored,
  external_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.anime_genres (
  anime_id uuid not null references public.anime(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (anime_id, genre_id)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  anime_id uuid not null references public.anime(id) on delete cascade,
  episode_number numeric(7,2) not null,
  title text,
  hls_url text,
  preview_url text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anime_id, episode_number)
);

create table public.user_anime_status (
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id uuid not null references public.anime(id) on delete cascade,
  status public.anime_status not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create table public.anime_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  anime_id uuid not null references public.anime(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, anime_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  anime_id uuid not null references public.anime(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  text text not null check (char_length(text) between 30 and 3000),
  is_visible boolean not null default false,
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anime_id)
);

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

create index anime_title_ru_trgm_idx on public.anime using gin (lower(title_ru) gin_trgm_ops);
create index anime_title_original_trgm_idx on public.anime using gin (lower(title_original) gin_trgm_ops);
create index anime_search_vector_idx on public.anime using gin (search_vector);
create index anime_year_idx on public.anime (year);
create index anime_type_idx on public.anime (type);
create index anime_status_idx on public.anime (release_status);
create index anime_created_at_idx on public.anime (created_at desc);
create index anime_genres_gin_idx on public.anime using gin (genres);
create index anime_genres_genre_id_idx on public.anime_genres (genre_id);
create index episodes_anime_id_number_idx on public.episodes (anime_id, episode_number);
create index user_anime_status_user_id_idx on public.user_anime_status (user_id, updated_at desc);
create index user_anime_status_anime_id_idx on public.user_anime_status (anime_id);
create index anime_ratings_anime_id_idx on public.anime_ratings (anime_id);
create index reviews_anime_id_visible_idx on public.reviews (anime_id, is_visible, created_at desc);
create index reviews_user_id_idx on public.reviews (user_id, created_at desc);
create index review_reports_created_at_idx on public.review_reports (created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();
create trigger anime_set_updated_at before update on public.anime
for each row execute function public.set_updated_at();
create trigger episodes_set_updated_at before update on public.episodes
for each row execute function public.set_updated_at();
create trigger status_set_updated_at before update on public.user_anime_status
for each row execute function public.set_updated_at();
create trigger ratings_set_updated_at before update on public.anime_ratings
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.keep_username_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.username is distinct from old.username then
    raise exception 'Логин нельзя изменить после регистрации';
  end if;
  return new;
end;
$$;
create trigger profiles_username_is_immutable before update on public.profiles
for each row execute function public.keep_username_immutable();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare
  requested_username text;
  safe_username text;
  requested_nickname text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, ''), '@', 1)));
  safe_username := trim(both '_' from regexp_replace(requested_username, '[^a-z0-9_]', '_', 'g'));
  if char_length(safe_username) < 3 then
    safe_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  safe_username := substr(safe_username, 1, 24);
  requested_nickname := btrim(coalesce(new.raw_user_meta_data ->> 'nickname', safe_username));
  if char_length(requested_nickname) < 2 then requested_nickname := safe_username; end if;

  begin
    insert into public.profiles (id, username, nickname)
    values (new.id, safe_username, substr(requested_nickname, 1, 40));
  exception when unique_violation then
    if new.raw_user_meta_data ? 'username' then
      raise exception 'Логин уже занят. Выберите другой.';
    end if;
    safe_username := substr(safe_username, 1, 15) || '_' || substr(replace(new.id::text, '-', ''), 1, 8);
    insert into public.profiles (id, username, nickname)
    values (new.id, safe_username, substr(requested_nickname, 1, 40));
  end;
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- A safe public view: user-level rows remain private; only per-title aggregates are exposed.
create or replace view public.anime_catalog as
select
  a.id, a.slug, a.title_ru, a.title_original, a.description,
  a.poster_url, a.banner_url, a.year, a.type, a.age_rating, a.release_status,
  a.genres, a.episodes_count, a.views_count, a.created_at, a.updated_at,
  coalesce(r.average_rating, 0)::numeric(3,1) as average_rating,
  coalesce(r.ratings_count, 0)::bigint as ratings_count,
  (a.views_count + coalesce(r.ratings_count, 0) + coalesce(s.list_count, 0))::bigint as popularity_count
from public.anime a
left join lateral (
  select round(avg(ar.rating)::numeric, 1) as average_rating, count(*) as ratings_count
  from public.anime_ratings ar where ar.anime_id = a.id
) r on true
left join lateral (
  select count(*) as list_count from public.user_anime_status uas where uas.anime_id = a.id
) s on true
where a.is_published;

create or replace function public.search_anime(
  p_query text default null,
  p_genre text default null,
  p_year integer default null,
  p_type text default null,
  p_age_rating text default null,
  p_status text default null,
  p_sort text default 'popular',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid, slug text, title_ru text, title_original text,
  description text, poster_url text, banner_url text, year smallint, type text,
  age_rating text, release_status text, genres text[], episodes_count integer,
  average_rating numeric, ratings_count bigint, popularity_count bigint,
  views_count bigint, created_at timestamptz, total_count bigint
)
language sql stable security definer set search_path = public as $$
  with filtered as (
    select c.*,
      count(*) over ()::bigint as result_count
    from public.anime_catalog c
    join public.anime a on a.id = c.id
    where
      (nullif(btrim(p_query), '') is null
        or a.search_vector @@ websearch_to_tsquery('simple', btrim(p_query))
        or lower(a.title_ru) ilike '%' || lower(btrim(p_query)) || '%'
        or lower(coalesce(a.title_original, '')) ilike '%' || lower(btrim(p_query)) || '%')
      and (nullif(p_genre, '') is null or p_genre = any(c.genres))
      and (p_year is null or c.year = p_year)
      and (nullif(p_type, '') is null or c.type = p_type)
      and (nullif(p_age_rating, '') is null or c.age_rating = p_age_rating)
      and (nullif(p_status, '') is null or c.release_status = p_status)
  )
  select
    f.id, f.slug, f.title_ru, f.title_original, f.description,
    f.poster_url, f.banner_url, f.year, f.type, f.age_rating, f.release_status,
    f.genres, f.episodes_count, f.average_rating, f.ratings_count,
    f.popularity_count, f.views_count, f.created_at, f.result_count
  from filtered f
  order by
    case when coalesce(p_sort, 'popular') = 'popular' then f.popularity_count end desc,
    case when p_sort = 'added' then f.created_at end desc,
    case when p_sort = 'alphabetical' then f.title_ru end asc,
    case when p_sort = 'rating' then f.average_rating end desc,
    f.title_ru asc
  limit least(greatest(coalesce(p_limit, 24), 1), 48)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.public_profile_stats(p_user_id uuid)
returns table (completed bigint, planned bigint, dropped bigint, watching bigint, total bigint)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where status = 'completed')::bigint,
    count(*) filter (where status = 'planned')::bigint,
    count(*) filter (where status = 'dropped')::bigint,
    count(*) filter (where status = 'watching')::bigint,
    count(*)::bigint
  from public.user_anime_status uas
  where uas.user_id = p_user_id
    and exists (select 1 from public.profiles p where p.id = p_user_id and (p.is_public or p.id = auth.uid()));
$$;

create or replace function public.record_anime_view(p_anime_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.anime set views_count = views_count + 1
  where id = p_anime_id and is_published;
$$;

-- Every member edit returns to the moderation queue; only an admin can publish via the RPC below.
create or replace function public.reset_review_moderation_on_edit()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() = new.user_id then
    if tg_op = 'INSERT' then
      new.is_visible := false;
      new.moderation_note := null;
    elsif new.rating is distinct from old.rating or new.text is distinct from old.text then
      new.is_visible := false;
      new.moderation_note := null;
    end if;
  end if;
  return new;
end;
$$;
create trigger reviews_reset_moderation before insert or update on public.reviews
for each row execute function public.reset_review_moderation_on_edit();

create or replace function public.sync_review_rating()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() = new.user_id then
    insert into public.anime_ratings (user_id, anime_id, rating)
    values (new.user_id, new.anime_id, new.rating)
    on conflict (user_id, anime_id) do update set rating = excluded.rating;
  end if;
  return new;
end;
$$;
create trigger reviews_sync_community_rating after insert or update of rating on public.reviews
for each row execute function public.sync_review_rating();

create or replace function public.moderate_review(p_review_id uuid, p_visible boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'Недостаточно прав для модерации';
  end if;
  update public.reviews
  set is_visible = p_visible, moderation_note = nullif(left(coalesce(p_note, ''), 500), '')
  where id = p_review_id;
  if not found then raise exception 'Отзыв не найден'; end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.genres enable row level security;
alter table public.anime enable row level security;
alter table public.anime_genres enable row level security;
alter table public.episodes enable row level security;
alter table public.user_anime_status enable row level security;
alter table public.anime_ratings enable row level security;
alter table public.reviews enable row level security;
alter table public.review_reports enable row level security;

create policy "Public profile cards are readable" on public.profiles for select using (is_public or auth.uid() = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users read their private preferences" on public.user_preferences for select to authenticated using (auth.uid() = user_id);
create policy "Users update their private preferences" on public.user_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Published anime is readable" on public.anime for select using (is_published);
create policy "Genre dictionary is readable" on public.genres for select using (true);
create policy "Anime genre links are readable" on public.anime_genres for select using (true);
create policy "Episodes of published anime are readable" on public.episodes for select using (
  exists (select 1 from public.anime a where a.id = anime_id and a.is_published)
);

create policy "Users read their own list" on public.user_anime_status for select to authenticated using (auth.uid() = user_id);
create policy "Users add to their own list" on public.user_anime_status for insert to authenticated with check (
  auth.uid() = user_id and exists (select 1 from public.anime a where a.id = anime_id and a.is_published)
);
create policy "Users update their own list" on public.user_anime_status for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users remove from their own list" on public.user_anime_status for delete to authenticated using (auth.uid() = user_id);

create policy "Users read their own ratings" on public.anime_ratings for select to authenticated using (auth.uid() = user_id);
create policy "Users rate titles as themselves" on public.anime_ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "Users edit their own rating" on public.anime_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users remove their own rating" on public.anime_ratings for delete to authenticated using (auth.uid() = user_id);

create policy "Visible reviews on public profiles and own drafts are readable" on public.reviews for select using (
  auth.uid() = user_id or (is_visible and exists (
    select 1 from public.profiles p where p.id = user_id and p.is_public
  ))
);
create policy "Admins can read all review submissions" on public.reviews for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users submit reviews for themselves" on public.reviews for insert to authenticated with check (
  auth.uid() = user_id and exists (select 1 from public.anime a where a.id = anime_id and a.is_published)
);
create policy "Users edit their own review" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins moderate reviews" on public.reviews for update to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Users report reviews once" on public.review_reports for insert to authenticated with check (
  auth.uid() = reporter_id and exists (select 1 from public.reviews r where r.id = review_id and r.is_visible and r.user_id <> auth.uid())
);
create policy "Reporters see their own reports" on public.review_reports for select to authenticated using (auth.uid() = reporter_id);
create policy "Admins review reports" on public.review_reports for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Start from no client table access so default Supabase grants cannot expose private columns.
revoke all on public.profiles, public.user_preferences, public.genres, public.anime, public.anime_genres,
  public.episodes, public.user_anime_status, public.anime_ratings, public.reviews, public.review_reports
  from public, anon, authenticated;
revoke all on public.anime_catalog from public, anon, authenticated;

-- Narrow column grants keep emails/preferences/private moderation fields out of public reads.
revoke all on public.profiles from anon, authenticated;
grant select (id, username, nickname, is_public, avatar_url, banner_url, created_at) on public.profiles to anon, authenticated;
grant update (nickname, is_public, avatar_url, banner_url) on public.profiles to authenticated;

grant select, update (theme_preference) on public.user_preferences to authenticated;
grant select (id, slug, name, created_at) on public.genres to anon, authenticated;
grant select on public.anime_genres to anon, authenticated;
grant select (id, anime_id, episode_number, title, hls_url, duration_seconds, created_at, updated_at) on public.episodes to anon, authenticated;
grant select (id, slug, title_ru, title_original, description, poster_url, banner_url, year, type, age_rating, release_status, genres, episodes_count, views_count, is_published, created_at, updated_at) on public.anime to anon, authenticated;
grant select on public.anime_catalog to anon, authenticated;
grant execute on function public.search_anime(text, text, integer, text, text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.public_profile_stats(uuid) to anon, authenticated;
grant execute on function public.record_anime_view(uuid) to anon, authenticated;
grant execute on function public.moderate_review(uuid, boolean, text) to authenticated;
revoke all on function public.moderate_review(uuid, boolean, text) from public;

grant select, insert, update, delete on public.user_anime_status to authenticated;
grant select, insert, update, delete on public.anime_ratings to authenticated;

revoke all on public.reviews from anon, authenticated;
grant select (id, user_id, anime_id, rating, text, is_visible, created_at, updated_at) on public.reviews to anon, authenticated;
grant insert (user_id, anime_id, rating, text) on public.reviews to authenticated;
grant update (rating, text) on public.reviews to authenticated;
grant select, insert on public.review_reports to authenticated;

-- Avatar/banner uploads are public to read, private to write. Store files below <uid>/avatar/ or <uid>/banner/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Profile media is publicly readable" on storage.objects for select using (bucket_id = 'profile-media');
create policy "Users upload their own profile media" on storage.objects for insert to authenticated with check (
  bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Users replace their own profile media" on storage.objects for update to authenticated using (
  bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text
) with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete their own profile media" on storage.objects for delete to authenticated using (
  bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Synchronized public artwork is served from the project's own CDN-backed Storage bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anime-media', 'anime-media', true, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Anime artwork is publicly readable" on storage.objects for select using (bucket_id = 'anime-media');
