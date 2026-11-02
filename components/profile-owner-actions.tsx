'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings2, Sparkles } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

export function ProfileOwnerActions({ profileId }: { profileId: string }) {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setIsOwner(data.user?.id === profileId));
  }, [profileId]);
  return isOwner
    ? <Link href="/settings" className="button button-secondary"><Settings2 size={14} /> Настроить профиль</Link>
    : <Link href="/catalog" className="button button-secondary"><Sparkles size={14} /> Смотреть каталог</Link>;
}
