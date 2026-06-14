import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams;
  const opportunities = db.getOpportunities({
    limit: parseInt(s.get('limit') ?? '50'),
    offset: parseInt(s.get('offset') ?? '0'),
    category: s.get('category') ?? undefined,
    search: s.get('search') ?? undefined,
    bookmarked: s.get('bookmarked') === 'true' ? true : s.get('bookmarked') === 'false' ? false : undefined,
    orderBy: (s.get('orderBy') as 'created_at' | 'relevance_score') ?? 'created_at',
    orderDir: (s.get('orderDir') as 'ASC' | 'DESC') ?? 'DESC',
  });
  return Response.json({ opportunities });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.title) return Response.json({ error: 'title is required' }, { status: 400 });
  const opportunity = db.create({
    title: body.title,
    description: body.description ?? '',
    category: body.category ?? 'trend',
    url: body.url ?? '',
    source: 'manual',
    source_name: 'Manual Entry',
    event_date: body.event_date ?? null,
    tags: JSON.stringify(body.tags ?? []),
    relevance_score: body.relevance_score ?? 50,
    bookmarked: 0,
  });
  return Response.json({ opportunity }, { status: 201 });
}
