import { db, type Category } from '../db';

interface GHRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics: string[];
}

function classify(repo: GHRepo): Category {
  const combined = `${repo.topics.join(' ')} ${repo.description ?? ''} ${repo.name}`.toLowerCase();
  if (/\btool\b|cli|utility|framework|library|sdk/.test(combined)) return 'tool';
  if (/market|saas|startup|platform/.test(combined)) return 'market';
  return 'trend';
}

function score(repo: GHRepo): number {
  const aiTerms = ['ai','gpt','llm','machine-learning','neural','chatbot','openai','anthropic','ml','rag','agent','langchain'];
  const combined = `${repo.topics.join(' ')} ${repo.description ?? ''}`.toLowerCase();
  const aiScore = aiTerms.filter(k => combined.includes(k)).length * 12;
  const starScore = Math.min(repo.stargazers_count / 50, 40);
  return Math.min(aiScore + starScore, 100);
}

export async function scanGitHub(token?: string): Promise<{ count: number; newCount: number }> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://api.github.com/search/repositories?q=topic:ai+created:>${since}&sort=stars&order=desc&per_page=20`;

  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'platform-opportunities/1.0',
  };
  if (token) headers['Authorization'] = `token ${token}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`);

  const data: { items: GHRepo[] } = await res.json();
  let newCount = 0;

  for (const repo of data.items) {
    const title = `${repo.full_name}${repo.description ? ': ' + repo.description.slice(0, 80) : ''}`;
    const { isNew } = db.upsertByUrl({
      title,
      description: `${repo.description ?? ''} — Language: ${repo.language ?? 'N/A'} | ⭐ ${repo.stargazers_count}`,
      category: classify(repo),
      url: repo.html_url,
      source: 'github',
      source_name: 'GitHub',
      event_date: null,
      tags: JSON.stringify(['github', ...repo.topics.slice(0, 4)]),
      relevance_score: score(repo),
      bookmarked: 0,
    });
    if (isNew) newCount++;
  }
  return { count: data.items.length, newCount };
}
