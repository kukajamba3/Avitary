'use client';

import { useEffect, useState, useTransition } from 'react';
import { Moon, Sun } from 'lucide-react';
import { saveThemePreference } from '@/app/actions';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    setReady(true);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('avitary-theme', next);
    startTransition(() => { void saveThemePreference(next); });
  }

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
      {ready && theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
