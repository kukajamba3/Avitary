import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'private, max-age=0' } });
  }

  const results = await getCatalog({ query, sort: 'popular', limit: 7 });
  return NextResponse.json(
    { items: results.items.map(({ id, slug, title_ru, title_original, year, type, poster_url }) => ({ id, slug, title_ru, title_original, year, type, poster_url })) },
    { headers: { 'Cache-Control': 'public, max-age=20, stale-while-revalidate=40', 'Vary': 'Accept-Encoding' } },
  );
}
