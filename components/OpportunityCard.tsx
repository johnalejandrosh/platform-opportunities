'use client';

import { useState } from 'react';
import type { Opportunity } from '@/lib/db';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  trend:      { bg: 'bg-cyan-950',   text: 'text-cyan-400',   label: 'Trend' },
  event:      { bg: 'bg-emerald-950',text: 'text-emerald-400',label: 'Event' },
  conference: { bg: 'bg-violet-950', text: 'text-violet-400', label: 'Conference' },
  tool:       { bg: 'bg-blue-950',   text: 'text-blue-400',   label: 'Tool' },
  market:     { bg: 'bg-amber-950',  text: 'text-amber-400',  label: 'Market' },
  keyword:    { bg: 'bg-pink-950',   text: 'text-pink-400',   label: 'Keyword' },
};

const SOURCE_ICONS: Record<string, string> = {
  hackernews: '🟠',
  github: '🐙',
  devto: '👩‍💻',
  manual: '✍️',
};

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const [bookmarked, setBookmarked] = useState(opportunity.bookmarked === 1);

  const style = CATEGORY_STYLES[opportunity.category] ?? CATEGORY_STYLES.trend;
  const tags: string[] = JSON.parse(opportunity.tags || '[]');
  const sourceIcon = SOURCE_ICONS[opportunity.source] ?? '📌';

  async function toggleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    await fetch(`/api/opportunities/${opportunity.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarked: next ? 1 : 0 }),
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          <span className="text-slate-500 text-xs">{sourceIcon} {opportunity.source_name}</span>
        </div>
        <button
          onClick={toggleBookmark}
          className={`shrink-0 text-lg transition-opacity ${bookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} hover:opacity-100`}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {bookmarked ? '🔖' : '🏷️'}
        </button>
      </div>

      <div>
        {opportunity.url ? (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-100 font-semibold text-sm leading-snug hover:text-indigo-300 transition-colors line-clamp-2"
          >
            {opportunity.title}
          </a>
        ) : (
          <p className="text-slate-100 font-semibold text-sm leading-snug line-clamp-2">{opportunity.title}</p>
        )}
        {opportunity.description && (
          <p className="text-slate-500 text-xs mt-1 line-clamp-2">{opportunity.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${opportunity.relevance_score}%` }}
            />
          </div>
          <span className="text-slate-600 text-xs">{Math.round(opportunity.relevance_score)}</span>
        </div>
      </div>

      {opportunity.event_date && (
        <div className="text-xs text-emerald-400 font-medium border-t border-slate-800 pt-2">
          📅 {new Date(opportunity.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}
