import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type PublicSupabaseClient = SupabaseClient<Database>;
let publicClient: PublicSupabaseClient | null = null;

export function createPublicClient(): PublicSupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!publicClient) {
    publicClient = createSupabaseClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'X-Client-Info': 'avitary-public-renderer' } },
    }) as unknown as PublicSupabaseClient;
  }
  return publicClient;
}
