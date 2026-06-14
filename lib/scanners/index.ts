import { db } from '../db';
import { scanHackerNews } from './hackernews';
import { scanGitHub } from './github';
import { scanDevTo } from './devto';

export type ScanSource = 'hackernews' | 'github' | 'devto';

export async function runScan(sources?: ScanSource[]): Promise<{
  scanId: number;
  totalCount: number;
  newCount: number;
  sources: string[];
  errors: Record<string, string>;
}> {
  const enabled: ScanSource[] = sources ?? JSON.parse(db.getSetting('scan_sources') || '["hackernews","github","devto"]');
  const githubToken = db.getSetting('github_token') || undefined;
  const scan = db.createScan();

  let totalCount = 0;
  let totalNew = 0;
  const errors: Record<string, string> = {};
  const used: string[] = [];

  const runners: Record<ScanSource, () => Promise<{ count: number; newCount: number }>> = {
    hackernews: scanHackerNews,
    github: () => scanGitHub(githubToken),
    devto: scanDevTo,
  };

  await Promise.allSettled(
    enabled.map(async (src) => {
      const runner = runners[src];
      if (!runner) return;
      try {
        const { count, newCount } = await runner();
        totalCount += count;
        totalNew += newCount;
        used.push(src);
      } catch (err) {
        errors[src] = err instanceof Error ? err.message : String(err);
      }
    })
  );

  db.completeScan(scan.id, totalCount, totalNew, used);
  return { scanId: scan.id, totalCount, newCount: totalNew, sources: used, errors };
}
