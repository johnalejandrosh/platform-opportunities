import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'opportunities.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'trend',
      url TEXT DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      source_name TEXT DEFAULT '',
      event_date TEXT DEFAULT NULL,
      tags TEXT DEFAULT '[]',
      relevance_score REAL DEFAULT 0,
      bookmarked INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      completed_at TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      results_count INTEGER DEFAULT 0,
      new_count INTEGER DEFAULT 0,
      sources_used TEXT DEFAULT '[]',
      error TEXT DEFAULT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`);
  insertSetting.run('rapidapi_key', '');
  insertSetting.run('github_token', '');
  insertSetting.run('scan_sources', JSON.stringify(['hackernews', 'github', 'devto']));
  insertSetting.run('priority_keywords', JSON.stringify(['ai', 'machine learning', 'llm', 'startup', 'saas']));

  // Seed data on first run
  const count = (db.prepare('SELECT COUNT(*) as c FROM opportunities').get() as { c: number }).c;
  if (count === 0) seedData(db);
}

function seedData(db: Database.Database): void {
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO opportunities (title, description, category, url, source, source_name, event_date, tags, relevance_score, bookmarked, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);
  const seed = [
    ['Google I/O 2026 — AI-First Developer Conference', 'Annual Google developer conference focused heavily on AI, Gemini, and Android. Major product announcements expected.', 'conference', 'https://io.google', 'manual', 'Curated', '2026-08-15', '["google","ai","conference","gemini"]', 95],
    ['AWS re:Invent 2026', 'Largest cloud computing conference. Key for AI infrastructure, SageMaker updates, and new services.', 'conference', 'https://reinvent.awsevents.com', 'manual', 'Curated', '2026-11-28', '["aws","cloud","ai","conference"]', 90],
    ['NeurIPS 2026 — Neural Information Processing Systems', 'Premier ML research conference. Best place to see what AI capabilities are 2-3 years ahead.', 'conference', 'https://neurips.cc', 'manual', 'Curated', '2026-12-05', '["ai","research","ml","conference"]', 92],
    ['AI Agents Market Exploding — $50B opportunity by 2028', 'Enterprise automation via AI agents is the fastest-growing segment. Companies paying $10k-$100k/month for agent workflows.', 'market', 'https://a16z.com/ai-agents', 'manual', 'Curated', null, '["ai","agents","market","enterprise"]', 98],
    ['Personal Finance AI Apps — Underserved Market', 'Most personal finance apps are basic. AI-powered budgeting, investing advice, and financial planning tools have massive demand.', 'market', 'https://techcrunch.com', 'manual', 'Curated', null, '["fintech","ai","market","saas"]', 88],
    ['Voice AI for Small Business — $5B gap', 'Small businesses can\'t afford enterprise voice solutions. AI-powered phone answering, appointment booking, and customer service.', 'market', 'https://example.com', 'manual', 'Curated', null, '["voice","ai","smb","market"]', 85],
    ['GraphRAG — Microsoft\'s New Framework Released', 'GraphRAG uses knowledge graphs with RAG for dramatically better context retrieval. Open source, production-ready.', 'tool', 'https://github.com/microsoft/graphrag', 'github', 'GitHub', null, '["rag","ai","microsoft","tool","llm"]', 80],
    ['Vibe Coding Platforms Growing 400% YoY', 'No-code AI app builders (Bolt, Lovable, v0) seeing explosive growth. Massive opportunity to build vertical-specific vibe coding tools.', 'trend', 'https://www.businessinsider.com', 'manual', 'Curated', null, '["nocode","ai","tools","trend"]', 87],
    ['AI Health Diagnostics — Regulatory Approval Wave', 'FDA approving AI diagnostic tools at record pace. Medical imaging AI, symptom checkers, and chronic disease management.', 'market', 'https://www.fda.gov', 'manual', 'Curated', null, '["health","ai","market","fda"]', 82],
    ['Open Source LLMs Closing Gap with GPT-4', 'Llama 4, Mistral, and Qwen models now competitive for most tasks. Enables affordable AI products without OpenAI dependency.', 'tool', 'https://huggingface.co', 'manual', 'Curated', null, '["llm","opensource","ai","tool"]', 83],
    ['AI-First Micro SaaS — $1M ARR in 6 months', 'Multiple founders hitting $1M ARR with solo or 2-person AI-powered SaaS. Niche tools solving specific pain points.', 'market', 'https://www.indiehackers.com', 'manual', 'Curated', null, '["saas","ai","startup","market"]', 91],
    ['Neural Search Replacing Keyword Search', 'Vector databases (Pinecone, Weaviate, pgvector) enabling semantic search. Every app that has search is a rebuild target.', 'trend', 'https://techcrunch.com', 'manual', 'Curated', null, '["search","ai","vector","trend"]', 76],
    ['Latin America AI Adoption Accelerating', 'LATAM markets (Brazil, Mexico, Colombia) seeing fast AI adoption with less competition than US/EU. First-mover advantage available.', 'market', 'https://www.mckinsey.com', 'manual', 'Curated', null, '["latam","market","ai","opportunity"]', 79],
    ['AI Video Generation — Creator Economy Disruption', 'Sora, Runway, Kling enabling professional video without cameras. Tools for automated content creation in high demand.', 'trend', 'https://openai.com/sora', 'manual', 'Curated', null, '["video","ai","creator","trend"]', 81],
    ['Developer Tools AI Market — $25B by 2027', 'GitHub Copilot, Cursor, Devin proving developers pay for AI tools. Vertical developer tools for specific frameworks/languages.', 'market', 'https://gartner.com', 'manual', 'Curated', null, '["devtools","ai","market","saas"]', 89],
  ];
  for (const s of seed) {
    insert.run(...s, now, now);
  }
}

export type Category = 'trend' | 'event' | 'conference' | 'keyword' | 'tool' | 'market';

export interface Opportunity {
  id: number;
  title: string;
  description: string;
  category: Category;
  url: string;
  source: string;
  source_name: string;
  event_date: string | null;
  tags: string;
  relevance_score: number;
  bookmarked: number;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  results_count: number;
  new_count: number;
  sources_used: string;
  error: string | null;
}

export const db = {
  getOpportunities(opts: {
    limit?: number;
    offset?: number;
    category?: string;
    bookmarked?: boolean;
    search?: string;
    orderBy?: 'created_at' | 'relevance_score' | 'event_date';
    orderDir?: 'ASC' | 'DESC';
  } = {}): Opportunity[] {
    const { limit = 50, offset = 0, category, bookmarked, search, orderBy = 'created_at', orderDir = 'DESC' } = opts;
    let q = 'SELECT * FROM opportunities WHERE 1=1';
    const p: (string | number)[] = [];
    if (category && category !== 'all') { q += ' AND category = ?'; p.push(category); }
    if (bookmarked !== undefined) { q += ' AND bookmarked = ?'; p.push(bookmarked ? 1 : 0); }
    if (search) { q += ' AND (title LIKE ? OR description LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
    q += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
    p.push(limit, offset);
    return getDb().prepare(q).all(...p) as Opportunity[];
  },

  getById(id: number): Opportunity | null {
    return getDb().prepare('SELECT * FROM opportunities WHERE id = ?').get(id) as Opportunity | null;
  },

  create(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Opportunity {
    const now = new Date().toISOString();
    const r = getDb().prepare(`
      INSERT INTO opportunities (title,description,category,url,source,source_name,event_date,tags,relevance_score,bookmarked,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(data.title,data.description,data.category,data.url,data.source,data.source_name,data.event_date,data.tags,data.relevance_score,data.bookmarked,now,now);
    return this.getById(r.lastInsertRowid as number)!;
  },

  update(id: number, data: Partial<Opportunity>): Opportunity | null {
    const now = new Date().toISOString();
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    if (!fields.length) return this.getById(id);
    const set = fields.map(f => `${f} = ?`).join(', ');
    const vals = fields.map(f => (data as Record<string, unknown>)[f]);
    getDb().prepare(`UPDATE opportunities SET ${set}, updated_at = ? WHERE id = ?`).run(...vals, now, id);
    return this.getById(id);
  },

  delete(id: number): boolean {
    return getDb().prepare('DELETE FROM opportunities WHERE id = ?').run(id).changes > 0;
  },

  upsertByUrl(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): { opportunity: Opportunity; isNew: boolean } {
    if (data.url) {
      const existing = getDb().prepare('SELECT * FROM opportunities WHERE url = ?').get(data.url) as Opportunity | null;
      if (existing) return { opportunity: existing, isNew: false };
    }
    return { opportunity: this.create(data), isNew: true };
  },

  getStats() {
    const d = getDb();
    const total = (d.prepare('SELECT COUNT(*) as c FROM opportunities').get() as { c: number }).c;
    const bookmarked = (d.prepare('SELECT COUNT(*) as c FROM opportunities WHERE bookmarked=1').get() as { c: number }).c;
    const upcomingEvents = (d.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE event_date >= date('now') AND category IN ('event','conference')`).get() as { c: number }).c;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = (d.prepare(`SELECT COUNT(*) as c FROM opportunities WHERE date(created_at)=?`).get(today) as { c: number }).c;
    const catRows = d.prepare('SELECT category, COUNT(*) as c FROM opportunities GROUP BY category').all() as Array<{ category: string; c: number }>;
    const byCategory = Object.fromEntries(catRows.map(r => [r.category, r.c]));
    const lastScan = d.prepare('SELECT * FROM scans ORDER BY started_at DESC LIMIT 1').get() as Scan | null;
    const upcomingList = d.prepare(`SELECT * FROM opportunities WHERE event_date >= date('now') AND category IN ('event','conference') ORDER BY event_date ASC LIMIT 5`).all() as Opportunity[];
    return { total, byCategory, bookmarked, upcomingEvents, todayCount, lastScan, upcomingList };
  },

  createScan(): Scan {
    const now = new Date().toISOString();
    const r = getDb().prepare(`INSERT INTO scans (started_at, status) VALUES (?, 'running')`).run(now);
    return getDb().prepare('SELECT * FROM scans WHERE id = ?').get(r.lastInsertRowid) as Scan;
  },

  completeScan(id: number, total: number, newCount: number, sources: string[]): void {
    getDb().prepare(`UPDATE scans SET completed_at=datetime('now'), status='completed', results_count=?, new_count=?, sources_used=? WHERE id=?`)
      .run(total, newCount, JSON.stringify(sources), id);
  },

  failScan(id: number, error: string): void {
    getDb().prepare(`UPDATE scans SET completed_at=datetime('now'), status='failed', error=? WHERE id=?`).run(error, id);
  },

  getSetting(key: string): string {
    const r = getDb().prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | null;
    return r?.value ?? '';
  },

  setSetting(key: string, value: string): void {
    getDb().prepare(`INSERT OR REPLACE INTO settings (key,value,updated_at) VALUES (?,?,datetime('now'))`).run(key, value);
  },

  getAllSettings(): Record<string, string> {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },
};
