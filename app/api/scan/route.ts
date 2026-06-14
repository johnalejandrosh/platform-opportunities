import { runScan } from '@/lib/scanners';
import { revalidatePath } from 'next/cache';

export async function POST() {
  try {
    const result = await runScan();
    revalidatePath('/');
    revalidatePath('/opportunities');
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Scan failed' }, { status: 500 });
  }
}
