import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNextPath } from '@/lib/format';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const supabase = await createClient();
  if (!supabase || !code) return NextResponse.redirect(new URL('/auth/confirm?status=invalid', url.origin));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL('/auth/confirm?status=invalid', url.origin));
  const destination = next === '/' ? '/auth/confirmed' : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
