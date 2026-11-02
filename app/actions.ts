'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/format';
import type { AnimeStatus, ThemePreference } from '@/lib/types';

type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
const validStatuses: AnimeStatus[] = ['watching', 'planned', 'completed', 'dropped'];

async function currentUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateAnimeStatus(animeId: string, status: AnimeStatus | null): Promise<ActionResult> {
  if (!animeId || (status && !validStatuses.includes(status))) return { ok: false, error: 'Выберите корректный статус.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы сохранить список.' };

  const result = status
    ? await supabase.from('user_anime_status').upsert({ user_id: user.id, anime_id: animeId, status }, { onConflict: 'user_id,anime_id' })
    : await supabase.from('user_anime_status').delete().eq('user_id', user.id).eq('anime_id', animeId);
  if (result.error) return { ok: false, error: 'Не получилось обновить список. Попробуйте ещё раз.' };
  revalidatePath('/library');
  revalidatePath('/u/[username]', 'page');
  return { ok: true, message: status ? 'Статус сохранён в вашей коллекции.' : 'Тайтл удалён из коллекции.' };
}

export async function saveAnimeRating(animeId: string, rating: number): Promise<ActionResult> {
  if (!animeId || !Number.isInteger(rating) || rating < 1 || rating > 10) return { ok: false, error: 'Оценка должна быть от 1 до 10.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы поставить оценку.' };
  const { error } = await supabase.from('anime_ratings').upsert(
    { user_id: user.id, anime_id: animeId, rating },
    { onConflict: 'user_id,anime_id' },
  );
  if (error) return { ok: false, error: 'Оценка не сохранилась. Попробуйте ещё раз.' };
  revalidatePath('/anime/[slug]', 'page');
  return { ok: true, message: 'Ваша оценка учтена.' };
}

export async function submitReview(animeId: string, rating: number, text: string): Promise<ActionResult> {
  const cleanText = text.trim();
  if (!animeId || !Number.isInteger(rating) || rating < 1 || rating > 10) return { ok: false, error: 'Выберите оценку от 1 до 10.' };
  if (cleanText.length < 30 || cleanText.length > 3000) return { ok: false, error: 'Отзыв должен содержать от 30 до 3000 символов.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы написать отзыв.' };
  const { error } = await supabase.from('reviews').upsert(
    { user_id: user.id, anime_id: animeId, rating, text: cleanText },
    { onConflict: 'user_id,anime_id' },
  );
  if (error) return { ok: false, error: 'Не получилось отправить отзыв. Проверьте подключение и попробуйте снова.' };
  revalidatePath('/anime/[slug]', 'page');
  return { ok: true, message: 'Отзыв сохранён и появится после проверки модератором.' };
}

export async function reportReview(reviewId: string, reason: string): Promise<ActionResult> {
  const cleanReason = reason.trim();
  if (!reviewId || cleanReason.length < 5 || cleanReason.length > 500) return { ok: false, error: 'Коротко опишите причину жалобы (от 5 символов).' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы отправить жалобу.' };
  const { error } = await supabase.from('review_reports').insert({ review_id: reviewId, reporter_id: user.id, reason: cleanReason });
  if (error?.code === '23505') return { ok: false, error: 'Вы уже отправили жалобу на этот отзыв.' };
  if (error) return { ok: false, error: 'Не удалось отправить жалобу.' };
  return { ok: true, message: 'Спасибо. Жалоба передана на рассмотрение.' };
}

export async function saveProfileNickname(nickname: string): Promise<ActionResult> {
  const cleanNickname = nickname.trim();
  if (cleanNickname.length < 2 || cleanNickname.length > 40) return { ok: false, error: 'Никнейм должен содержать от 2 до 40 символов.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы изменить профиль.' };
  const { error } = await supabase.from('profiles').update({ nickname: cleanNickname }).eq('id', user.id);
  if (error) return { ok: false, error: 'Не получилось сохранить никнейм.' };
  revalidatePath('/settings');
  revalidatePath('/u/[username]', 'page');
  return { ok: true, message: 'Никнейм обновлён.' };
}

export async function saveProfileVisibility(isPublic: boolean): Promise<ActionResult> {
  if (typeof isPublic !== 'boolean') return { ok: false, error: 'Выберите режим видимости профиля.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы изменить видимость профиля.' };
  const { error } = await supabase.from('profiles').update({ is_public: isPublic }).eq('id', user.id);
  if (error) return { ok: false, error: 'Не получилось сохранить видимость профиля.' };
  revalidatePath('/settings');
  revalidatePath('/u/[username]', 'page');
  return { ok: true, message: isPublic ? 'Профиль открыт.' : 'Профиль скрыт от других пользователей.' };
}

export async function saveProfileMedia(kind: 'avatar' | 'banner', url: string): Promise<ActionResult> {
  if ((kind !== 'avatar' && kind !== 'banner') || typeof url !== 'string') return { ok: false, error: 'Некорректные данные изображения.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Войдите в аккаунт, чтобы изменить оформление профиля.' };
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  const expectedUrl = `${projectUrl}/storage/v1/object/public/profile-media/${user.id}/${kind}/current.webp`;
  if (!projectUrl || url !== expectedUrl) return { ok: false, error: 'Не удалось проверить адрес загруженного изображения.' };
  const field = kind === 'avatar' ? 'avatar_url' : 'banner_url';
  const { error } = await supabase.from('profiles').update({ [field]: url }).eq('id', user.id);
  if (error) return { ok: false, error: 'Изображение загружено, но профиль не обновился.' };
  revalidatePath('/settings');
  revalidatePath('/u/[username]', 'page');
  return { ok: true, message: kind === 'avatar' ? 'Аватар обновлён.' : 'Баннер обновлён.' };
}

export async function saveThemePreference(preference: ThemePreference): Promise<ActionResult> {
  if (!['system', 'light', 'dark'].includes(preference)) return { ok: false, error: 'Неизвестная тема.' };
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: true };
  const { error } = await supabase.from('user_preferences').update({ theme_preference: preference }).eq('user_id', user.id);
  if (error) return { ok: false, error: 'Тему не удалось синхронизировать с профилем.' };
  return { ok: true };
}

export async function moderateReview(reviewId: string, visible: boolean, note = ''): Promise<ActionResult> {
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false, error: 'Требуется вход администратора.' };
  const { data: { user: current } } = await supabase.auth.getUser();
  if (current?.app_metadata?.role !== 'admin') return { ok: false, error: 'Недостаточно прав.' };
  const { error } = await supabase.rpc('moderate_review', {
    p_review_id: reviewId,
    p_visible: visible,
    p_note: note.trim().slice(0, 500) || null,
  });
  if (error) return { ok: false, error: 'Модерация не сохранилась.' };
  revalidatePath('/admin');
  revalidatePath('/anime/[slug]', 'page');
  return { ok: true, message: visible ? 'Отзыв опубликован.' : 'Отзыв скрыт.' };
}

export async function signOut(next = '/') {
  const { supabase } = await currentUser();
  if (supabase) await supabase.auth.signOut();
  return safeNextPath(next);
}
