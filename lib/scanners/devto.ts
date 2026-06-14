import { db, type Category } from '../db';

interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_timestamp: string;
  positive_reactions_count: number;
  comments_count: number;
  tag_list: string[];
  user: { name: string };
}

function classify(article: DevToArticle): Category {
  const combined = `${article.tag_list.join(' ')} ${article.title}`.toLowerCase();
  if (/\btool\b|framework|library|sdk|api/.test(combined)) return 'tool';
  if (/startup|saas|business|market|revenue/.test(combined)) return 'market';
  return 'trend';
}

function score(article: DevToArticle): number {
  const aiTags = ['ai','machinelearning','deeplearning','llm','openai','gpt','chatgpt','ml','rag'];
  const tagScore = article.tag_list.filter(t => aiTags.includes(t.toLowerCase())).length * 18;
  const engScore = Math.min((article.positive_reactions_count + article.comments_count) / 4, 36);
  return Math.min(tagScore + engScore + 10, 100);
}

export async function scanDevTo(): Promise<{ count: number; newCount: number }> {
  const res = await fetch('https://dev.to/api/articles?top=7&per_page=20', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Dev.to API ${res.status}`);

  const articles: DevToArticle[] = await res.json();
  let newCount = 0;

  for (const article of articles) {
    const { isNew } = db.upsertByUrl({
      title: article.title,
      description: article.description || `By ${article.user.name} — ❤️ ${article.positive_reactions_count} | 💬 ${article.comments_count}`,
      category: classify(article),
      url: article.url,
      source: 'devto',
      source_name: 'Dev.to',
      event_date: null,
      tags: JSON.stringify(['devto', ...article.tag_list.slice(0, 4)]),
      relevance_score: score(article),
      bookmarked: 0,
    });
    if (isNew) newCount++;
  }
  return { count: articles.length, newCount };
}
