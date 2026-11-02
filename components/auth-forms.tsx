'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, Mail, Sparkles } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import { safeNextPath } from '@/lib/format';

function AuthAside({ register = false }: { register?: boolean }) {
  return (
    <aside className="auth-aside">
      <span className="brand-mark" style={{ width: 42, height: 42, borderRadius: 15 }}><Sparkles size={20} /></span>
      <h1>{register ? <>Здесь начинается твоя <span style={{ color: 'var(--brand)' }}>история.</span></> : <>Вернись к своим <span style={{ color: 'var(--brand)' }}>историям.</span></>}</h1>
      <p>{register ? 'Сохраняй любимое, отмечай просмотренное и находи новые истории в своём темпе.' : 'Войди в Avitary, чтобы открыть личную коллекцию, оценки и сохранённые впечатления.'}</p>
      <div className="auth-quote"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/50 text-[var(--brand)]"><Sparkles size={15} /></span><span>Твоё личное пространство для аниме</span></div>
    </aside>
  );
}

export function LoginForm({ nextPath = '/' }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!isSupabaseConfigured()) { setError('Подключите Supabase в .env.local, чтобы включить вход.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        const isUnconfirmed = /email not confirmed/i.test(authError.message);
        if (isUnconfirmed) {
          router.push(`/auth/confirm?email=${encodeURIComponent(email.trim())}`);
          return;
        }
        setError(/invalid login credentials/i.test(authError.message) ? 'Проверьте email и пароль.' : authError.message);
      } else {
        router.push(safeNextPath(nextPath));
        router.refresh();
      }
    } catch {
      setError('Не удалось подключиться. Проверьте настройки Supabase и попробуйте ещё раз.');
    } finally { setLoading(false); }
  }

  return (
    <div className="container auth-layout">
      <AuthAside />
      <section className="surface auth-card">
        <span className="eyebrow">С возвращением</span>
        <h2 className="mt-2">Войти в аккаунт</h2>
        <p>Твоя коллекция и отзывы уже ждут.</p>
        <form className="form-stack" onSubmit={submit}>
          <div className="form-field"><label htmlFor="email">Электронная почта</label><input className="form-control" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
          <div className="form-field"><label htmlFor="password">Пароль</label><div className="relative"><input className="form-control pr-12" id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Твой пароль" /><button type="button" className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--brand-wash)]" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
          <div className="-mt-2 text-right"><Link href="/reset-password" className="text-[10px] font-bold text-[var(--brand)]">Забыли пароль?</Link></div>
          {error ? <p role="alert" className="form-error">{error}</p> : null}
          <button className="button button-primary button-block" disabled={loading}>{loading ? 'Входим…' : 'Войти'} <ArrowRight size={15} /></button>
        </form>
        <div className="auth-footer">Ещё нет профиля? <Link href="/register">Создать аккаунт</Link></div>
      </section>
    </div>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) { setError('Логин: 3–24 символа, латинские буквы, цифры или _.'); return; }
    if (password.length < 8) { setError('Пароль должен содержать не меньше 8 символов.'); return; }
    if (!isSupabaseConfigured()) { setError('Подключите Supabase в .env.local, чтобы включить регистрацию.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: redirectTo, data: { username: normalizedUsername, nickname: nickname.trim() || normalizedUsername } },
      });
      if (authError) {
        if (/user already registered/i.test(authError.message)) setError('Этот email уже зарегистрирован. Попробуйте войти.');
        else if (/логин уже занят|profiles_username_key/i.test(authError.message)) setError('Этот логин уже занят. Выберите другой.');
        else setError(authError.message);
      }
      else if (data.session) {
        setSuccess('Профиль создан. Можно начинать собирать свою коллекцию.');
        router.push('/library');
        router.refresh();
      } else {
        router.push(`/auth/confirm?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } catch {
      setError('Не удалось подключиться. Проверьте настройки Supabase и попробуйте ещё раз.');
    } finally { setLoading(false); }
  }

  return (
    <div className="container auth-layout">
      <AuthAside register />
      <section className="surface auth-card">
        <span className="eyebrow">Создать профиль</span>
        <h2 className="mt-2">Добро пожаловать</h2>
        <p>Всего пара шагов — и всё любимое будет под рукой.</p>
        <form className="form-stack" onSubmit={submit}>
          <div className="form-field"><label htmlFor="reg-email">Электронная почта</label><input className="form-control" id="reg-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
          <div className="form-field"><label htmlFor="username">Логин</label><input className="form-control" id="username" autoComplete="username" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="например, hikari_7" /><span className="form-hint">Логин — ваш постоянный идентификатор. После регистрации изменить его нельзя.</span></div>
          <div className="form-field"><label htmlFor="nickname">Отображаемое имя <span className="font-normal text-[var(--muted)]">(необязательно)</span></label><input className="form-control" id="nickname" autoComplete="nickname" maxLength={40} value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Как к вам обращаться" /></div>
          <div className="form-field"><label htmlFor="reg-password">Пароль</label><input className="form-control" id="reg-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" /></div>
          <div className="flex items-start gap-2 rounded-xl bg-[var(--brand-wash)] p-3 text-[10px] leading-relaxed text-[var(--muted)]"><Check size={14} className="mt-0.5 shrink-0 text-[var(--brand)]" />После регистрации мы отправим письмо для подтверждения адреса. Войти можно будет после подтверждения.</div>
          {error ? <p role="alert" className="form-error">{error}</p> : null}
          {success ? <p role="status" className="form-success">{success}</p> : null}
          <button className="button button-primary button-block" disabled={loading}>{loading ? 'Создаём профиль…' : 'Создать профиль'} <ArrowRight size={15} /></button>
        </form>
        <div className="auth-footer">Уже есть профиль? <Link href="/login">Войти</Link></div>
      </section>
    </div>
  );
}

export function ResendConfirmation({ initialEmail = '' }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(''); setError('');
    if (!isSupabaseConfigured()) { setError('Сначала подключите Supabase в настройках проекта.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (resendError) setError(resendError.message);
      else setMessage('Если для этого адреса ожидает подтверждения аккаунт, письмо уже отправлено. Проверьте входящие и папку «Спам».');
    } catch { setError('Не удалось отправить запрос. Попробуйте ещё раз чуть позже.'); }
    finally { setLoading(false); }
  }

  return (
    <section className="surface auth-card">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-wash)] text-[var(--brand)]"><Mail size={21} /></span>
      <h2 className="mt-5">Подтвердите почту</h2>
      <p>Мы отправили письмо со ссылкой для подтверждения. Перейдите по ней, чтобы завершить регистрацию.</p>
      <form className="form-stack" onSubmit={submit}>
        <div className="form-field"><label htmlFor="confirm-email">Электронная почта</label><input className="form-control" id="confirm-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
        {error ? <p role="alert" className="form-error">{error}</p> : null}
        {message ? <p role="status" className="form-success">{message}</p> : null}
        <button className="button button-primary button-block" disabled={loading}>{loading ? 'Отправляем…' : 'Отправить письмо ещё раз'}</button>
      </form>
      <div className="auth-footer">Почта уже подтверждена? <Link href="/login">Войти</Link></div>
    </section>
  );
}

export function ResetPasswordForm({ updateMode = false }: { updateMode?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError('');
    if (!isSupabaseConfigured()) { setError('Подключите Supabase в .env.local, чтобы использовать восстановление.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      if (updateMode) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) setError(updateError.message);
        else { setMessage('Пароль обновлён. Сейчас вернём вас ко входу.'); window.setTimeout(() => router.push('/login'), 1200); }
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password?update=1` });
        if (resetError) setError(resetError.message);
        else setMessage('Если аккаунт с таким адресом существует, письмо со ссылкой уже отправлено.');
      }
    } catch { setError('Не удалось выполнить запрос. Попробуйте позже.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="container auth-layout"><AuthAside /><section className="surface auth-card"><span className="eyebrow">Безопасность аккаунта</span><h2 className="mt-2">{updateMode ? 'Новый пароль' : 'Восстановить пароль'}</h2><p>{updateMode ? 'Придумайте новый пароль для своего профиля.' : 'Мы отправим письмо со ссылкой для безопасного сброса пароля.'}</p><form className="form-stack" onSubmit={submit}>{updateMode ? <div className="form-field"><label htmlFor="new-password">Новый пароль</label><input className="form-control" id="new-password" type="password" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" /></div> : <div className="form-field"><label htmlFor="reset-email">Электронная почта</label><input className="form-control" id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>}{error ? <p role="alert" className="form-error">{error}</p> : null}{message ? <p role="status" className="form-success">{message}</p> : null}<button className="button button-primary button-block" disabled={loading}>{loading ? 'Подождите…' : updateMode ? 'Сохранить новый пароль' : 'Отправить ссылку для сброса'}</button></form><div className="auth-footer"><Link href="/login">Вернуться ко входу</Link></div></section></div>
  );
}
