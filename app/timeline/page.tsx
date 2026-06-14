import { db } from '@/lib/db';
import type { Opportunity } from '@/lib/db';

function groupByMonth(opportunities: Opportunity[]): Record<string, Opportunity[]> {
  const groups: Record<string, Opportunity[]> = {};
  for (const op of opportunities) {
    if (!op.event_date) continue;
    const date = new Date(op.event_date);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(op);
  }
  return groups;
}

const CATEGORY_COLORS: Record<string, string> = {
  conference: 'bg-violet-900 border-violet-700 text-violet-300',
  event: 'bg-emerald-900 border-emerald-700 text-emerald-300',
  trend: 'bg-cyan-900 border-cyan-700 text-cyan-300',
  tool: 'bg-blue-900 border-blue-700 text-blue-300',
  market: 'bg-amber-900 border-amber-700 text-amber-300',
};

export default function TimelinePage() {
  const allWithDates = db.getOpportunities({
    limit: 200,
    orderBy: 'event_date',
    orderDir: 'ASC',
  }).filter((o: Opportunity) => o.event_date);

  const upcoming = allWithDates.filter((o: Opportunity) => new Date(o.event_date!) >= new Date());
  const past = allWithDates.filter((o: Opportunity) => new Date(o.event_date!) < new Date());

  const upcomingGroups = groupByMonth(upcoming);
  const pastGroups = groupByMonth(past);

  const today = new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Timeline</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {upcoming.length} upcoming events · {past.length} past
        </p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-400 text-lg font-medium">No events yet</p>
          <p className="text-slate-600 text-sm mt-1">Add opportunities with dates, or run a scan</p>
          <a href="/opportunities" className="inline-block mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">
            + Add Opportunity
          </a>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(upcomingGroups).map(([month, events]) => (
            <div key={month}>
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                {month}
              </h2>
              <div className="space-y-3 ml-4 border-l border-slate-800 pl-6">
                {events.map((op: Opportunity) => {
                  const date = new Date(op.event_date!);
                  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / 86400000);
                  const colorClass = CATEGORY_COLORS[op.category] ?? CATEGORY_COLORS.event;
                  const tags: string[] = JSON.parse(op.tags || '[]');
                  return (
                    <div key={op.id} className="relative">
                      <div className="absolute -left-[calc(1.5rem+5px)] top-4 w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-white font-bold text-lg">
                                {date.getDate()}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border capitalize ${colorClass}`}>
                                {op.category}
                              </span>
                              {daysUntil <= 7 && daysUntil > 0 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-red-950 border border-red-800 text-red-400">
                                  {daysUntil === 1 ? 'Tomorrow!' : `In ${daysUntil} days`}
                                </span>
                              )}
                            </div>
                            {op.url ? (
                              <a href={op.url} target="_blank" rel="noopener noreferrer" className="text-slate-100 font-semibold hover:text-indigo-300 transition-colors">
                                {op.title}
                              </a>
                            ) : (
                              <p className="text-slate-100 font-semibold">{op.title}</p>
                            )}
                            {op.description && (
                              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{op.description}</p>
                            )}
                            {tags.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {tags.slice(0, 4).map(tag => (
                                  <span key={tag} className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-slate-300 text-sm font-medium">
                              {daysUntil > 0 ? `${daysUntil}d` : daysUntil === 0 ? 'Today' : 'Past'}
                            </div>
                            <div className="text-slate-600 text-xs">{op.source_name}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Past events (collapsed) */}
          {Object.keys(pastGroups).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-slate-600 text-sm hover:text-slate-400 transition-colors list-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                {past.length} past events
              </summary>
              <div className="mt-4 space-y-8 opacity-60">
                {Object.entries(pastGroups).map(([month, events]) => (
                  <div key={month}>
                    <h2 className="text-slate-500 font-bold text-base mb-3">{month}</h2>
                    <div className="space-y-2 ml-4 border-l border-slate-800 pl-6">
                      {events.map((op: Opportunity) => (
                        <div key={op.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                          <p className="text-slate-400 text-sm font-medium">{op.title}</p>
                          <p className="text-slate-600 text-xs mt-0.5">
                            {new Date(op.event_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
