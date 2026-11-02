import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon, LockKeyhole, Palette, UserRound } from 'lucide-react';
import { NicknameForm, ProfileMediaUploader, ProfileVisibilityControl, SignOutButton, ThemePreferenceSelect } from '@/components/profile-settings';
import { createClient } from '@/lib/supabase/server';
import type { PublicProfile, ThemePreference } from '@/lib/types';

export const metadata: Metadata = { title: 'Настройки профиля' };

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login?next=%2Fsettings');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fsettings');
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from('profiles').select('id,username,nickname,is_public,avatar_url,banner_url,created_at').eq('id', user.id).single(),
    supabase.from('user_preferences').select('theme_preference').eq('user_id', user.id).maybeSingle(),
  ]);
  if (!profile) redirect('/login');
  const typedProfile = profile as PublicProfile;
  const theme = (preferences?.theme_preference ?? 'system') as ThemePreference;

  return (
    <div className="container page-shell">
      <Link href={`/u/${typedProfile.username}`} className="breadcrumb"><ArrowLeft size={13} /> Вернуться в профиль</Link>
      <div className="catalog-heading" style={{ marginTop: 14 }}><div><span className="eyebrow">Аккаунт Avitary</span><h1>Настройки</h1><p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>Управляйте публичным профилем и личными предпочтениями.</p></div></div>
      <div className="settings-layout">
        <nav className="surface settings-nav" aria-label="Разделы настроек"><a href="#profile" className="active"><UserRound size={15} /> Профиль</a><a href="#media"><ImageIcon size={15} /> Изображения</a><a href="#appearance"><Palette size={15} /> Оформление</a><a href="#account"><LockKeyhole size={15} /> Аккаунт</a></nav>
        <div>
          <section id="profile" className="surface settings-card"><h2>Отображаемое имя</h2><p>Это имя видят другие пользователи на вашей странице и рядом с отзывами.</p><NicknameForm initialNickname={typedProfile.nickname} username={typedProfile.username} /><div className="mt-5 border-t border-[var(--line)] pt-4"><h3 className="text-xs font-bold">Видимость профиля</h3><ProfileVisibilityControl initialPublic={typedProfile.is_public} /></div></section>
          <section id="media" className="surface settings-card"><h2>Изображения профиля</h2><p>Изображения будут автоматически обрезаны и оптимизированы до WebP перед загрузкой.</p><ProfileMediaUploader kind="avatar" currentUrl={typedProfile.avatar_url} /><ProfileMediaUploader kind="banner" currentUrl={typedProfile.banner_url} /></section>
          <section id="appearance" className="surface settings-card"><h2>Оформление</h2><p>Выберите тему для Avitary. Настройка сохраняется в профиле и на этом устройстве.</p><ThemePreferenceSelect initialPreference={theme} /></section>
          <section id="account" className="surface settings-card"><h2>Данные аккаунта</h2><p>Почта и логин доступны только вам. Логин нельзя изменить — он остаётся постоянным адресом вашего профиля.</p><div className="grid gap-4 sm:grid-cols-2"><div className="form-field"><label htmlFor="account-email">Электронная почта</label><input id="account-email" className="form-control" value={user.email ?? ''} readOnly disabled /></div><div className="form-field"><label htmlFor="account-username">Постоянный логин</label><input id="account-username" className="form-control" value={`@${typedProfile.username}`} readOnly disabled /></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5"><Link href="/reset-password" className="text-xs font-bold text-[var(--brand)]">Изменить пароль</Link><SignOutButton /></div></section>
        </div>
      </div>
    </div>
  );
}
