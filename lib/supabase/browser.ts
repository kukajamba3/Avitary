'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type BrowserSupabaseClient = SupabaseClient<Database>;
let browserClient: BrowserSupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createClient(): BrowserSupabaseClient {
  if (!isSupabaseConfigured()) throw new Error('Добавьте URL и anon key проекта Supabase в .env.local.');
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ) as unknown as BrowserSupabaseClient;
  }
  return browserClient;
}
