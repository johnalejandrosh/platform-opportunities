import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/opportunities/[id]'>) {
  const { id } = await ctx.params;
  const opportunity = db.getById(parseInt(id));
  if (!opportunity) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ opportunity });
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/opportunities/[id]'>) {
  const { id } = await ctx.params;
  const body = await request.json();
  const opportunity = db.update(parseInt(id), body);
  if (!opportunity) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ opportunity });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/opportunities/[id]'>) {
  const { id } = await ctx.params;
  const deleted = db.delete(parseInt(id));
  if (!deleted) return Response.json({ error: 'Not found' }, { status: 404 });
  return new Response(null, { status: 204 });
}
