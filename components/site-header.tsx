'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles, X } from 'lucide-react';
import type { PublicProfile } from '@/lib/types';
import { SearchBox } from '@/components/search-box';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const pathname = usePathname();
  const links = [
    { href: '/catalog', label: 'Каталог' },
    { href: '/catalog?sort=added', label: 'Новинки' },
    { href: '/library', label: 'Моя коллекция' },
  ];

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let active = true;
    const loadProfile = async (userId?: string) => {
      if (!userId) { if (active) setProfile(null); return; }
      const { data } = await supabase.from('profiles').select('id,username,nickname,avatar_url,banner_url,created_at').eq('id', userId).maybeSingle();
      if (active) setProfile(data as PublicProfile | null);
    };
    void supabase.auth.getUser().then(({ data }) => loadProfile(data.user?.id));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { void loadProfile(session?.user.id); }, 0);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Avitary — главная">
          <span className="brand-mark"><Sparkles size={19} strokeWidth={2.3} /></span>
          <span>avitary<span className="brand-sub">anime, at your pace</span></span>
        </Link>
        <nav className="nav-links" aria-label="Основная навигация">
          {links.map((link) => <Link key={link.href} href={link.href} className={`nav-link ${pathname === link.href ? 'active' : ''}`}>{link.label}</Link>)}
        </nav>
        <div className="header-spacer" />
        <div className="header-actions">
          <SearchBox className="header-search" placeholder="Найти историю…" />
          <ThemeToggle />
          {profile ? (
            <Link href={`/u/${profile.username}`} className="icon-button header-profile-link" aria-label="Мой профиль" title={profile.nickname}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full rounded-[13px] object-cover" /> : <span className="text-xs font-extrabold">{profile.nickname.slice(0, 1).toUpperCase()}</span>}
            </Link>
          ) : (
            <Link href="/login" className="button button-primary hidden sm:inline-flex">Войти</Link>
          )}
          <button type="button" className="icon-button mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="px-3 pb-2 pt-1"><SearchBox placeholder="Найти историю…" /></div>
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
        {profile ? <><Link href={`/u/${profile.username}`} onClick={() => setMenuOpen(false)}>Мой профиль</Link><Link href="/settings" onClick={() => setMenuOpen(false)}>Настройки</Link></> : <><Link href="/login" onClick={() => setMenuOpen(false)}>Войти</Link><Link href="/register" onClick={() => setMenuOpen(false)}>Создать профиль</Link></>}
      </div>
    </header>
  );
}
