import { db, type Category } from '../db';

const HN = 'https://hacker-news.firebaseio.com/v0';

interface HNItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  by?: string;
  type?: string;
}

function classify(title: string): Category {
  const t = title.toLowerCase();
  if (/conference|summit|meetup|hackathon|workshop|webinar/.test(t)) return 'event';
  if (/\btool\b|sdk|framework|library|releases?|launch/.test(t)) return 'tool';
  if (/market|billion|million|saas|startup|revenue|funding/.test(t)) return 'market';
  return 'trend';
}

function score(title: string, hnScore: number): number {
  const keywords = ['ai','llm','gpt','startup','saas','api','open source','billion','opportunity','2025','2026','agent'];
  const t = title.toLowerCase();
  const kScore = keywords.filter(k => t.includes(k)).length * 8;
  return Math.min(kScore + Math.min(hnScore / 8, 36), 100);
}

export async function scanHackerNews(): Promise<{ count: number; newCount: number }> {
  const res = await fetch(`${HN}/beststories.json`, { signal: AbortSignal.timeout(8000) });
  const ids: number[] = await res.json();

  const items = await Promise.all(
    ids.slice(0, 25).map(id =>
      fetch(`${HN}/item/${id}.json`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.json() as Promise<HNItem>)
        .catch(() => null)
    )
  );

  let newCount = 0;
  for (const item of items) {
    if (!item?.title) continue;
    const { isNew } = db.upsertByUrl({
      title: item.title,
      description: `Score: ${item.score ?? 0} | By: ${item.by ?? 'unknown'} on Hacker News`,
      category: classify(item.title),
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      source: 'hackernews',
      source_name: 'Hacker News',
      event_date: null,
      tags: JSON.stringify(['hackernews', 'tech']),
      relevance_score: score(item.title, item.score ?? 0),
      bookmarked: 0,
    });
    if (isNew) newCount++;
  }
  return { count: items.filter(Boolean).length, newCount };
}
