import { db } from '@/lib/db';

export async function GET() {
  const stats = db.getStats();
  return Response.json(stats);
}
