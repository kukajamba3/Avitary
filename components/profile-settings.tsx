'use client';

import { ChangeEvent, FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, LoaderCircle, Save, Upload } from 'lucide-react';
import { saveProfileMedia, saveProfileNickname, saveProfileVisibility, saveThemePreference } from '@/app/actions';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { ThemePreference } from '@/lib/types';

export function NicknameForm({ initialNickname, username }: { initialNickname: string; username: string }) {
  const [nickname, setNickname] = useState(initialNickname);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError('');
    startTransition(async () => {
      const result = await saveProfileNickname(nickname);
      if (result.ok) setMessage(result.message ?? 'Сохранено');
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div className="form-field"><label htmlFor="nickname">Отображаемое имя</label><input className="form-control" id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={40} minLength={2} required /><span className="form-hint">Логин <strong>@{username}</strong> остаётся неизменным.</span></div>
      <button className="button button-primary" disabled={pending}>{pending ? 'Сохраняем…' : 'Сохранить'} <Save size={14} /></button>
      {message ? <p className="form-success sm:col-span-2">{message}</p> : null}{error ? <p className="form-error sm:col-span-2">{error}</p> : null}
    </form>
  );
}

export function ProfileVisibilityControl({ initialPublic }: { initialPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function change(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.checked;
    setIsPublic(next);
    setMessage('');
    startTransition(async () => {
      const result = await saveProfileVisibility(next);
      if (result.ok) setMessage(result.message ?? 'Настройка сохранена.');
      else { setIsPublic(!next); setMessage(result.error); }
    });
  }

  return (
    <div className="mt-4">
      <label className="soft-panel flex cursor-pointer items-start gap-3 p-4">
        <input type="checkbox" checked={isPublic} onChange={change} disabled={pending} aria-describedby="profile-visibility-help" className="mt-1 accent-[var(--brand)]" />
        <span><strong className="block text-xs">Публичный профиль</strong><span id="profile-visibility-help" className="mt-1 block text-[10px] leading-relaxed text-[var(--muted)]">Когда профиль открыт, другим видны имя, оформление, одобренные отзывы и общая статистика. Личные списки, оценки по отдельным тайтлам, почта и настройки остаются закрытыми.</span></span>
      </label>
      {message ? <p role="status" className="mt-2 text-[10px] text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}

function cropToWebp(file: File, kind: 'avatar' | 'banner') {
  return new Promise<Blob>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = kind === 'avatar' ? 512 : 1440;
      const height = kind === 'avatar' ? 512 : 470;
      const targetRatio = width / height;
      const sourceRatio = image.width / image.height;
      let sx = 0, sy = 0, sw = image.width, sh = image.height;
      if (sourceRatio > targetRatio) { sw = image.height * targetRatio; sx = (image.width - sw) / 2; }
      else { sh = image.width / targetRatio; sy = (image.height - sh) / 2; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(objectUrl); reject(new Error('Не удалось обработать изображение.')); return; }
      context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) resolve(blob); else reject(new Error('Браузер не смог подготовить изображение.'));
      }, 'image/webp', .86);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Не удалось открыть это изображение.')); };
    image.src = objectUrl;
  });
}

export function ProfileMediaUploader({ kind, currentUrl }: { kind: 'avatar' | 'banner'; currentUrl: string | null }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const isAvatar = kind === 'avatar';

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setMessage(''); setError('');
    if (!file.type.startsWith('image/')) { setError('Выберите файл изображения.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('Размер файла не должен превышать 12 МБ.'); return; }
    if (!isSupabaseConfigured()) { setError('Подключите Supabase, чтобы загружать изображения профиля.'); return; }
    setPending(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Войдите в аккаунт, чтобы изменить оформление.');
      const blob = await cropToWebp(file, kind);
      const path = `${user.id}/${kind}/current.webp`;
      const { error: uploadError } = await supabase.storage.from('profile-media').upload(path, blob, { contentType: 'image/webp', upsert: true, cacheControl: '3600' });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from('profile-media').getPublicUrl(path);
      const result = await saveProfileMedia(kind, data.publicUrl);
      if (!result.ok) throw new Error(result.error);
      setMessage(result.message ?? 'Готово');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить изображение.');
    } finally { setPending(false); }
  }

  return (
    <div className="media-row">
      <div className="flex min-w-0 items-center gap-12">
        {isAvatar ? <div className="avatar h-14 w-14">{currentUrl ? <img src={currentUrl} alt="Текущий аватар" /> : <ImagePlus size={19} />}</div> : <div className="h-12 w-20 overflow-hidden rounded-xl bg-[var(--brand-soft)]">{currentUrl ? <img src={currentUrl} className="h-full w-full object-cover" alt="Текущий баннер" /> : <div className="grid h-full place-items-center text-[var(--brand)]"><ImagePlus size={18} /></div>}</div>}
        <div><strong>{isAvatar ? 'Аватар профиля' : 'Баннер профиля'}</strong><span>{isAvatar ? 'Квадратное изображение · 512 × 512' : 'Широкое изображение · 1440 × 470'}</span></div>
      </div>
      <label className="button button-secondary file-button">{pending ? <LoaderCircle size={14} className="animate-spin" /> : <Upload size={14} />}{pending ? 'Загружаем…' : 'Загрузить'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={pending} aria-label={`Загрузить ${isAvatar ? 'аватар' : 'баннер'}`} /></label>
      {message ? <span role="status" className="basis-full text-[10px] text-[var(--mint)]">{message}</span> : null}
      {error ? <span role="alert" className="basis-full text-[10px] text-rose">{error}</span> : null}
    </div>
  );
}

export function ThemePreferenceSelect({ initialPreference }: { initialPreference: ThemePreference }) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  function change(value: ThemePreference) {
    setPreference(value); setMessage('');
    if (value === 'system') {
      window.localStorage.removeItem('avitary-theme');
      document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      window.localStorage.setItem('avitary-theme', value);
      document.documentElement.dataset.theme = value;
    }
    startTransition(async () => {
      const result = await saveThemePreference(value);
      if (result.ok) setMessage('Настройка сохранена.');
      else setMessage(result.error);
    });
  }
  return <div className="grid gap-3 sm:grid-cols-[1fr_220px] sm:items-center"><div><strong className="block text-xs">Оформление</strong><span className="mt-1 block text-[10px] text-[var(--muted)]">Тему можно синхронизировать с настройками профиля.</span></div><div><select className="form-control" value={preference} disabled={pending} onChange={(event) => change(event.target.value as ThemePreference)}><option value="system">Как в системе</option><option value="light">Светлая</option><option value="dark">Тёмная</option></select>{message ? <span role="status" className="mt-1 block text-[10px] text-[var(--muted)]">{message}</span> : null}</div></div>;
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function logout() {
    startTransition(async () => {
      try { await createClient().auth.signOut(); } finally { router.push('/'); router.refresh(); }
    });
  }
  return <button className="button button-secondary" type="button" disabled={pending} onClick={logout}>{pending ? 'Выходим…' : 'Выйти из аккаунта'}</button>;
}
